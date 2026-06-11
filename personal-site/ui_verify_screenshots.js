const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const filePath = `file://${path.join(__dirname, 'index.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.evaluate(() => {
        document.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible'));
    });
    
    console.log("Initial scroll position:", await page.evaluate(() => window.scrollY));
    
    // Explicitly scroll to 0,0 with scroll-behavior: auto overrides
    await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';
        window.scrollTo(0, 0);
    });
    
    console.log("Scroll position after scrollTo(0,0):", await page.evaluate(() => window.scrollY));
    
    await browser.close();
})();
