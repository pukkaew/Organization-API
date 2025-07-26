const axios = require('axios');
const cheerio = require('cheerio');

class EditTester {
    constructor() {
        this.baseURL = 'http://localhost:3004';
        this.cookies = '';
    }

    async makeRequest(method, url, data = null) {
        try {
            const config = {
                method,
                url: `${this.baseURL}${url}`,
                headers: {
                    'Cookie': this.cookies,
                    'User-Agent': 'Mozilla/5.0'
                },
                validateStatus: () => true,
                maxRedirects: 0
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

    async login() {
        console.log('🔐 Logging in...');
        const loginData = { username: 'admin', password: 'admin123' };
        const loginResponse = await this.makeRequest('POST', '/login', loginData);
        console.log(`Login response status: ${loginResponse.status}`);
        return loginResponse.status === 302;
    }

    async testCompanyEdit() {
        console.log('\n📝 Testing Company Edit...');
        
        // Get edit form
        const editResponse = await this.makeRequest('GET', '/companies/RUXCHAI/edit');
        console.log(`Edit page status: ${editResponse.status}`);
        
        if (editResponse.status !== 200) {
            console.log('❌ Cannot access edit page');
            return false;
        }

        const $ = cheerio.load(editResponse.data);
        const csrfToken = $('input[name="_csrf"]').val() || '';
        
        // Test the fix by including all available fields
        const updateData = {
            company_name_th: 'บริษัท ทดสอบการแก้ไข จำกัด',
            company_name_en: 'Edit Test Company Limited',
            tax_id: '9876543210123',
            website: 'https://www.editedcompany.com',
            email: 'contact@editedcompany.com',
            phone: '02-987-6543',
            address: '456 Updated Street, Bangkok',
            _csrf: csrfToken,
            _method: 'PUT'
        };
        
        const updateResponse = await this.makeRequest('POST', '/companies/RUXCHAI', updateData);
        console.log(`Update status: ${updateResponse.status}`);
        
        // Check if update was successful (should redirect)
        const success = updateResponse.status === 302;
        console.log(success ? '✅ Company update successful' : '❌ Company update failed');
        
        return success;
    }

    async testBranchEdit() {
        console.log('\n🏪 Testing Branch Edit...');
        
        const editResponse = await this.makeRequest('GET', '/branches/RUXCHAI-HQ/edit');
        console.log(`Edit page status: ${editResponse.status}`);
        
        if (editResponse.status !== 200) {
            console.log('❌ Cannot access edit page');
            return false;
        }

        const $ = cheerio.load(editResponse.data);
        const csrfToken = $('input[name="_csrf"]').val() || '';
        
        const updateData = {
            branch_name: 'สำนักงานใหญ่ (แก้ไขใหม่)',
            is_headquarters: 'on',
            _csrf: csrfToken,
            _method: 'PUT'
        };
        
        const updateResponse = await this.makeRequest('POST', '/branches/RUXCHAI-HQ', updateData);
        console.log(`Update status: ${updateResponse.status}`);
        
        const success = updateResponse.status === 302;
        console.log(success ? '✅ Branch update successful' : '❌ Branch update failed');
        
        return success;
    }

    async testDivisionEdit() {
        console.log('\n🏗️ Testing Division Edit...');
        
        const editResponse = await this.makeRequest('GET', '/divisions/RUXCHAI-DIV01/edit');
        console.log(`Edit page status: ${editResponse.status}`);
        
        if (editResponse.status !== 200) {
            console.log('❌ Cannot access edit page');
            return false;
        }

        const $ = cheerio.load(editResponse.data);
        const csrfToken = $('input[name="_csrf"]').val() || '';
        
        const updateData = {
            division_name: 'ฝ่ายขาย (แก้ไขใหม่)',
            branch_code: 'RUXCHAI-HQ',
            _csrf: csrfToken,
            _method: 'PUT'
        };
        
        const updateResponse = await this.makeRequest('POST', '/divisions/RUXCHAI-DIV01', updateData);
        console.log(`Update status: ${updateResponse.status}`);
        
        const success = updateResponse.status === 302;
        console.log(success ? '✅ Division update successful' : '❌ Division update failed');
        
        return success;
    }

    async testDepartmentEdit() {
        console.log('\n👥 Testing Department Edit...');
        
        const editResponse = await this.makeRequest('GET', '/departments/RUXCHAI-DEPT01/edit');
        console.log(`Edit page status: ${editResponse.status}`);
        
        if (editResponse.status !== 200) {
            console.log('❌ Cannot access edit page');
            return false;
        }

        const $ = cheerio.load(editResponse.data);
        const csrfToken = $('input[name="_csrf"]').val() || '';
        
        const updateData = {
            department_name: 'แผนกขายในประเทศ (แก้ไขใหม่)',
            _csrf: csrfToken,
            _method: 'PUT'
        };
        
        const updateResponse = await this.makeRequest('POST', '/departments/RUXCHAI-DEPT01', updateData);
        console.log(`Update status: ${updateResponse.status}`);
        
        const success = updateResponse.status === 302;
        console.log(success ? '✅ Department update successful' : '❌ Department update failed');
        
        return success;
    }

    async runTests() {
        console.log('🧪 TESTING CONTROLLER EDIT FIXES');
        console.log('='.repeat(50));
        
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.log('❌ Login failed, cannot proceed');
            return;
        }
        
        console.log('✅ Login successful');
        
        let totalTests = 0;
        let passedTests = 0;
        
        const tests = [
            { name: 'Company Edit', test: () => this.testCompanyEdit() },
            { name: 'Branch Edit', test: () => this.testBranchEdit() },
            { name: 'Division Edit', test: () => this.testDivisionEdit() },
            { name: 'Department Edit', test: () => this.testDepartmentEdit() }
        ];
        
        for (const { name, test } of tests) {
            totalTests++;
            try {
                const success = await test();
                if (success) passedTests++;
            } catch (error) {
                console.log(`❌ ${name} test failed: ${error.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST RESULTS');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        console.log(`Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All edit functionality tests passed!');
        } else {
            console.log('⚠️ Some tests failed - check the controller logic');
        }
    }
}

const tester = new EditTester();
tester.runTests().catch(console.error);