const axios = require('axios');
const cheerio = require('cheerio');

async function debugPages() {
    const baseURL = 'http://localhost:3004';
    let cookies = '';

    async function makeRequest(method, url, data = null) {
        try {
            const config = {
                method,
                url: `${baseURL}${url}`,
                headers: {
                    'Cookie': cookies,
                    'User-Agent': 'Mozilla/5.0'
                },
                validateStatus: () => true,
                maxRedirects: 5
            };

            if (data && method === 'POST') {
                config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                config.data = new URLSearchParams(data).toString();
            }

            const response = await axios(config);
            
            if (response.headers['set-cookie']) {
                const sessionCookie = response.headers['set-cookie']
                    .find(cookie => cookie.startsWith('connect.sid'))
                    ?.split(';')[0];
                
                if (sessionCookie) {
                    cookies = sessionCookie;
                }
            }
            
            return response;
        } catch (error) {
            console.error(`Request failed: ${method} ${url}`, error.message);
            return { status: 500, data: error.message };
        }
    }

    try {
        console.log('🔐 Logging in...');
        
        // Get login form
        const loginFormResponse = await makeRequest('GET', '/login');
        console.log('Login form status:', loginFormResponse.status);
        
        const $ = cheerio.load(loginFormResponse.data);
        const csrfToken = $('input[name="_csrf"]').val() || '';
        
        // Login
        const loginResponse = await makeRequest('POST', '/login', { 
            username: 'admin', 
            password: 'admin123',
            _csrf: csrfToken
        });
        console.log('Login status:', loginResponse.status);
        console.log('Login redirect location:', loginResponse.headers.location);
        
        if (loginResponse.status !== 302) {
            console.log('❌ Login failed, stopping test');
            return;
        }
        
        console.log('\\n🧪 Testing problematic pages...');
        
        const problematicPages = [
            '/companies',
            '/branches', 
            '/branches/new',
            '/divisions',
            '/divisions/new',
            '/departments',
            '/departments/new'
        ];
        
        for (const page of problematicPages) {
            console.log(`\\nTesting ${page}:`);
            const response = await makeRequest('GET', page);
            console.log(`  Status: ${response.status}`);
            console.log(`  Location: ${response.headers.location || 'None'}`);
            
            if (response.status === 500) {
                console.log('  ❌ 500 Server Error');
                
                // Try to get error details from the response
                if (response.data && typeof response.data === 'string') {
                    const errorMatch = response.data.match(/Error: (.+?)\\n/);
                    if (errorMatch) {
                        console.log(`  Error: ${errorMatch[1]}`);
                    }
                }
            } else if (response.status === 302) {
                console.log(`  🔄 Redirect to: ${response.headers.location}`);
            } else if (response.status === 200) {
                console.log('  ✅ Page loaded successfully');
                
                const $ = cheerio.load(response.data);
                const title = $('title').text();
                console.log(`  Title: ${title}`);
            }
        }
        
        // Test a known working page
        console.log('\\n✅ Testing known working page (/):');
        const dashboardResponse = await makeRequest('GET', '/');
        console.log(`  Dashboard status: ${dashboardResponse.status}`);
        
    } catch (error) {
        console.error('❌ Debug test failed:', error.message);
    }
}

console.log('🔍 Starting Debug Test...');
debugPages();