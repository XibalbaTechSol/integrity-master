import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log("Navigating...");
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
    
    // Take screenshot of hero section
    await page.screenshot({ path: 'screenshot_hero.png', clip: { x: 0, y: 0, width: 1920, height: 1000 } });
    
    // Scroll down to developer section
    await page.evaluate(() => {
        window.scrollTo(0, 1500); // adjust as needed
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'screenshot_dev_section.png', clip: { x: 0, y: 1500, width: 1920, height: 1000 } });
    
    // Full page screenshot
    await page.screenshot({ path: 'screenshot_landing_full.png', fullPage: true });

    console.log("Took screenshots");
    
    await browser.close();
})();
