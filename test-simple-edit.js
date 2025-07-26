const axios = require('axios');
const cheerio = require('cheerio');

async function testSimpleEdit() {
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
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await request('POST', '/login', { username: 'admin', password: 'admin123' });
        console.log(`Login status: ${loginRes.status}`);
        
        if (loginRes.status !== 302) {
            console.log('❌ Login failed');
            return;
        }

        // 2. Get company edit form
        console.log('\n2. Getting company edit form...');
        const editRes = await request('GET', '/companies/RUXCHAI/edit');
        console.log(`Edit form status: ${editRes.status}`);
        
        if (editRes.status !== 200) {
            console.log('❌ Cannot access edit form');
            return;
        }

        // 3. Extract CSRF token
        const $ = cheerio.load(editRes.data);
        const csrfToken = $('input[name="_csrf"]').val();
        console.log(`CSRF token: ${csrfToken ? 'Found' : 'Not found'}`);

        // 4. Submit update (exactly as the form would)
        console.log('\n3. Submitting update...');
        const updateData = {
            company_name_th: 'บริษัท รักชัย บิสิเนส จำกัด (แก้ไขแล้ว)',
            company_name_en: 'Ruxchai Business Company Limited (Edited)',
            tax_id: '1234567890123',
            website: 'https://www.ruxchai-edited.com',
            email: 'contact@ruxchai-edited.com',
            phone: '02-123-4567',
            address: '123 Edited Street, Bangkok',
            _method: 'PUT'
        };
        
        // CSRF is disabled in development, so don't include empty token

        const updateRes = await request('POST', '/companies/RUXCHAI', updateData);
        console.log(`Update status: ${updateRes.status}`);
        console.log(`Update headers:`, updateRes.headers.location);

        if (updateRes.status === 302) {
            console.log('✅ Company update successful!');
        } else if (updateRes.status === 500) {
            console.log('❌ Server error during update');
            console.log('Response data:', updateRes.data?.substring(0, 200));
        } else {
            console.log(`❌ Update failed with status ${updateRes.status}`);
        }

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testSimpleEdit();