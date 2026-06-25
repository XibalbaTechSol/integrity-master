import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log("Navigating...");
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
    
    // Scroll to bottom
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for any lazy loading
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ path: 'screenshot_footer_5174.png' });
    console.log("Took screenshot");
    
    await browser.close();
})();
