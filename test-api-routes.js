const axios = require('axios');

async function testApiRoutes() {
    const baseURL = 'http://localhost:3004/api';
    const apiKey = 'test-api-key-12345';

    // Helper to make requests
    async function request(method, url, data = null) {
        const config = {
            method,
            url: `${baseURL}${url}`,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            },
            validateStatus: () => true
        };

        if (data) {
            config.data = data;
        }

        return await axios(config);
    }

    console.log('Testing API routes...');
    
    const routes = [
        { method: 'GET', url: '/', desc: 'API root' },
        { method: 'GET', url: '/companies', desc: 'Companies list' },
        { method: 'GET', url: '/branches', desc: 'Branches list' },
        { method: 'GET', url: '/divisions', desc: 'Divisions list' },
        { method: 'GET', url: '/departments', desc: 'Departments list' }
    ];

    for (const route of routes) {
        const res = await request(route.method, route.url);
        console.log(`${route.method.padEnd(4)} ${route.url.padEnd(20)} → ${res.status} (${route.desc})`);
    }
}

testApiRoutes();