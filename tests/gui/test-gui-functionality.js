const axios = require('axios');
const cheerio = require('cheerio');

class GUIFunctionalityTester {
    constructor() {
        this.baseURL = 'http://localhost:3004';
        this.cookies = '';
        this.testResults = [];
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
                maxRedirects: 0,
                ...options
            };

            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
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

    logResult(test, success, details = '') {
        const status = success ? '✅' : '❌';
        const result = { test, success, details };
        this.testResults.push(result);
        console.log(`${status} ${test}${details ? ` (${details})` : ''}`);
        return success;
    }

    async login() {
        console.log('🔐 Logging in...');
        const loginData = { username: 'admin', password: 'admin123' };
        const loginResponse = await this.makeRequest('POST', '/login', loginData);
        const success = loginResponse.status === 302;
        this.logResult('Admin login', success, `Status: ${loginResponse.status}`);
        return success;
    }

    async testGUIAddFunctionality() {
        console.log('\\n➕ TESTING ADD FUNCTIONALITY VIA GUI');
        console.log('-'.repeat(50));
        
        // Test Company Add
        console.log('Testing company add form...');
        const companyCreateResponse = await this.makeRequest('GET', '/companies/new');
        
        if (companyCreateResponse.status === 200) {
            const $ = cheerio.load(companyCreateResponse.data);
            const csrfToken = $('input[name="_csrf"]').val() || '';
            
            const companyData = {
                company_code: 'TEST' + Date.now(),
                company_name_th: 'บริษัท ทดสอบ GUI จำกัด',
                company_name_en: 'GUI Test Company Limited',
                tax_id: '1234567890' + String(Date.now()).slice(-3),
                _csrf: csrfToken
            };
            
            const createResponse = await this.makeRequest('POST', '/companies', companyData);
            const createSuccess = createResponse.status === 302;
            this.logResult('Company add via GUI', createSuccess, `Status: ${createResponse.status}`);
        } else {
            this.logResult('Company add form access', false, `Status: ${companyCreateResponse.status}`);
        }

        // Test Branch Add
        console.log('Testing branch add form...');
        const branchCreateResponse = await this.makeRequest('GET', '/branches/new');
        
        if (branchCreateResponse.status === 200) {
            const $ = cheerio.load(branchCreateResponse.data);
            const csrfToken = $('input[name="_csrf"]').val() || '';
            
            const branchData = {
                branch_code: 'RUXCHAI-TEST' + Date.now(),
                company_code: 'RUXCHAI',
                branch_name: 'สาขาทดสอบ GUI',
                is_headquarters: false,
                _csrf: csrfToken
            };
            
            const createResponse = await this.makeRequest('POST', '/branches', branchData);
            const createSuccess = createResponse.status === 302;
            this.logResult('Branch add via GUI', createSuccess, `Status: ${createResponse.status}`);
        } else {
            this.logResult('Branch add form access', false, `Status: ${branchCreateResponse.status}`);
        }
    }

    async testGUIEditFunctionality() {
        console.log('\\n📝 TESTING EDIT FUNCTIONALITY VIA GUI');
        console.log('-'.repeat(50));
        
        // Test Company Edit
        console.log('Testing company edit form...');
        const companyEditResponse = await this.makeRequest('GET', '/companies/RUXCHAI/edit');
        
        if (companyEditResponse.status === 200) {
            const $ = cheerio.load(companyEditResponse.data);
            const csrfToken = $('input[name="_csrf"]').val() || '';
            
            const updateData = {
                company_name_th: 'รักษ์ชัย (อัพเดทจาก GUI)',
                company_name_en: 'Ruxchai Updated from GUI',
                tax_id: '1234567890123',
                _csrf: csrfToken,
                _method: 'PUT'
            };
            
            const updateResponse = await this.makeRequest('POST', '/companies/RUXCHAI', updateData);
            const updateSuccess = updateResponse.status === 302;
            this.logResult('Company edit via GUI', updateSuccess, `Status: ${updateResponse.status}`);
        } else {
            this.logResult('Company edit form access', false, `Status: ${companyEditResponse.status}`);
        }
        
        // Test Branch Edit
        console.log('Testing branch edit form...');
        const branchEditResponse = await this.makeRequest('GET', '/branches/RUXCHAI-HQ/edit');
        
        if (branchEditResponse.status === 200) {
            const $ = cheerio.load(branchEditResponse.data);
            const csrfToken = $('input[name="_csrf"]').val() || '';
            
            const updateData = {
                branch_name: 'สำนักงานใหญ่ (อัพเดทจาก GUI)',
                is_headquarters: 'on',
                _csrf: csrfToken,
                _method: 'PUT'
            };
            
            const updateResponse = await this.makeRequest('POST', '/branches/RUXCHAI-HQ', updateData);
            const updateSuccess = updateResponse.status === 302;
            this.logResult('Branch edit via GUI', updateSuccess, `Status: ${updateResponse.status}`);
        } else {
            this.logResult('Branch edit form access', false, `Status: ${branchEditResponse.status}`);
        }

        // Test Division Edit
        console.log('Testing division edit form...');
        const divisionEditResponse = await this.makeRequest('GET', '/divisions/RUXCHAI-DIV01/edit');
        
        if (divisionEditResponse.status === 200) {
            const $ = cheerio.load(divisionEditResponse.data);
            const csrfToken = $('input[name="_csrf"]').val() || '';
            
            const updateData = {
                division_name: 'ฝ่ายขาย (อัพเดทจาก GUI)',
                branch_code: 'RUXCHAI-HQ',
                _csrf: csrfToken,
                _method: 'PUT'
            };
            
            const updateResponse = await this.makeRequest('POST', '/divisions/RUXCHAI-DIV01', updateData);
            const updateSuccess = updateResponse.status === 302;
            this.logResult('Division edit via GUI', updateSuccess, `Status: ${updateResponse.status}`);
        } else {
            this.logResult('Division edit form access', false, `Status: ${divisionEditResponse.status}`);
        }

        // Test Department Edit
        console.log('Testing department edit form...');
        const departmentEditResponse = await this.makeRequest('GET', '/departments/RUXCHAI-DEPT01/edit');
        
        if (departmentEditResponse.status === 200) {
            const $ = cheerio.load(departmentEditResponse.data);
            const csrfToken = $('input[name="_csrf"]').val() || '';
            
            const updateData = {
                department_name: 'แผนกขายในประเทศ (อัพเดทจาก GUI)',
                _csrf: csrfToken,
                _method: 'PUT'
            };
            
            const updateResponse = await this.makeRequest('POST', '/departments/RUXCHAI-DEPT01', updateData);
            const updateSuccess = updateResponse.status === 302;
            this.logResult('Department edit via GUI', updateSuccess, `Status: ${updateResponse.status}`);
        } else {
            this.logResult('Department edit form access', false, `Status: ${departmentEditResponse.status}`);
        }
    }

