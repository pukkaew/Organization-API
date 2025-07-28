const axios = require('axios');
const qs = require('querystring');

async function checkServerLogs() {
    console.log('🔍 Checking Server Runtime and Database Connection...\n');
    
    try {
        // Test 1: Check server health with direct test endpoint
        console.log('═══ 1. SERVER HEALTH CHECK ═══');
        
        try {
            const healthResponse = await axios.get('http://localhost:3008/health');
            console.log('✅ Health endpoint:', healthResponse.data);
        } catch (error) {
            console.log('❌ Health endpoint not available');
        }
        
        // Test 2: Login and access dashboard
        console.log('\n═══ 2. LOGIN AND DASHBOARD ACCESS ═══');
        
        // Create axios instance with cookie jar
        const client = axios.create({
            timeout: 10000,
            maxRedirects: 5
        });
        
        // Get login page first (to get CSRF token if needed)
        console.log('🔗 Getting login page...');
        const loginPageResponse = await client.get('http://localhost:3008/login');
        console.log(`✅ Login page loaded: ${loginPageResponse.status}`);
        
        // Extract any cookies
        const cookies = loginPageResponse.headers['set-cookie'];
        let cookieHeader = '';
        if (cookies) {
            cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');
            console.log(`🍪 Got cookies: ${cookieHeader}`);
        }
        
        // Perform login
        console.log('🔑 Performing login...');
        const loginData = qs.stringify({
            username: 'admin',
            password: 'admin123'
        });
        
        const loginResponse = await client.post('http://localhost:3008/login', loginData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookieHeader
            },
            maxRedirects: 0,
            validateStatus: function (status) {
                return status < 400; // Accept redirects
            }
        });
        
        console.log(`Login response: ${loginResponse.status}`);
        console.log(`Login headers:`, loginResponse.headers);
        
        // Get session cookie
        const loginCookies = loginResponse.headers['set-cookie'];
        let sessionCookie = cookieHeader;
        if (loginCookies) {
            sessionCookie = loginCookies.map(cookie => cookie.split(';')[0]).join('; ');
            console.log(`🍪 Session cookies: ${sessionCookie}`);
        }
        
        // Access dashboard with session
        console.log('📊 Accessing dashboard...');
        const dashboardResponse = await client.get('http://localhost:3008/', {
            headers: {
                'Cookie': sessionCookie
            }
        });
        
        console.log(`✅ Dashboard loaded: ${dashboardResponse.status}`);
        
        // Check for error messages in HTML
        const htmlContent = dashboardResponse.data;
        const hasError = htmlContent.includes('error') || htmlContent.includes('Error') || htmlContent.includes('500');
        const hasStats = htmlContent.includes('Companies') && htmlContent.includes('Branches');
        
        console.log(`✅ Dashboard has stats: ${hasStats}`);
        console.log(`❌ Dashboard has errors: ${hasError}`);
        
        // Extract stats from HTML if possible
        const companyMatch = htmlContent.match(/Companies[\s\S]*?(\d+)/);
        const branchMatch = htmlContent.match(/Branches[\s\S]*?(\d+)/);
        const divisionMatch = htmlContent.match(/Divisions[\s\S]*?(\d+)/);
        const departmentMatch = htmlContent.match(/Departments[\s\S]*?(\d+)/);
        
        if (companyMatch || branchMatch || divisionMatch || departmentMatch) {
            console.log('\n📊 Extracted stats from HTML:');
            if (companyMatch) console.log(`   Companies: ${companyMatch[1]}`);
            if (branchMatch) console.log(`   Branches: ${branchMatch[1]}`);
            if (divisionMatch) console.log(`   Divisions: ${divisionMatch[1]}`);
            if (departmentMatch) console.log(`   Departments: ${departmentMatch[1]}`);
        }
        
        // Test 3: Check database directly via test endpoint
        console.log('\n═══ 3. DATABASE CONNECTION TEST ═══');
        
        try {
            const dbTestResponse = await client.get('http://localhost:3008/test-db', {
                headers: {
                    'Cookie': sessionCookie
                }
            });
            console.log('✅ Database test endpoint:', dbTestResponse.data);
        } catch (error) {
            console.log('❌ Database test endpoint not available');
        }
        
        // Test 4: Test each page to see which ones work
        console.log('\n═══ 4. PAGE-BY-PAGE TEST ═══');
        
        const pages = [
            '/companies',
            '/branches', 
            '/divisions',
            '/departments',
            '/api-keys'
        ];
        
        for (const page of pages) {
            try {
                console.log(`Testing ${page}...`);
                const pageResponse = await client.get(`http://localhost:3008${page}`, {
                    headers: {
                        'Cookie': sessionCookie
                    },
                    timeout: 5000
                });
                
                const pageHtml = pageResponse.data;
                const hasData = pageHtml.includes('table') || pageHtml.includes('card') || pageHtml.includes('item');
                const hasError = pageHtml.includes('error') || pageHtml.includes('Error');
                
                console.log(`   ✅ ${page}: ${pageResponse.status} - Data: ${hasData ? 'Yes' : 'No'} - Error: ${hasError ? 'Yes' : 'No'}`);
                
            } catch (error) {
                console.log(`   ❌ ${page}: ${error.response ? error.response.status : 'Error'} - ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Critical test failure:', error.message);
        if (error.response) {
            console.error(`Response status: ${error.response.status}`);
            console.error(`Response data:`, error.response.data);
        }
    }
}

checkServerLogs();