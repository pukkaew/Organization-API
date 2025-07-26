const axios = require('axios');
const cheerio = require('cheerio');

async function testSimpleAdd() {
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
                maxRedirects: 0
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
        const loginResponse = await makeRequest('POST', '/login', { username: 'admin', password: 'admin123' });
        console.log('Login Status:', loginResponse.status);
        
        if (loginResponse.status !== 302) {
            console.log('❌ Login failed');
            return;
        }
        
        console.log('\\n📝 Getting company create form...');
        const formResponse = await makeRequest('GET', '/companies/new');
        console.log('Form Status:', formResponse.status);
        
        if (formResponse.status !== 200) {
            console.log('❌ Could not access form');
            console.log('Response:', formResponse.data.substring(0, 500));
            return;
        }
        
        const $ = cheerio.load(formResponse.data);
        const csrfToken = $('input[name="_csrf"]').val() || '';
        console.log('CSRF Token:', csrfToken ? 'Found' : 'Not found');
        
        console.log('\\n🏢 Creating test company...');
        const timestamp = Date.now();
        const companyData = {
            company_code: 'TEST' + timestamp,
            company_name_th: 'บริษัททดสอบ จำกัด',
            company_name_en: 'Test Company Ltd',
            tax_id: '1234567890123',
            _csrf: csrfToken
        };
        
        console.log('Company Data:', companyData);
        
        const createResponse = await makeRequest('POST', '/companies', companyData);
        console.log('Create Status:', createResponse.status);
        console.log('Response Headers:', createResponse.headers.location || 'No location header');
        
        if (createResponse.status === 302) {
            console.log('✅ Company creation returned 302 (redirect)');
        } else {
            console.log('❌ Company creation failed');
            if (createResponse.data) {
                console.log('Response body:', createResponse.data.substring(0, 1000));
            }
        }
        
        // Check if company was actually created
        console.log('\\n🔍 Checking if company was created in database...');
        const { connectDatabase, executeQuery } = require('../../src/config/database');
        
        try {
            await connectDatabase();
            const result = await executeQuery('SELECT COUNT(*) as count FROM Companies WHERE company_code = @code', {
                code: companyData.company_code
            });
            
            console.log('Companies with this code:', result.recordset[0].count);
            
            if (result.recordset[0].count > 0) {
                console.log('✅ Company was created in database');
                
                const companyDetails = await executeQuery('SELECT * FROM Companies WHERE company_code = @code', {
                    code: companyData.company_code
                });
                
                console.log('Company details:', companyDetails.recordset[0]);
            } else {
                console.log('❌ Company was NOT created in database');
            }
            
        } catch (dbError) {
            console.log('❌ Database check failed:', dbError.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSimpleAdd();