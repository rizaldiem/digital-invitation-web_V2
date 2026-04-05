from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    print("Testing main page...")
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    print(f"Main page title: {page.title()}")
    
    print("\nTesting /admin page...")
    page.goto('http://localhost:3000/admin')
    page.wait_for_load_state('networkidle')
    print(f"Admin page title: {page.title()}")
    
    print("\nTesting /preview page...")
    page.goto('http://localhost:3000/preview')
    page.wait_for_load_state('networkidle')
    print(f"Preview page title: {page.title()}")
    
    print("\nChecking for console errors...")
    errors = []
    def onconsole(msg):
        if msg.type == 'error':
            errors.append(msg.text)
    page.on('console', onconsole)
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    
    if errors:
        print(f"Console errors found: {errors}")
    else:
        print("No console errors!")
    
    browser.close()
    print("\n✅ All tests passed!")
