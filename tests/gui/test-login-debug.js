const axios = require('axios');
const cheerio = require('cheerio');

async function debugLogin() {
    const baseURL = 'http://localhost:3004';
    let cookies = '';

    async function makeRequest(method, url, data = null, followRedirects = false) {
        try {
            const config = {
                method,
                url: `${baseURL}${url}`,
                headers: {
                    'Cookie': cookies,
                    'User-Agent': 'Mozilla/5.0'
                },
                validateStatus: () => true,
                maxRedirects: followRedirects ? 5 : 0
            };

            if (data && method === 'POST') {
                config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                config.data = new URLSearchParams(data).toString();
            }

            console.log(`Making request: ${method} ${url}`);
            if (data) {
                console.log('Data:', data);
            }
            
            const response = await axios(config);
            
            console.log(`Response status: ${response.status}`);
            console.log(`Response headers:`, response.headers);
            
            if (response.headers['set-cookie']) {
                console.log('Set-Cookie headers:', response.headers['set-cookie']);
                const sessionCookie = response.headers['set-cookie']
                    .find(cookie => cookie.startsWith('connect.sid'))
                    ?.split(';')[0];
                
                if (sessionCookie) {
                    cookies = sessionCookie;
                    console.log('Updated cookies:', cookies);
                }
            }
            
            // Log part of response body
            if (response.data && typeof response.data === 'string') {
                console.log('Response body (first 500 chars):');
                console.log(response.data.substring(0, 500));
                console.log('...');
            }
            
            return response;
        } catch (error) {
            console.error(`Request failed: ${method} ${url}`, error.message);
            return { status: 500, data: error.message };
        }
    }

    try {
        console.log('='.repeat(60));
        console.log('🔍 DEBUGGING LOGIN PROCESS');
        console.log('='.repeat(60));
        
        // Step 1: Get login form
        console.log('\\n1. Getting login form...');
        const loginFormResponse = await makeRequest('GET', '/login');
        
        if (loginFormResponse.status !== 200) {
            console.log('❌ Failed to get login form');
            return;
        }
        
        const $ = cheerio.load(loginFormResponse.data);
        const csrfToken = $('input[name="_csrf"]').val() || '';
        console.log('CSRF Token found:', csrfToken ? 'YES' : 'NO');
        console.log('CSRF Token value:', csrfToken);
        
        // Step 2: Submit login form
        console.log('\\n2. Submitting login form...');
        const loginData = { 
            username: 'admin', 
            password: 'admin123',
            _csrf: csrfToken
        };
        
        const loginResponse = await makeRequest('POST', '/login', loginData);
        
        console.log('\\n3. Analyzing login response...');
        if (loginResponse.status === 302) {
            console.log('✅ Login successful - got redirect');
            console.log('Redirect location:', loginResponse.headers.location);
        } else if (loginResponse.status === 200) {
            console.log('⚠️ Login returned 200 instead of redirect');
            
            // Check if there's an error message in the response
            const $response = cheerio.load(loginResponse.data);
            const errorMessage = $response('.bg-red-50').text().trim();
            if (errorMessage) {
                console.log('Error message found:', errorMessage);
            }
            
            const successMessage = $response('.bg-green-50').text().trim();
            if (successMessage) {
                console.log('Success message found:', successMessage);
            }
        } else {
            console.log('❌ Unexpected login response status');
        }
        
        // Step 3: Test accessing protected page
        console.log('\\n4. Testing access to protected page...');
        const dashboardResponse = await makeRequest('GET', '/');
        
        if (dashboardResponse.status === 200) {
            console.log('✅ Successfully accessed dashboard');
        } else if (dashboardResponse.status === 302) {
            console.log('🔄 Dashboard redirected to:', dashboardResponse.headers.location);
        } else {
            console.log('❌ Failed to access dashboard');
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

console.log('🔍 Starting Login Debug...');
debugLogin();