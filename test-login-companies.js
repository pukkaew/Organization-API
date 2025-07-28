const puppeteer = require('puppeteer');

async function testLogin() {
    console.log('🔍 Testing Login and Companies page...\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Navigate to login page
        console.log('📍 Navigating to login page...');
        await page.goto('http://localhost:3008/login');
        
        // Fill login form (assuming default credentials)
        console.log('🔐 Filling login form...');
        await page.type('input[name="username"]', 'admin');
        await page.type('input[name="password"]', 'admin123');
        
        // Submit login
        console.log('📤 Submitting login...');
        await page.click('button[type="submit"]');
        
        // Wait for redirect to dashboard
        await page.waitForNavigation();
        console.log('✅ Login successful, redirected to:', page.url());
        
        // Navigate to companies page
        console.log('📍 Navigating to companies page...');
        await page.goto('http://localhost:3008/companies');
        
        // Wait for page to load
        await page.waitForTimeout(2000);
        
        // Check for error indicators
        const hasError = await page.$('.error, .alert-danger, .text-red-500') !== null;
        const pageTitle = await page.title();
        const pageContent = await page.content();
        
        console.log('📄 Page title:', pageTitle);
        console.log('❌ Has error indicators:', hasError);
        
        if (hasError) {
            console.log('🔍 Error content found on page');
        } else {
            console.log('✅ No error indicators found');
        }
        
        // Check if companies table exists
        const hasTable = await page.$('table, .company-list') !== null;
        console.log('📊 Has companies table/list:', hasTable);
        
        // Take screenshot for visual verification
        await page.screenshot({ path: 'companies_test_screenshot.png', fullPage: true });
        console.log('📸 Screenshot saved as companies_test_screenshot.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
        console.log('\n🏁 Test completed');
    }
}

// Check if puppeteer is available
try {
    testLogin();
} catch (error) {
    console.log('⚠️  Puppeteer not available, skipping browser test');
    console.log('   Error:', error.message);
    console.log('   To install: npm install puppeteer');
}