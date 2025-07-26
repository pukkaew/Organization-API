const axios = require('axios');
const cheerio = require('cheerio');

async function debugForm() {
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
        const loginRes = await request('POST', '/login', { username: 'admin', password: 'admin123' });
        console.log(`Login status: ${loginRes.status}`);
        
        // Get edit form
        const editRes = await request('GET', '/companies/RUXCHAI/edit');
        console.log(`Edit form status: ${editRes.status}`);
        
        if (editRes.status === 200) {
            const $ = cheerio.load(editRes.data);
            
            // Debug form structure
            console.log('\n=== FORM DEBUG ===');
            const form = $('form');
            console.log(`Found ${form.length} form(s)`);
            
            if (form.length > 0) {
                console.log(`Form method: ${form.attr('method')}`);
                console.log(`Form action: ${form.attr('action')}`);
                
                // Look for _method field
                const methodField = $('input[name="_method"]');
                console.log(`_method field: ${methodField.length > 0 ? methodField.val() : 'NOT FOUND'}`);
                
                // Look for CSRF field
                const csrfField = $('input[name="_csrf"]');
                console.log(`CSRF field: ${csrfField.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
                if (csrfField.length > 0) {
                    console.log(`CSRF value: ${csrfField.val()}`);
                }
                
                // List all input fields
                console.log('\nAll input fields:');
                $('input').each((i, el) => {
                    const $el = $(el);
                    console.log(`- ${$el.attr('name')}: ${$el.attr('type')} = "${$el.val()}"`);
                });
                
                // Show form HTML snippet
                console.log('\nForm HTML snippet:');
                console.log(form.html().substring(0, 500) + '...');
            }
        }

    } catch (error) {
        console.error('Debug failed:', error.message);
    }
}

debugForm();