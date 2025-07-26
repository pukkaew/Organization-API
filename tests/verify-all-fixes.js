const axios = require('axios');
const cheerio = require('cheerio');

class FixVerifier {
    constructor() {
        this.baseURL = 'http://localhost:3004';
        this.cookies = '';
        this.results = [];
    }

    async makeRequest(method, url, data = null, options = {}) {
        try {
            const config = {
                method,
                url: `${this.baseURL}${url}`,
                headers: {
                    'Cookie': this.cookies,
                    'User-Agent': 'Mozilla/5.0',
                    ...options.headers
                },
                validateStatus: () => true,
                maxRedirects: options.followRedirects ? 5 : 0,
                ...options
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                config.data = new URLSearchParams(data).toString();
            }

            const response = await axios(config);
            
            if (response.headers['set-cookie']) {
                const sessionCookie = response.headers['set-cookie']
                    .find(cookie => cookie.startsWith('connect.sid'))
                    ?.split(';')[0];
                
                if (sessionCookie) {
                    this.cookies = sessionCookie;
                }
            }
            
            return response;
        } catch (error) {
            console.error(`Request failed: ${method} ${url}`, error.message);
            return { status: 500, data: error.message };
        }
    }

    log(test, passed, details = '') {
        const icon = passed ? '✅' : '❌';
        const result = { test, passed, details };
        this.results.push(result);
        console.log(`${icon} ${test}${details ? ` - ${details}` : ''}`);
        return passed;
    }

    async login() {
        console.log('\n🔐 Testing Login...');
        
        const loginFormResponse = await this.makeRequest('GET', '/login');
        if (loginFormResponse.status !== 200) {
            this.log('Get login form', false, `Status: ${loginFormResponse.status}`);
            return false;
        }
        
        const $ = cheerio.load(loginFormResponse.data);
        const csrfToken = $('input[name="_csrf"]').val() || '';
        
        const loginData = { 
            username: 'admin', 
            password: 'admin123',
            _csrf: csrfToken
        };
        
        const loginResponse = await this.makeRequest('POST', '/login', loginData);
        const success = loginResponse.status === 302 && loginResponse.headers.location === '/';
        this.log('Admin login', success, `Status: ${loginResponse.status}`);
        return success;
    }

    async testAllPages() {
        console.log('\n📄 Testing All Pages (List & Forms)...');
        
        const pages = [
            // List pages
            { name: 'Dashboard', url: '/', expectStatus: 200 },
            { name: 'Companies list', url: '/companies', expectStatus: 200 },
            { name: 'Branches list', url: '/branches', expectStatus: 200 },
            { name: 'Divisions list', url: '/divisions', expectStatus: 200 },
            { name: 'Departments list', url: '/departments', expectStatus: 200 },
            
            // Create forms
            { name: 'Company create form', url: '/companies/new', expectStatus: 200, checkForm: true },
            { name: 'Branch create form', url: '/branches/new', expectStatus: 200, checkForm: true },
            { name: 'Division create form', url: '/divisions/new', expectStatus: 200, checkForm: true },
            { name: 'Department create form', url: '/departments/new', expectStatus: 200, checkForm: true }
        ];

        for (const page of pages) {
            const response = await this.makeRequest('GET', page.url, null, { followRedirects: true });
            const passed = response.status === page.expectStatus;
            
            this.log(page.name, passed, `Status: ${response.status}`);
            
            if (passed && page.checkForm && response.data) {
                const $ = cheerio.load(response.data);
                const hasForm = $('form[method="post"]').length > 0;
                const hasSubmit = $('button[type="submit"]').length > 0;
                const hasCsrf = $('input[name="_csrf"]').length > 0;
                
                this.log(`${page.name} - Form element`, hasForm);
                this.log(`${page.name} - Submit button`, hasSubmit);
                this.log(`${page.name} - CSRF token`, hasCsrf);
            }
        }
    }

    async testCRUDOperations() {
        console.log('\n🔧 Testing CRUD Operations...');
        
        // Test Company Creation
        const companyFormResponse = await this.makeRequest('GET', '/companies/new', null, { followRedirects: true });
        if (companyFormResponse.status === 200) {
            const $ = cheerio.load(companyFormResponse.data);
            const csrfToken = $('input[name="_csrf"]').val() || '';
            
            const timestamp = Date.now();
            const companyCode = 'TEST' + timestamp;
            
            const companyData = {
                company_code: companyCode,
                company_name_th: 'บริษัททดสอบ จำกัด',
                company_name_en: 'Test Company Limited',
                tax_id: '1234567890123',
                _csrf: csrfToken
            };
            
            const createResponse = await this.makeRequest('POST', '/companies', companyData);
            this.log('Company creation', createResponse.status === 302, `Status: ${createResponse.status}`);
            
            // Test if it was saved to database
            if (createResponse.status === 302) {
                const listResponse = await this.makeRequest('GET', '/companies', null, { followRedirects: true });
                if (listResponse.status === 200) {
                    const $list = cheerio.load(listResponse.data);
                    const found = $list('td').filter((i, el) => $(el).text().includes(companyCode)).length > 0;
                    this.log('Company appears in list', found);
                }
            }
            
            return companyCode;
        }
        
        return null;
    }

    async testDatabaseConnection() {
        console.log('\n🗄️ Testing Database Connection...');
        
        try {
            const { connectDatabase, executeQuery } = require('../src/config/database');
            
            await connectDatabase();
            this.log('MSSQL connection', true);
            
            const result = await executeQuery('SELECT COUNT(*) as count FROM Companies', {});
            this.log('Query execution', true, `Companies count: ${result.recordset[0].count}`);
            
            return true;
        } catch (error) {
            this.log('Database connection', false, error.message);
            return false;
        }
    }

    async runAllTests() {
        console.log('🚀 VERIFYING ALL FIXES');
        console.log('='.repeat(60));
        
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.log('\n❌ Cannot proceed without login');
            return;
        }
        
        await this.testAllPages();
        await this.testCRUDOperations();
        await this.testDatabaseConnection();
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        
        const total = this.results.length;
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const rate = ((passed / total) * 100).toFixed(1);
        
        console.log(`Total tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success rate: ${rate}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed tests:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`  - ${r.test}: ${r.details}`);
            });
        }
        
        if (rate >= 100) {
            console.log('\n🎉 ALL FIXES VERIFIED! 100% FUNCTIONALITY ACHIEVED!');
        } else if (rate >= 90) {
            console.log('\n✅ Most fixes are working correctly.');
        } else {
            console.log('\n⚠️ Some issues remain to be fixed.');
        }
        
        return { total, passed, failed, rate: parseFloat(rate) };
    }
}

// Run verification
console.log('Starting verification of all fixes...\n');

const verifier = new FixVerifier();
verifier.runAllTests()
    .then(results => {
        if (results && results.rate === 100) {
            console.log('\n✨ Perfect! All issues have been resolved!');
            process.exit(0);
        } else {
            console.log('\n⚠️ Some issues remain. Please check the failed tests above.');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    });