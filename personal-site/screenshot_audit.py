import asyncio
import os
from playwright.async_api import async_playwright

async def audit_theme(page, theme_name):
    print(f"Auditing {theme_name} mode...")
    
    # Toggle theme if needed
    current_is_light = await page.evaluate("document.documentElement.classList.contains('light-mode')")
    if (theme_name == "Clinical" and not current_is_light) or (theme_name == "Dev" and current_is_light):
        await page.click("#theme-toggle")
        await page.wait_for_timeout(500) # Wait for transition

    sections = [
        "nav", "header.hero", "section#problem", "section#value-prop", 
        "section#how-it-works", "section#architecture", "section#about", 
        "section#contact", "footer"
    ]
    
    os.makedirs(f"screenshots/{theme_name.lower()}", exist_ok=True)
    
    issues = []
    
    for selector in sections:
        element = await page.query_selector(selector)
        if element:
            # Take screenshot
            path = f"screenshots/{theme_name.lower()}/{selector.replace('#', '').replace('.', '_')}.png"
            await element.screenshot(path=path)
            
            # Audit dimensions and visibility
            box = await element.bounding_box()
            is_visible = await element.is_visible()
            
            if not is_visible:
                issues.append(f"[{theme_name}] {selector} is not visible.")
            if box and box['width'] > 1100: # Max container width is 1100
                 # Check if children overflow
                 overflow = await page.evaluate(f"(sel) => {{ const el = document.querySelector(sel); return el.scrollWidth > el.clientWidth; }}", selector)
                 if overflow:
                     issues.append(f"[{theme_name}] {selector} has horizontal overflow.")
        else:
            issues.append(f"[{theme_name}] {selector} not found.")

    return issues

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # Use absolute path
        file_path = f"file://{os.getcwd()}/index.html"
        await page.goto(file_path)
        await page.wait_for_load_state("networkidle")
        
        # Ensure animations are done
        await page.evaluate("document.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible'))")
        
        all_issues = []
        all_issues.extend(await audit_theme(page, "Dev"))
        all_issues.extend(await audit_theme(page, "Clinical"))
        
        print("\n--- UI Audit Results ---")
        if not all_issues:
            print("No major layout issues detected by Playwright.")
        for issue in all_issues:
            print(issue)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
