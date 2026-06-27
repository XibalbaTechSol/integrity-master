const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log("Navigating to dashboard...");
        await page.goto('http://localhost:5173/');
        await page.waitForLoadState('networkidle');

        console.log("Clicking Request API Key button...");
        await page.getByText('Request API Key').click();

        console.log("Waiting for Contact Modal...");
        await page.waitForSelector('input[name="name"]', { state: 'visible' });

        console.log("Filling form...");
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'test@xibalbasolutions.com');
        await page.fill('input[name="organization"]', 'Test Org');
        await page.fill('textarea[name="message"]', 'This is a test of the FormSubmit contact form integration.');

        console.log("Submitting form...");
        await page.getByRole('button', { name: /Send Inquiry/i }).click();

        console.log("Waiting for success message...");
        await page.waitForSelector('text=Inquiry Received', { state: 'visible', timeout: 10000 });

        console.log("Taking screenshot...");
        await page.screenshot({ path: '/home/xibalba/.gemini/antigravity-cli/brain/3d415e2c-8937-40e0-991c-6572e0c0775c/contact_form_success.png' });

        console.log("Success!");
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await browser.close();
    }
})();
