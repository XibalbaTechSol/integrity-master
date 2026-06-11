const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const brainDir = '/home/xibalba/.gemini/antigravity/brain/ff8c246e-e85d-4f0e-b463-775dac2f65b1/visual_audit_verified';
const localDir = '/home/xibalba/Desktop/personal-site/visual_audit_verified';

fs.mkdirSync(brainDir, { recursive: true });
fs.mkdirSync(localDir, { recursive: true });

async function saveScreenshot(page, filename, options = {}) {
    const localPath = path.join(localDir, filename);
    const brainPath = path.join(brainDir, filename);
    await page.screenshot({ path: localPath, ...options });
    fs.copyFileSync(localPath, brainPath);
    console.log(`Saved screenshot: ${filename}`);
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    
    // 1. Desktop Screenshots (1280x800)
    const contextDesktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await contextDesktop.newPage();
    const filePath = `file://${path.join(__dirname, 'index.html')}`;
    
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    // For trigger reveal animations
    await page.evaluate(() => {
        document.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible'));
    });
    await page.waitForTimeout(500);

    // Desktop Dark Mode
    await saveScreenshot(page, 'verified_desktop_dark_full.png', { fullPage: true });

    // Desktop Light Mode & Outlined Button Check
    await page.click('#theme-toggle');
    await page.waitForTimeout(500);
    await saveScreenshot(page, 'verified_desktop_light_full.png', { fullPage: true });
    
    // Zoom/crop to see button outline in light mode
    const btnOutline = await page.$('.btn-outline');
    if (btnOutline) {
        await btnOutline.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await btnOutline.screenshot({ path: path.join(localDir, 'verified_desktop_light_btn_outline.png') });
        fs.copyFileSync(
            path.join(localDir, 'verified_desktop_light_btn_outline.png'),
            path.join(brainDir, 'verified_desktop_light_btn_outline.png')
        );
        console.log("Saved verified_desktop_light_btn_outline.png");
    }

    await contextDesktop.close();

    // 2. Mobile Screenshots (375x812)
    const contextMobile = await browser.newContext({
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    const mobilePage = await contextMobile.newPage();
    await mobilePage.goto(filePath);
    await mobilePage.waitForLoadState('networkidle');
    await mobilePage.evaluate(() => {
        document.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible'));
    });
    await mobilePage.waitForTimeout(500);

    // Mobile Dark Mode
    await saveScreenshot(mobilePage, 'verified_mobile_dark_full.png', { fullPage: true });
    
    // Mobile Dark Hero screenshot specifically
    const hero = await mobilePage.$('header.hero');
    if (hero) {
        await hero.screenshot({ path: path.join(localDir, 'verified_mobile_dark_hero.png') });
        fs.copyFileSync(
            path.join(localDir, 'verified_mobile_dark_hero.png'),
            path.join(brainDir, 'verified_mobile_dark_hero.png')
        );
        console.log("Saved verified_mobile_dark_hero.png");
    }

    // Open Mobile Menu in Dark Mode
    await mobilePage.click('.hamburger');
    await mobilePage.waitForTimeout(500);
    await saveScreenshot(mobilePage, 'verified_mobile_menu_open_dark.png');
    
    // Close menu, switch to light mode, and take light mode screenshots
    await mobilePage.click('.hamburger'); // close menu
    await mobilePage.waitForTimeout(300);
    await mobilePage.click('#theme-toggle'); // switch to light
    await mobilePage.waitForTimeout(500);
    
    await saveScreenshot(mobilePage, 'verified_mobile_light_full.png', { fullPage: true });

    // Open Mobile Menu in Light Mode
    await mobilePage.click('.hamburger');
    await mobilePage.waitForTimeout(500);
    await saveScreenshot(mobilePage, 'verified_mobile_menu_open_light.png');

    await contextMobile.close();
    await browser.close();
    console.log("Screenshot verification complete!");
})();
