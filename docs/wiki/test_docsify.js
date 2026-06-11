const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');

async function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function runDocsifyCrawler() {
  const port = 8083;
  console.log(`Checking if port ${port} is available...`);
  const isAvailable = await checkPort(port);
  if (!isAvailable) {
    console.error(`❌ Port ${port} is already in use. Please free the port and retry.`);
    process.exit(1);
  }

  console.log(`Starting background static web server on port ${port}...`);
  const serverProcess = spawn('python3', ['-m', 'http.server', port.toString()], {
    cwd: '/home/xibalba/wiki',
    detached: true,
    stdio: 'ignore'
  });
  
  // Give the server a moment to start
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('Launching headless Chromium browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to network request failures and non-200 responses to catch 404s of raw .md files
  const networkFailures = [];
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (url.includes(`:${port}`) && status >= 400) {
      console.error(`   ❌ [Network Error] ${status} for asset: ${url}`);
      networkFailures.push({ url, status });
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    const failure = request.failure();
    if (url.includes(`:${port}`)) {
      console.error(`   ❌ [Fetch Failed] ${url} | Reason: ${failure.errorText}`);
      networkFailures.push({ url, error: failure.errorText });
    }
  });

  const rootUrl = `http://localhost:${port}/`;
  const visited = new Set();
  const queue = ['#/index.md'];
  const brokenDocsifyLinks = [];
  const successfulDocsifyPages = [];

  console.log('Starting automated Playwright Docsify SPA crawler...');

  while (queue.length > 0) {
    const currentHash = queue.shift();
    if (visited.has(currentHash)) continue;
    visited.add(currentHash);

    const targetUrl = rootUrl + currentHash;
    console.log(`\nEvaluating SPA Route: ${targetUrl}`);

    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 8000 });
      
      // Give dynamic scripts (KaTeX/Mermaid/Search) a tiny moment to settle
      await page.waitForTimeout(500);

      // Verify that the markdown section exists and has content
      const markdownSection = page.locator('.markdown-section');
      const exists = await markdownSection.count() > 0;
      
      if (!exists) {
        console.error(`   ❌ FAIL: .markdown-section element not found on page!`);
        brokenDocsifyLinks.push({ route: currentHash, error: '.markdown-section missing' });
        continue;
      }

      const contentText = await markdownSection.innerText();
      
      // Check for common error signatures inside Docsify
      if (contentText.toLowerCase().includes('404') && (contentText.toLowerCase().includes('not found') || contentText.toLowerCase().includes('oops'))) {
        console.error(`   ❌ FAIL: 404 / Page Not Found detected in body content!`);
        brokenDocsifyLinks.push({ route: currentHash, error: 'Docsify rendered 404 error page' });
        continue;
      }

      if (contentText.trim().length === 0) {
        console.error(`   ❌ FAIL: Page is blank (0 bytes rendered)!`);
        brokenDocsifyLinks.push({ route: currentHash, error: 'Blank content' });
        continue;
      }

      // Try to read the page title/header
      const pageTitle = await page.locator('.markdown-section h1, .markdown-section h2').first().innerText().catch(() => 'No Header');
      console.log(`   ✅ Status: RENDER SUCCESS`);
      console.log(`   Header: "${pageTitle.trim()}"`);
      successfulDocsifyPages.push({ route: currentHash, title: pageTitle.trim() });

      // Gather all local anchor links inside the rendered markdown section
      const renderedHrefs = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('.markdown-section a'));
        return anchors.map(a => a.getAttribute('href')).filter(Boolean);
      });

      for (let href of renderedHrefs) {
        // Skip external or mailto links
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
          continue;
        }

        // Standardize relative link formats
        let cleanHash = href;
        if (!href.startsWith('#/')) {
          // If the link is concepts/ais.md, format it into hash format #/concepts/ais.md
          if (href.startsWith('#')) {
            // Anchor link on same page
            continue;
          }
          cleanHash = '#/' + href;
        }

        // Clean up redundant dots and slash normalization
        cleanHash = cleanHash.replace('/./', '/');
        
        // Push to crawl queue if not visited
        if (!visited.has(cleanHash) && !queue.includes(cleanHash)) {
          queue.push(cleanHash);
        }
      }

    } catch (err) {
      console.error(`   ❌ FAIL: Route navigation timed out or crashed: ${err.message}`);
      brokenDocsifyLinks.push({ route: currentHash, error: err.message });
    }
  }

  console.log('\nClosing browser...');
  await browser.close();

  console.log('Terminating local static web server...');
  try {
    process.kill(-serverProcess.pid); // Kill process group if detached
  } catch (e) {
    serverProcess.kill();
  }

  console.log('\n==================================================');
  console.log('DOCSIFY PLAYWRIGHT SPA CRAWL SUMMARY:');
  console.log(`Total SPA Pages Crawled: ${visited.size}`);
  console.log(`Successful Pages: ${successfulDocsifyPages.length}`);
  console.log(`Broken Links / Render Failures: ${brokenDocsifyLinks.length}`);
  console.log(`Network/Fetch Errors Encountered: ${networkFailures.length}`);
  console.log('==================================================');

  if (brokenDocsifyLinks.length > 0 || networkFailures.length > 0) {
    console.error('\n❌ ATTESTATION FAILED: Failures detected inside Docsify routing:');
    brokenDocsifyLinks.forEach(b => {
      console.error(`  - Route: ${b.route} | Error: ${b.error}`);
    });
    networkFailures.forEach(n => {
      console.error(`  - Resource: ${n.url} | Status: ${n.status || 'Failed'}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 DOCSIFY ATTESTATION SUCCESS: Every single wiki combination renders flawlessly without any 404 or asset fetch issues!');
    process.exit(0);
  }
}

runDocsifyCrawler().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
