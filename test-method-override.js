const axios = require('axios');

async function testMethodOverride() {
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
        // Login
        console.log('Logging in...');
        const loginRes = await request('POST', '/login', { username: 'admin', password: 'admin123' });
        console.log(`Login status: ${loginRes.status}`);
        
        if (loginRes.status !== 302) {
            console.log('❌ Login failed');
            return;
        }

        console.log('\n=== TESTING METHOD OVERRIDE VARIATIONS ===');
        
        // Test 1: Basic method override
        console.log('1. Testing basic method override...');
        const test1 = await request('POST', '/companies/RUXCHAI', {
            '_method': 'PUT',
            'company_name_th': 'Test 1'
        });
        console.log(`   Result: ${test1.status}`);

        // Test 2: Method override with minimal data (matching what controller expects)
        console.log('2. Testing with minimal required data...');
        const test2 = await request('POST', '/companies/RUXCHAI', {
            '_method': 'PUT',
            'company_name_th': 'บริษัท รักชัย บิสิเนส จำกัด (แก้ไข)'
        });
        console.log(`   Result: ${test2.status}`);
        if (test2.headers.location) {
            console.log(`   Redirect: ${test2.headers.location}`);
        }

        // Test 3: Method override with full data
        console.log('3. Testing with full data...');
        const test3 = await request('POST', '/companies/RUXCHAI', {
            '_method': 'PUT',
            'company_name_th': 'บริษัท รักชัย บิสิเนส จำกัด (แก้ไขเต็ม)',
            'company_name_en': 'Ruxchai Business Company Limited (Full Edit)',
            'tax_id': '1234567890123',
            'website': 'https://www.ruxchai-test.com',
            'email': 'test@ruxchai.com',
            'phone': '02-123-4567',
            'address': '123 Test Street, Bangkok'
        });
        console.log(`   Result: ${test3.status}`);
        if (test3.headers.location) {
            console.log(`   Redirect: ${test3.headers.location}`);
        }

        // Test 4: Compare with direct PUT
        console.log('4. Testing direct PUT...');
        const test4 = await request('PUT', '/companies/RUXCHAI', {
            'company_name_th': 'บริษัท รักชัย บิสิเนส จำกัด (PUT ตรง)'
        });
        console.log(`   Result: ${test4.status}`);
        if (test4.headers.location) {
            console.log(`   Redirect: ${test4.headers.location}`);
        }

        // Test 5: Check if the issue is with the form-encoded data
        console.log('5. Testing with different content type...');
        const config = {
            method: 'POST',
            url: `${baseURL}/companies/RUXCHAI`,
            headers: {
                'Cookie': cookies,
                'Content-Type': 'application/json'
            },
            data: {
                '_method': 'PUT',
                'company_name_th': 'Test JSON'
            },
            validateStatus: () => true,
            maxRedirects: 0
        };
        const test5 = await axios(config);
        console.log(`   Result: ${test5.status} (JSON)`);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testMethodOverride();