    async testGUIToggleStatus() {
        console.log('\\n🔄 TESTING TOGGLE STATUS VIA GUI');
        console.log('-'.repeat(50));
        
        // Test Branch Toggle Status
        console.log('Testing branch toggle status...');
        const toggleResponse = await this.makeRequest('POST', '/branches/RUXCHAI-BKK/toggle-status', {});
        const toggleSuccess = toggleResponse.status === 302;
        this.logResult('Branch toggle status via GUI', toggleSuccess, `Status: ${toggleResponse.status}`);
    }

    async testGUINavigation() {
        console.log('\\n🧭 TESTING GUI NAVIGATION');
        console.log('-'.repeat(50));
        
        const pages = [
            { url: '/', name: 'Dashboard' },
            { url: '/companies', name: 'Companies list' },
            { url: '/branches', name: 'Branches list' },
            { url: '/divisions', name: 'Divisions list' },
            { url: '/departments', name: 'Departments list' }
        ];

        for (const page of pages) {
            const response = await this.makeRequest('GET', page.url);
            const success = response.status === 200;
            this.logResult(`${page.name} page`, success, `Status: ${response.status}`);
        }
    }

    async runFullGUITest() {
        console.log('🚀 TESTING GUI FUNCTIONALITY');
        console.log('='.repeat(80));
        
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.log('❌ Cannot proceed without login');
            return;
        }
        
        try {
            await this.testGUINavigation();
            await this.testGUIAddFunctionality();
            await this.testGUIEditFunctionality();
            await this.testGUIToggleStatus();
            
        } catch (error) {
            console.error('❌ GUI test failed:', error);
        }
        
        // Final results
        console.log('\\n' + '='.repeat(80));
        console.log('📊 GUI FUNCTIONALITY TEST RESULTS');
        console.log('='.repeat(80));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log(`🎯 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${totalTests - passedTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (passedTests < totalTests) {
            console.log('\\n❌ FAILED TESTS:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => console.log(`   - ${r.test}: ${r.details}`));
        }
        
        // Summary by functionality
        console.log('\\n📋 FUNCTIONALITY SUMMARY:');
        const addTests = this.testResults.filter(r => r.test.includes('add'));
        const editTests = this.testResults.filter(r => r.test.includes('edit'));
        const toggleTests = this.testResults.filter(r => r.test.includes('toggle'));
        const navTests = this.testResults.filter(r => r.test.includes('page'));
        
        console.log(`🆕 Add Functions: ${addTests.filter(r => r.success).length}/${addTests.length} passed`);
        console.log(`✏️ Edit Functions: ${editTests.filter(r => r.success).length}/${editTests.length} passed`);
        console.log(`🔄 Toggle Functions: ${toggleTests.filter(r => r.success).length}/${toggleTests.length} passed`);
        console.log(`🧭 Navigation: ${navTests.filter(r => r.success).length}/${navTests.length} passed`);
        
        return {
            totalTests,
            passedTests,
            successRate: parseFloat(successRate),
            results: this.testResults
        };
    }
}

// Run the GUI test
console.log('🌐 Starting GUI Functionality Test...');
console.log('Make sure the server is running on http://localhost:3004');
console.log('');

const tester = new GUIFunctionalityTester();
tester.runFullGUITest()
    .then(results => {
        if (results) {
            console.log(`\\n✨ GUI functionality testing completed with ${results.successRate}% success rate`);
            
            if (results.successRate >= 90) {
                console.log('🎉 Excellent! GUI is working very well.');
            } else if (results.successRate >= 75) {
                console.log('👍 Good! Most GUI functions are working.');
            } else {
                console.log('⚠️ GUI needs some fixes.');
            }
        }
    })
    .catch(error => {
        console.error('❌ GUI testing failed:', error);
    });