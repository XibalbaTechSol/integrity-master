const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function auditTheme(page, themeName) {
    console.log(`Auditing ${themeName} mode...`);
    
    const currentIsLight = await page.evaluate(() => document.documentElement.classList.contains('light-mode'));
    if ((themeName === "Clinical" && !currentIsLight) || (themeName === "Dev" && currentIsLight)) {
        await page.click('#theme-toggle');
        await page.waitForTimeout(1000); // Wait for transition
    }

    const sections = [
        "nav", "header.hero", "section#problem", "section#value-prop", 
        "section#how-it-works", "section#architecture", "section#about", 
        "section#contact", "footer"
    ];
    
    const dir = path.join(__dirname, 'screenshots', themeName.toLowerCase());
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const issues = [];
    
    for (const selector of sections) {
        const element = await page.$(selector);
        if (element) {
            const screenshotPath = path.join(dir, `${selector.replace(/#/g, '').replace(/\./g, '_')}.png`);
            await element.screenshot({ path: screenshotPath });
            
            const box = await element.boundingBox();
            const isVisible = await element.isVisible();
            
            if (!isVisible) {
                issues.push(`[${themeName}] ${selector} is not visible.`);
            }
            if (box && box.width > 1200) { // Giving some room beyond 1100
                const overflow = await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    return el.scrollWidth > el.clientWidth;
                }, selector);
                if (overflow) {
                    issues.push(`[${themeName}] ${selector} has horizontal overflow (scrollWidth: ${await page.evaluate(sel => document.querySelector(sel).scrollWidth, selector)}).`);
                }
            }
        } else {
            issues.push(`[${themeName}] ${selector} not found.`);
        }
    }

    return issues;
}

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const filePath = `file://${path.join(__dirname, 'index.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    
    // Ensure animations are triggered
    await page.evaluate(() => {
        document.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible'));
    });
    
    let allIssues = [];
    allIssues = allIssues.concat(await auditTheme(page, "Dev"));
    allIssues = allIssues.concat(await auditTheme(page, "Clinical"));
    
    console.log("\n--- UI Audit Results ---");
    if (allIssues.length === 0) {
        console.log("No major layout issues detected by Playwright.");
    } else {
        allIssues.forEach(issue => console.log(issue));
    }
    
    await browser.close();
})();
