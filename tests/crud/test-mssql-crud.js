const axios = require('axios');
const cheerio = require('cheerio');

class MSSQLCRUDTester {
    constructor() {
        this.baseURL = 'http://localhost:3003';
        this.cookies = '';
        this.testResults = [];
        this.createdItems = [];
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
                maxRedirects: 0, // Don't follow redirects automatically
                ...options
            };

            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                if (options.json) {
                    config.headers['Content-Type'] = 'application/json';
                    config.data = JSON.stringify(data);
                } else {
                    config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    config.data = new URLSearchParams(data).toString();
                }
            } else if (data && method === 'GET') {
                config.params = data;
            }

            const response = await axios(config);
            
            if (response.headers['set-cookie']) {
                // Extract session cookie properly
                const sessionCookie = response.headers['set-cookie']
                    .find(cookie => cookie.startsWith('connect.sid'))
                    ?.split(';')[0]; // Get just the name=value part
                
                if (sessionCookie) {
                    this.cookies = sessionCookie;
                } else {
                    // Fallback to joining all cookies
                    this.cookies = response.headers['set-cookie'].join('; ');
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
        const loginPageResponse = await this.makeRequest('GET', '/login');
        const $ = cheerio.load(loginPageResponse.data || '');
        const csrfToken = $('input[name="_csrf"]').val() || '';
        
        const loginData = { username: 'admin', password: 'admin123' };
        if (csrfToken) loginData._csrf = csrfToken;
        
        const loginResponse = await this.makeRequest('POST', '/login', loginData);
        const success = loginResponse.status === 302;
        this.logResult('Admin login', success, `Status: ${loginResponse.status}`);
        return success;
    }

    async getCsrfToken(url) {
        const response = await this.makeRequest('GET', url);
        if (response.status === 200) {
            const $ = cheerio.load(response.data);
            return $('input[name="_csrf"]').val() || $('meta[name="csrf-token"]').attr('content') || '';
        }
        return '';
    }

    async testCompanyCRUD() {
        console.log('\n🏢 TESTING COMPANY CRUD OPERATIONS');
        console.log('-' .repeat(50));
        
        const companyCode = `CRUDTEST${Date.now()}`;
        
        // CREATE
        console.log('1. Testing Company CREATE...');
        const createToken = await this.getCsrfToken('/companies/create');
        
        const createData = {
            company_code: companyCode,
            company_name_th: 'บริษัท ทดสอบ CRUD จำกัด',
            company_name_en: 'CRUD Test Company Limited',
            tax_id: '9999999999999',
            _csrf: createToken
        };
        
        const createResponse = await this.makeRequest('POST', '/companies', createData);
        const createSuccess = createResponse.status === 302 || createResponse.status === 201;
        this.logResult('Create company', createSuccess, `Status: ${createResponse.status}`);
        
        if (createSuccess) {
            this.createdItems.push({ type: 'company', code: companyCode });
        }
        
        // Wait a moment for database
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // READ (List)
        console.log('2. Testing Company READ (List)...');
        const listResponse = await this.makeRequest('GET', '/companies');
        const listSuccess = listResponse.status === 200;
        this.logResult('Read companies list', listSuccess);
        
        if (listSuccess) {
            const $ = cheerio.load(listResponse.data);
            const foundCompany = listResponse.data.includes(companyCode);
            this.logResult('Find created company in list', foundCompany);
        }
        
        // READ (Single)
        console.log('3. Testing Company READ (Single)...');
        const readResponse = await this.makeRequest('GET', `/companies/${companyCode}`);
        const readSuccess = readResponse.status === 200;
        this.logResult('Read single company', readSuccess, `Status: ${readResponse.status}`);
        
        // UPDATE
        console.log('4. Testing Company UPDATE...');
        const editToken = await this.getCsrfToken(`/companies/${companyCode}/edit`);
        
        const updateData = {
            company_name_th: 'บริษัท ทดสอบ CRUD อัพเดท จำกัด',
            company_name_en: 'CRUD Test Updated Company Limited',
            tax_id: '9999999999999',
            _csrf: editToken,
            _method: 'PUT'
        };
        
        const updateResponse = await this.makeRequest('POST', `/companies/${companyCode}`, updateData);
        const updateSuccess = updateResponse.status === 302 || updateResponse.status === 200;
        this.logResult('Update company', updateSuccess, `Status: ${updateResponse.status}`);
        
        // Verify UPDATE
        if (updateSuccess) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const verifyResponse = await this.makeRequest('GET', `/companies/${companyCode}`);
            if (verifyResponse.status === 200) {
                const updatedNameFound = verifyResponse.data.includes('อัพเดท');
                this.logResult('Verify company update persisted', updatedNameFound);
            }
        }
        
        // DELETE will be done at the end
        return companyCode;
    }

    async testBranchCRUD(companyCode) {
        console.log('\n🏪 TESTING BRANCH CRUD OPERATIONS');
        console.log('-' .repeat(50));
        
        const branchCode = `${companyCode}-BR${Date.now()}`;
        
        // CREATE
        console.log('1. Testing Branch CREATE...');
        const createToken = await this.getCsrfToken('/branches/create');
        
        const createData = {
            branch_code: branchCode,
            branch_name: 'สาขาทดสอบ CRUD',
            company_code: companyCode,
            is_headquarters: '0',
            _csrf: createToken
        };
        
        const createResponse = await this.makeRequest('POST', '/branches', createData);
        const createSuccess = createResponse.status === 302 || createResponse.status === 201;
        this.logResult('Create branch', createSuccess, `Status: ${createResponse.status}`);
        
        if (createSuccess) {
            this.createdItems.push({ type: 'branch', code: branchCode });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // READ
        const listResponse = await this.makeRequest('GET', '/branches');
        const listSuccess = listResponse.status === 200;
        this.logResult('Read branches list', listSuccess);
        
        if (listSuccess) {
            const foundBranch = listResponse.data.includes(branchCode);
            this.logResult('Find created branch in list', foundBranch);
        }
        
        // UPDATE
        console.log('2. Testing Branch UPDATE...');
        const editToken = await this.getCsrfToken(`/branches/${branchCode}/edit`);
        
        const updateData = {
            branch_name: 'สาขาทดสอบ CRUD อัพเดท',
            company_code: companyCode,
            is_headquarters: '0',
            _csrf: editToken,
            _method: 'PUT'
        };
        
        const updateResponse = await this.makeRequest('POST', `/branches/${branchCode}`, updateData);
        const updateSuccess = updateResponse.status === 302 || updateResponse.status === 200;
        this.logResult('Update branch', updateSuccess, `Status: ${updateResponse.status}`);
        
        return branchCode;
    }

    async testDivisionCRUD(companyCode, branchCode) {
        console.log('\n🏗️ TESTING DIVISION CRUD OPERATIONS');
        console.log('-' .repeat(50));
        
        const divisionCode = `${companyCode}-DIV${Date.now()}`;
        
        // CREATE
        console.log('1. Testing Division CREATE...');
        const createToken = await this.getCsrfToken('/divisions/create');
        
        const createData = {
            division_code: divisionCode,
            division_name: 'ฝ่ายทดสอบ CRUD',
            company_code: companyCode,
            branch_code: branchCode,
            _csrf: createToken
        };
        
        const createResponse = await this.makeRequest('POST', '/divisions', createData);
        const createSuccess = createResponse.status === 302 || createResponse.status === 201;
        this.logResult('Create division', createSuccess, `Status: ${createResponse.status}`);
        
        if (createSuccess) {
            this.createdItems.push({ type: 'division', code: divisionCode });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // READ
        const listResponse = await this.makeRequest('GET', '/divisions');
        const listSuccess = listResponse.status === 200;
        this.logResult('Read divisions list', listSuccess);
        
        if (listSuccess) {
            const foundDivision = listResponse.data.includes(divisionCode);
            this.logResult('Find created division in list', foundDivision);
        }
        
        return divisionCode;
    }

    async testDepartmentCRUD(divisionCode) {
        console.log('\n👥 TESTING DEPARTMENT CRUD OPERATIONS');
        console.log('-' .repeat(50));
        
        const departmentCode = `${divisionCode}-DEPT${Date.now()}`;
        
        // CREATE
        console.log('1. Testing Department CREATE...');
        const createToken = await this.getCsrfToken('/departments/create');
        
        const createData = {
            department_code: departmentCode,
            department_name: 'แผนกทดสอบ CRUD',
            division_code: divisionCode,
            _csrf: createToken
        };
        
        const createResponse = await this.makeRequest('POST', '/departments', createData);
        const createSuccess = createResponse.status === 302 || createResponse.status === 201;
        this.logResult('Create department', createSuccess, `Status: ${createResponse.status}`);
        
        if (createSuccess) {
            this.createdItems.push({ type: 'department', code: departmentCode });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // READ
        const listResponse = await this.makeRequest('GET', '/departments');
        const listSuccess = listResponse.status === 200;
        this.logResult('Read departments list', listSuccess);
        
        if (listSuccess) {
            const foundDepartment = listResponse.data.includes(departmentCode);
            this.logResult('Find created department in list', foundDepartment);
        }
        
        return departmentCode;
    }

    async cleanupTestData() {
        console.log('\n🧹 CLEANING UP TEST DATA');
        console.log('-' .repeat(50));
        
        // Delete in reverse order (departments -> divisions -> branches -> companies)
        const reverseOrder = ['department', 'division', 'branch', 'company'];
        
        for (const type of reverseOrder) {
            const items = this.createdItems.filter(item => item.type === type);
            
            for (const item of items) {
                console.log(`Deleting ${type}: ${item.code}`);
                
                const deleteToken = await this.getCsrfToken(`/${type === 'company' ? 'companies' : type + 's'}`);
                const deleteData = {
                    _csrf: deleteToken,
                    _method: 'DELETE'
                };
                
                const deleteResponse = await this.makeRequest('POST', `/${type === 'company' ? 'companies' : type + 's'}/${item.code}`, deleteData);
                const deleteSuccess = deleteResponse.status === 302 || deleteResponse.status === 200;
                this.logResult(`Delete ${type} ${item.code}`, deleteSuccess, `Status: ${deleteResponse.status}`);
                
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    async runFullTest() {
        console.log('🚀 COMPREHENSIVE MSSQL CRUD TESTING');
        console.log('=' .repeat(80));
        
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.log('❌ Cannot proceed without login');
            return;
        }
        
        try {
            // Test full hierarchy
            const companyCode = await this.testCompanyCRUD();
            const branchCode = await this.testBranchCRUD(companyCode);
            const divisionCode = await this.testDivisionCRUD(companyCode, branchCode);
            const departmentCode = await this.testDepartmentCRUD(divisionCode);
            
            // Additional verification tests
            console.log('\n🔍 TESTING DATA PERSISTENCE');
            console.log('-' .repeat(50));
            
            // Test database persistence by reloading pages
            const persistenceTests = [
                { url: `/companies/${companyCode}`, name: 'Company persistence' },
                { url: `/branches/${branchCode}`, name: 'Branch persistence' },
                { url: `/divisions/${divisionCode}`, name: 'Division persistence' },
                { url: `/departments/${departmentCode}`, name: 'Department persistence' }
            ];
            
            for (const test of persistenceTests) {
                const response = await this.makeRequest('GET', test.url);
                this.logResult(test.name, response.status === 200, `Status: ${response.status}`);
            }
            
            // Cleanup
            await this.cleanupTestData();
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
        
        // Final results
        console.log('\n' + '=' .repeat(80));
        console.log('📊 MSSQL CRUD TEST RESULTS');
        console.log('=' .repeat(80));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log(`🎯 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${totalTests - passedTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (passedTests < totalTests) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => console.log(`   - ${r.test}: ${r.details}`));
        }
        
        return {
            totalTests,
            passedTests,
            successRate: parseFloat(successRate),
            results: this.testResults
        };
    }
}

// Run the test
const tester = new MSSQLCRUDTester();
tester.runFullTest()
    .then(results => {
        if (results) {
            console.log(`\n✨ MSSQL CRUD testing completed with ${results.successRate}% success rate`);
        }
    })
    .catch(error => {
        console.error('❌ Testing failed:', error);
    });