import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 4000));

const dir = '/home/xibalba/Projects/INTEGRITY/integrity-dashboard/screenshots';

// Get actual scrollable element and total height
const info = await page.evaluate(() => {
  const body = document.body;
  const html = document.documentElement;
  const scrollEl = document.querySelector('[style*="overflowX"]') || document.documentElement;
  return {
    bodyScrollHeight: body.scrollHeight,
    htmlScrollHeight: html.scrollHeight,
    windowInnerHeight: window.innerHeight,
    scrollElTag: scrollEl.tagName,
    scrollElClass: scrollEl.className,
    scrollElScrollHeight: scrollEl.scrollHeight,
    scrollElClientHeight: scrollEl.clientHeight,
    currentScrollY: window.scrollY,
  };
});
console.log('Page info:', JSON.stringify(info, null, 2));

// Try full-page screenshot 
await page.screenshot({ 
  path: `${dir}/audit_fullpage.png`,
  fullPage: true
});
console.log('Full page screenshot taken');

// Also take viewport-sized strips at specific document positions using CDP
const client = await page.createCDPSession();

const positions = [
  { y: 0, name: 'audit_01_hero' },
  { y: 1200, name: 'audit_02_trust_gap' },
  { y: 2400, name: 'audit_03_devquickstart' },
  { y: 3700, name: 'audit_04_escrows' },
  { y: 5200, name: 'audit_05_tiers' },
  { y: 7200, name: 'audit_06_vitals' },
  { y: 9200, name: 'audit_07_economics' },
  { y: 12200, name: 'audit_08_token_dao' },
  { y: info.bodyScrollHeight - 900, name: 'audit_09_footer' },
];

for (const s of positions) {
  // Use CDP to scroll to position
  await client.send('Runtime.evaluate', {
    expression: `window.scrollTo(0, ${s.y})`,
  });
  await new Promise(r => setTimeout(r, 1500));
  
  // Check current scroll position
  const scrollY = await page.evaluate(() => window.scrollY);
  console.log(`Expected y=${s.y}, actual scrollY=${scrollY}`);
  
  await page.screenshot({ 
    path: `${dir}/${s.name}.png`,
    clip: { x: 0, y: 0, width: 1440, height: 900 }
  });
  console.log(`Screenshot: ${s.name}`);
}

await browser.close();
console.log('Done!');
