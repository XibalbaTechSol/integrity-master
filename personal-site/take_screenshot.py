import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("https://xibalbatechsol.github.io/")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(4500) # Wait for animations
        
        # Take screenshot and save to artifacts directory
        await page.screenshot(path="/home/xibalba/.gemini/antigravity/brain/ddbf4768-2e12-474c-8e1a-6f23990f3168/live_site_screenshot.png", full_page=True)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
