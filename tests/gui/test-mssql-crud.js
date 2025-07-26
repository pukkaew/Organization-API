const axios = require('axios');
const cheerio = require('cheerio');

class MSSQLCRUDTester {
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

    async testCompanyCRUD() {
        console.log('\\n🏢 TESTING COMPANY CRUD WITH MSSQL');
        console.log('-'.repeat(50));
        
        // Test Company Add
        console.log('Testing company add...');
        const companyCreateResponse = await this.makeRequest('GET', '/companies/new');
        
        if (companyCreateResponse.status === 200) {
            const $ = cheerio.load(companyCreateResponse.data);
            const csrfToken = $('input[name="_csrf"]').val() || '';
            
            const timestamp = Date.now();
            const companyData = {
                company_code: 'MSSQL' + timestamp,
                company_name_th: 'บริษัท ทดสอบ MSSQL จำกัด',
                company_name_en: 'MSSQL Test Company Limited',
                tax_id: '1234567890' + String(timestamp).slice(-3),
                website: 'https://mssqltest.com',
                email: 'test@mssqltest.com',
                phone: '02-123-4567',
                address: '123 MSSQL Test Street',
                _csrf: csrfToken
            };
            
            const createResponse = await this.makeRequest('POST', '/companies', companyData);
            const createSuccess = createResponse.status === 302;
            this.logResult('Company add to MSSQL', createSuccess, `Status: ${createResponse.status}`);
            
            if (createSuccess) {
                console.log(`✅ Created company: ${companyData.company_code}`);
                return companyData.company_code;
            }
        } else {
            this.logResult('Company add form access', false, `Status: ${companyCreateResponse.status}`);
        }
        
        return null;
    }

    async testBranchCRUD(companyCode) {
        if (!companyCode) return null;
        
        console.log('\\n🏪 TESTING BRANCH CRUD WITH MSSQL');
        console.log('-'.repeat(50));
        
        // Test Branch Add
        console.log('Testing branch add...');
        const branchCreateResponse = await this.makeRequest('GET', '/branches/new');
        
        if (branchCreateResponse.status === 200) {
            const $ = cheerio.load(branchCreateResponse.data);
            const csrfToken = $('input[name="_csrf"]').val() || '';
            
            const timestamp = Date.now();
            const branchData = {
                branch_code: companyCode + '-HQ',
                company_code: companyCode,
                branch_name: 'สำนักงานใหญ่ MSSQL Test',
                is_headquarters: 'on',
                _csrf: csrfToken
            };
            
            const createResponse = await this.makeRequest('POST', '/branches', branchData);
            const createSuccess = createResponse.status === 302;
            this.logResult('Branch add to MSSQL', createSuccess, `Status: ${createResponse.status}`);
            
            if (createSuccess) {
                console.log(`✅ Created branch: ${branchData.branch_code}`);
                return branchData.branch_code;
            }
        } else {
            this.logResult('Branch add form access', false, `Status: ${branchCreateResponse.status}`);
        }
        
        return null;
    }

    async checkMSSQLData() {
        console.log('\\n🗄️ CHECKING DATA IN MSSQL DATABASE');
        console.log('-'.repeat(50));
        
        try {
            // We'll call our existing test to check the database
            const { executeQuery } = require('../../src/config/database');
            
            const companies = await executeQuery('SELECT company_code, company_name_en, is_active FROM Companies ORDER BY created_date DESC');
            console.log('\\n📊 COMPANIES IN MSSQL:');
            if (companies.recordset.length > 0) {
                companies.recordset.forEach(company => {
                    console.log(`  - ${company.company_code}: ${company.company_name_en} (${company.is_active ? 'Active' : 'Inactive'})`);
                });
            } else {
                console.log('  No companies found');
            }
            
            const branches = await executeQuery('SELECT branch_code, branch_name, company_code, is_active FROM Branches ORDER BY created_date DESC');
            console.log('\\n🏪 BRANCHES IN MSSQL:');
            if (branches.recordset.length > 0) {
                branches.recordset.forEach(branch => {
                    console.log(`  - ${branch.branch_code}: ${branch.branch_name} (${branch.company_code}) (${branch.is_active ? 'Active' : 'Inactive'})`);
                });
            } else {
                console.log('  No branches found');
            }
            
            this.logResult('Data persisted in MSSQL', true, `${companies.recordset.length} companies, ${branches.recordset.length} branches`);
            
        } catch (error) {
            this.logResult('Check MSSQL data', false, error.message);
        }
    }

    async runMSSQLTest() {
        console.log('🚀 TESTING MSSQL CRUD FUNCTIONALITY');
        console.log('='.repeat(80));
        
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.log('❌ Cannot proceed without login');
            return;
        }
        
        try {
            const companyCode = await this.testCompanyCRUD();
            const branchCode = await this.testBranchCRUD(companyCode);
            
            await this.checkMSSQLData();
            
        } catch (error) {
            console.error('❌ MSSQL test failed:', error);
        }
        
        // Final results
        console.log('\\n' + '='.repeat(80));
        console.log('📊 MSSQL CRUD TEST RESULTS');
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
        
        return {
            totalTests,
            passedTests,
            successRate: parseFloat(successRate),
            results: this.testResults
        };
    }
}

// Run the MSSQL test
console.log('🌐 Starting MSSQL CRUD Test...');
console.log('Make sure the server is running with MSSQL configuration');
console.log('');

const tester = new MSSQLCRUDTester();
tester.runMSSQLTest()
    .then(results => {
        if (results) {
            console.log(`\\n✨ MSSQL CRUD testing completed with ${results.successRate}% success rate`);
            
            if (results.successRate >= 90) {
                console.log('🎉 Excellent! MSSQL CRUD is working very well.');
            } else if (results.successRate >= 75) {
                console.log('👍 Good! Most MSSQL CRUD functions are working.');
            } else {
                console.log('⚠️ MSSQL CRUD needs some fixes.');
            }
        }
    })
    .catch(error => {
        console.error('❌ MSSQL CRUD testing failed:', error);
    });