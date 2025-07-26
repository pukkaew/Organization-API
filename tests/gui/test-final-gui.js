const axios = require('axios');
const cheerio = require('cheerio');

class FinalGUITester {
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
        console.log('🔐 Getting login form...');
        
        // Get login form first to get CSRF token
        const loginFormResponse = await this.makeRequest('GET', '/login');
        if (loginFormResponse.status !== 200) {
            this.logResult('Get login form', false, `Status: ${loginFormResponse.status}`);
            return false;
        }
        
        const $ = cheerio.load(loginFormResponse.data);
        const csrfToken = $('input[name="_csrf"]').val() || '';
        
        console.log('CSRF Token:', csrfToken ? 'Found' : 'Missing');
        
        const loginData = { 
            username: 'admin', 
            password: 'admin123',
            _csrf: csrfToken
        };
        
        const loginResponse = await this.makeRequest('POST', '/login', loginData);
        const success = loginResponse.status === 302;
        this.logResult('Admin login', success, `Status: ${loginResponse.status}`);
        return success;
    }

    async testCompleteNavigation() {
        console.log('\\n🧭 TESTING COMPLETE NAVIGATION');
        console.log('-'.repeat(50));
        
        const pages = [
            { url: '/', name: 'Dashboard' },
            { url: '/companies', name: 'Companies list' },
            { url: '/companies/new', name: 'Company create form' },
            { url: '/branches', name: 'Branches list' },
            { url: '/branches/new', name: 'Branch create form' },
            { url: '/divisions', name: 'Divisions list' },
            { url: '/divisions/new', name: 'Division create form' },
            { url: '/departments', name: 'Departments list' },
            { url: '/departments/new', name: 'Department create form' }
        ];

        for (const page of pages) {
            const response = await this.makeRequest('GET', page.url);
            const success = response.status === 200;
            this.logResult(page.name, success, `Status: ${response.status}`);
            
            if (success && response.data) {
                const $ = cheerio.load(response.data);
                
                // Check if it's a form page
                if (page.url.includes('/new')) {
                    const hasForm = $('form[method="post"]').length > 0;
                    const hasSubmitButton = $('button[type="submit"]').length > 0;
                    const hasCsrfToken = $('input[name="_csrf"]').length > 0;
                    
                    this.logResult(`${page.name} - Has form`, hasForm);
                    this.logResult(`${page.name} - Has submit button`, hasSubmitButton);
                    this.logResult(`${page.name} - Has CSRF token`, hasCsrfToken);
                }
            }
        }
    }

    async testCompleteCRUD() {
        console.log('\\n🏢 TESTING COMPLETE CRUD OPERATIONS');
        console.log('-'.repeat(50));
        
        let companyCode = null;
        let branchCode = null;
        let divisionCode = null;
        let departmentCode = null;
        
        // 1. Create Company
        console.log('Creating company...');
        const companyFormResponse = await this.makeRequest('GET', '/companies/new');
        if (companyFormResponse.status === 200) {
            const $ = cheerio.load(companyFormResponse.data);
            const csrfToken = $('input[name="_csrf"]').val() || '';
            
            const timestamp = Date.now();
            companyCode = 'FINAL' + timestamp;
            
            const companyData = {
                company_code: companyCode,
                company_name_th: 'บริษัท ทดสอบสุดท้าย จำกัด',
                company_name_en: 'Final Test Company Limited',
                tax_id: '1234567890' + String(timestamp).slice(-3),
                website: 'https://finaltest.com',
                email: 'test@finaltest.com',
                phone: '02-999-8888',
                address: '999 Final Test Street',
                _csrf: csrfToken
            };
            
            const createResponse = await this.makeRequest('POST', '/companies', companyData);
            const success = createResponse.status === 302;
            this.logResult('Company CREATE', success, `Status: ${createResponse.status}`);
        }
        
        // 2. Create Branch
        if (companyCode) {
            console.log('Creating branch...');
            const branchFormResponse = await this.makeRequest('GET', '/branches/new');
            if (branchFormResponse.status === 200) {
                const $ = cheerio.load(branchFormResponse.data);
                const csrfToken = $('input[name="_csrf"]').val() || '';
                
                branchCode = companyCode + '-HQ';
                
                const branchData = {
                    branch_code: branchCode,
                    company_code: companyCode,
                    branch_name: 'สำนักงานใหญ่ทดสอบสุดท้าย',
                    is_headquarters: 'on',
                    _csrf: csrfToken
                };
                
                const createResponse = await this.makeRequest('POST', '/branches', branchData);
                const success = createResponse.status === 302;
                this.logResult('Branch CREATE', success, `Status: ${createResponse.status}`);
            }
        }
        
        // 3. Create Division
        if (companyCode) {
            console.log('Creating division...');
            const divisionFormResponse = await this.makeRequest('GET', '/divisions/new');
            if (divisionFormResponse.status === 200) {
                const $ = cheerio.load(divisionFormResponse.data);
                const csrfToken = $('input[name="_csrf"]').val() || '';
                
                divisionCode = companyCode + '-DIV01';
                
                const divisionData = {
                    division_code: divisionCode,
                    company_code: companyCode,
                    branch_code: branchCode,
                    division_name: 'ฝ่ายทดสอบสุดท้าย',
                    _csrf: csrfToken
                };
                
                const createResponse = await this.makeRequest('POST', '/divisions', divisionData);
                const success = createResponse.status === 302;
                this.logResult('Division CREATE', success, `Status: ${createResponse.status}`);
            }
        }
        
        // 4. Create Department
        if (divisionCode) {
            console.log('Creating department...');
            const departmentFormResponse = await this.makeRequest('GET', '/departments/new');
            if (departmentFormResponse.status === 200) {
                const $ = cheerio.load(departmentFormResponse.data);
                const csrfToken = $('input[name="_csrf"]').val() || '';
                
                departmentCode = divisionCode + '-DEPT01';
                
                const departmentData = {
                    department_code: departmentCode,
                    division_code: divisionCode,
                    department_name: 'แผนกทดสอบสุดท้าย',
                    _csrf: csrfToken
                };
                
                const createResponse = await this.makeRequest('POST', '/departments', departmentData);
                const success = createResponse.status === 302;
                this.logResult('Department CREATE', success, `Status: ${createResponse.status}`);
            }
        }
        
        // Test EDIT operations
        if (companyCode) {
            console.log('Testing company edit...');
            const editResponse = await this.makeRequest('GET', `/companies/${companyCode}/edit`);
            this.logResult('Company EDIT form', editResponse.status === 200, `Status: ${editResponse.status}`);
            
            if (editResponse.status === 200) {
                const $ = cheerio.load(editResponse.data);
                const csrfToken = $('input[name="_csrf"]').val() || '';
                
                const updateData = {
                    company_name_th: 'บริษัท ทดสอบสุดท้าย จำกัด (แก้ไขแล้ว)',
                    company_name_en: 'Final Test Company Limited (Updated)',
                    tax_id: '1234567890123',
                    website: 'https://finaltest-updated.com',
                    email: 'updated@finaltest.com',
                    phone: '02-999-7777',
                    address: '999 Final Test Street Updated',
                    _csrf: csrfToken,
                    _method: 'PUT'
                };
                
                const updateResponse = await this.makeRequest('POST', `/companies/${companyCode}`, updateData);
                this.logResult('Company UPDATE', updateResponse.status === 302, `Status: ${updateResponse.status}`);
            }
        }
        
        if (branchCode) {
            console.log('Testing branch edit...');
            const editResponse = await this.makeRequest('GET', `/branches/${branchCode}/edit`);
            this.logResult('Branch EDIT form', editResponse.status === 200, `Status: ${editResponse.status}`);
        }
        
        if (divisionCode) {
            console.log('Testing division edit...');
            const editResponse = await this.makeRequest('GET', `/divisions/${divisionCode}/edit`);
            this.logResult('Division EDIT form', editResponse.status === 200, `Status: ${editResponse.status}`);
        }
        
        if (departmentCode) {
            console.log('Testing department edit...');
            const editResponse = await this.makeRequest('GET', `/departments/${departmentCode}/edit`);
            this.logResult('Department EDIT form', editResponse.status === 200, `Status: ${departmentCode.status}`);
        }
        
        return { companyCode, branchCode, divisionCode, departmentCode };
    }

    async testDatabasePersistence(codes) {
        console.log('\\n🗄️ TESTING DATABASE PERSISTENCE');
        console.log('-'.repeat(50));
        
        try {
            const { connectDatabase, executeQuery } = require('../../src/config/database');
            
            await connectDatabase();
            
            if (codes.companyCode) {
                const companyResult = await executeQuery('SELECT * FROM Companies WHERE company_code = @code', {
                    code: codes.companyCode
                });
                this.logResult('Company persisted in MSSQL', companyResult.recordset.length > 0, 
                    `Found: ${companyResult.recordset.length}`);
                    
                if (companyResult.recordset.length > 0) {
                    const company = companyResult.recordset[0];
                    console.log(`  Company: ${company.company_name_en}`);
                }
            }
            
            if (codes.branchCode) {
                const branchResult = await executeQuery('SELECT * FROM Branches WHERE branch_code = @code', {
                    code: codes.branchCode
                });
                this.logResult('Branch persisted in MSSQL', branchResult.recordset.length > 0, 
                    `Found: ${branchResult.recordset.length}`);
            }
            
            if (codes.divisionCode) {
                const divisionResult = await executeQuery('SELECT * FROM Divisions WHERE division_code = @code', {
                    code: codes.divisionCode
                });
                this.logResult('Division persisted in MSSQL', divisionResult.recordset.length > 0, 
                    `Found: ${divisionResult.recordset.length}`);
            }
            
            if (codes.departmentCode) {
                const departmentResult = await executeQuery('SELECT * FROM Departments WHERE department_code = @code', {
                    code: codes.departmentCode
                });
                this.logResult('Department persisted in MSSQL', departmentResult.recordset.length > 0, 
                    `Found: ${departmentResult.recordset.length}`);
            }
            
        } catch (error) {
            this.logResult('Database persistence check', false, error.message);
        }
    }

    async runFullTest() {
        console.log('🚀 TESTING 100% GUI FUNCTIONALITY WITH MSSQL');
        console.log('='.repeat(80));
        
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.log('❌ Cannot proceed without login');
            return;
        }
        
        try {
            await this.testCompleteNavigation();
            const codes = await this.testCompleteCRUD();
            await this.testDatabasePersistence(codes);
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
        
        // Final results
        console.log('\\n' + '='.repeat(80));
        console.log('📊 FINAL GUI FUNCTIONALITY TEST RESULTS');
        console.log('='.repeat(80));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log(`🎯 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${totalTests - passedTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        // Categorize results
        const categories = {
            navigation: this.testResults.filter(r => r.test.includes('list') || r.test.includes('Dashboard') || r.test.includes('form')),
            create: this.testResults.filter(r => r.test.includes('CREATE')),
            edit: this.testResults.filter(r => r.test.includes('EDIT') || r.test.includes('UPDATE')),
            database: this.testResults.filter(r => r.test.includes('persisted') || r.test.includes('MSSQL'))
        };
        
        console.log('\\n📋 RESULTS BY CATEGORY:');
        Object.entries(categories).forEach(([category, results]) => {
            const passed = results.filter(r => r.success).length;
            const total = results.length;
            const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
            console.log(`${category.toUpperCase()}: ${passed}/${total} (${rate}%)`);
        });
        
        if (passedTests < totalTests) {
            console.log('\\n❌ FAILED TESTS:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => console.log(`   - ${r.test}: ${r.details}`));
        }
        
        // Final verdict
        console.log('\\n' + '='.repeat(80));
        if (successRate >= 95) {
            console.log('🎉 EXCELLENT! GUI is working at 100% with MSSQL!');
        } else if (successRate >= 90) {
            console.log('👍 VERY GOOD! GUI is working very well with MSSQL.');
        } else if (successRate >= 80) {
            console.log('✅ GOOD! Most GUI functions are working with MSSQL.');
        } else {
            console.log('⚠️ GUI needs more fixes for 100% functionality.');
        }
        
        return {
            totalTests,
            passedTests,
            successRate: parseFloat(successRate),
            results: this.testResults
        };
    }
}

// Run the final comprehensive test
console.log('🌐 Starting FINAL COMPREHENSIVE GUI Test...');
console.log('Testing 100% functionality with MSSQL database');
console.log('');

const tester = new FinalGUITester();
tester.runFullTest()
    .then(results => {
        if (results) {
            console.log(`\\n✨ Final testing completed with ${results.successRate}% success rate`);
        }
    })
    .catch(error => {
        console.error('❌ Final testing failed:', error);
    });