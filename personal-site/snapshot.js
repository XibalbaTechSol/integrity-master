const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto("http://localhost:8080");
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
        document.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible'));
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/xibalba/.gemini/antigravity/brain/a1d660f8-6376-495c-a2de-af0f5a205a26/site_screenshot.png', fullPage: true });
    
    // Light mode
    await page.evaluate(() => document.documentElement.classList.add('light-mode'));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/home/xibalba/.gemini/antigravity/brain/a1d660f8-6376-495c-a2de-af0f5a205a26/site_screenshot_light.png', fullPage: true });

    await browser.close();
})();
