import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("file:///home/xibalba/Desktop/personal-site/index.html")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(4500) # Wait for animations
        
        # Take dark mode screenshot
        await page.screenshot(path="screenshot_dark.png", full_page=True)
        
        # Switch to light mode
        await page.evaluate("document.documentElement.classList.add('light-mode')")
        await page.wait_for_timeout(500)
        await page.screenshot(path="screenshot_light.png", full_page=True)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
