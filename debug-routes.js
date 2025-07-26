const axios = require('axios');

async function debugRoutes() {
    const baseURL = 'http://localhost:3004';
    let cookies = '';

    // Helper to make requests
    async function request(method, url, data = null) {
        const config = {
            method,
            url: `${baseURL}${url}`,
            headers: {
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0'
            },
            validateStatus: () => true,
            maxRedirects: 0
        };

        if (data) {
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
    }

    try {
        // Login first
        console.log('Logging in...');
        const loginRes = await request('POST', '/login', { username: 'admin', password: 'admin123' });
        console.log(`Login status: ${loginRes.status}`);
        
        if (loginRes.status !== 302) {
            console.log('❌ Login failed');
            return;
        }

        // Test various routes to debug
        console.log('\n=== ROUTE DEBUG ===');
        
        const routes = [
            { method: 'GET', url: '/companies', desc: 'Companies list' },
            { method: 'GET', url: '/companies/RUXCHAI', desc: 'Company view (if exists)' },
            { method: 'GET', url: '/companies/RUXCHAI/edit', desc: 'Company edit form' },
            { method: 'POST', url: '/companies/RUXCHAI', desc: 'POST to company (no _method)' },
            { method: 'PUT', url: '/companies/RUXCHAI', desc: 'Direct PUT to company' }
        ];
        
        for (const route of routes) {
            let data = null;
            if (route.method === 'POST') {
                data = { test: 'data' };  // Simple test data
            } else if (route.method === 'PUT') {
                data = { company_name_th: 'Test Update' };
            }
            
            const res = await request(route.method, route.url, data);
            console.log(`${route.method.padEnd(4)} ${route.url.padEnd(30)} → ${res.status} (${route.desc})`);
            
            if (res.headers.location) {
                console.log(`     Redirects to: ${res.headers.location}`);
            }
        }

        console.log('\n=== TESTING METHOD OVERRIDE ===');
        // Test POST with _method override
        const overrideRes = await request('POST', '/companies/RUXCHAI', {
            company_name_th: 'Test Update via Method Override',
            _method: 'PUT'
        });
        console.log(`POST with _method=PUT → ${overrideRes.status}`);
        if (overrideRes.headers.location) {
            console.log(`Redirects to: ${overrideRes.headers.location}`);
        }

    } catch (error) {
        console.error('Debug failed:', error.message);
    }
}

debugRoutes();