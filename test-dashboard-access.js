const axios = require('axios');
const puppeteer = require('puppeteer');

async function testDashboardAccess() {
    console.log('🔍 Testing Dashboard Access and Error Detection...\n');
    
    let browser;
    try {
        // Test 1: HTTP Request to Dashboard
        console.log('═══ 1. HTTP REQUEST TEST ═══');
        try {
            const response = await axios.get('http://localhost:3008/', {
                timeout: 10000,
                validateStatus: function (status) {
                    return status < 500; // Accept anything that's not a server error
                }
            });
            
            console.log(`Status: ${response.status}`);
            console.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);
            
            if (response.status === 302) {
                console.log(`Redirect to: ${response.headers.location}`);
            }
            
        } catch (error) {
            console.log(`❌ HTTP Error: ${error.message}`);
            if (error.response) {
                console.log(`Response status: ${error.response.status}`);
                console.log(`Response data: ${error.response.data}`);
            }
        }
        
        // Test 2: Login and Access Dashboard
        console.log('\n═══ 2. BROWSER ACCESS TEST ═══');
        browser = await puppeteer.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1280, height: 720 }
        });
        
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            console.log(`🌐 Browser Console [${msg.type()}]: ${msg.text()}`);
        });
        
        // Enable error logging
        page.on('pageerror', error => {
            console.log(`❌ Page Error: ${error.message}`);
        });
        
        page.on('response', response => {
            if (response.status() >= 400) {
                console.log(`🔴 HTTP ${response.status()}: ${response.url()}`);
            }
        });
        
        // Go to dashboard
        console.log('🔗 Navigating to dashboard...');
        await page.goto('http://localhost:3008/', { 
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        // Check if we're on login page
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/login')) {
            console.log('🔑 Login required, performing login...');
            
            // Perform login
            await page.waitForSelector('input[name="username"], #username', { timeout: 5000 });
            await page.type('input[name="username"], #username', 'admin');
            await page.type('input[name="password"], #password', 'admin123');
            
            await page.click('button[type="submit"], .btn');
            await page.waitForNavigation({ timeout: 15000 });
            
            console.log(`After login URL: ${page.url()}`);
        }
        
        // Check for dashboard content
        console.log('\n═══ 3. DASHBOARD CONTENT CHECK ═══');
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        // Check statistics cards
        const statsCheck = await page.evaluate(() => {
            const companiesCard = document.querySelector('[data-stat="companies"], dd:contains("Companies")');
            const branchesCard = document.querySelector('[data-stat="branches"], dd:contains("Branches")');
            const divisionsCard = document.querySelector('[data-stat="divisions"], dd:contains("Divisions")');
            const departmentsCard = document.querySelector('[data-stat="departments"], dd:contains("Departments")');
            
            // Get all stat numbers
            const statNumbers = Array.from(document.querySelectorAll('dd')).map(dd => ({
                text: dd.textContent.trim(),
                parent: dd.parentElement.textContent.includes('Companies') ? 'companies' :
                       dd.parentElement.textContent.includes('Branches') ? 'branches' :
                       dd.parentElement.textContent.includes('Divisions') ? 'divisions' :
                       dd.parentElement.textContent.includes('Departments') ? 'departments' : 'unknown'
            }));
            
            return {
                hasCompaniesCard: !!companiesCard,
                hasBranchesCard: !!branchesCard,
                hasDivisionsCard: !!divisionsCard,
                hasDepartmentsCard: !!departmentsCard,
                statNumbers: statNumbers,
                pageTitle: document.title,
                hasErrorMessage: !!document.querySelector('.error, .alert-danger'),
                bodyClasses: document.body.className
            };
        });
        
        console.log('Dashboard Content Check:');
        console.log(`✅ Page Title: ${statsCheck.pageTitle}`);
        console.log(`✅ Companies Card: ${statsCheck.hasCompaniesCard ? 'Present' : 'Missing'}`);
        console.log(`✅ Branches Card: ${statsCheck.hasBranchesCard ? 'Present' : 'Missing'}`);
        console.log(`✅ Divisions Card: ${statsCheck.hasDivisionsCard ? 'Present' : 'Missing'}`);
        console.log(`✅ Departments Card: ${statsCheck.hasDepartmentsCard ? 'Present' : 'Missing'}`);
        console.log(`✅ Error Message: ${statsCheck.hasErrorMessage ? 'Present' : 'None'}`);
        
        console.log('\nStatistics Numbers:');
        statsCheck.statNumbers.forEach(stat => {
            if (stat.parent !== 'unknown') {
                console.log(`   📊 ${stat.parent}: ${stat.text}`);
            }
        });
        
        // Take screenshot for debugging
        await page.screenshot({ 
            path: 'dashboard-debug.png',
            fullPage: true
        });
        console.log('\n📸 Screenshot saved as dashboard-debug.png');
        
        // Check network requests
        console.log('\n═══ 4. NETWORK REQUESTS CHECK ═══');
        const requests = [];
        
        page.on('request', request => {
            requests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType()
            });
        });
        
        // Reload page to capture all requests
        await page.reload({ waitUntil: 'networkidle0' });
        
        console.log('Recent requests:');
        requests.slice(-10).forEach(req => {
            console.log(`   ${req.method} ${req.resourceType}: ${req.url}`);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testDashboardAccess();