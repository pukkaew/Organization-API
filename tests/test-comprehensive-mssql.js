// Comprehensive Test for MSSQL Test Database
const http = require('http');
const fs = require('fs');

class ComprehensiveTestSuite {
    constructor() {
        this.baseUrl = 'http://localhost:3003';
        this.apiKey = 'tVCSQZofGuGxj6JrMw8vjyTwKIvi8CqzcrLyUzPw';
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        this.createdEntities = {
            companies: [],
            branches: [],
            divisions: [],
            departments: []
        };
    }

    async makeRequest(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3003,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    ...headers
                }
            };

            if (data) {
                const jsonData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(jsonData);
            }

            const req = http.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsedData = responseData ? JSON.parse(responseData) : null;
                        resolve({
                            status: res.statusCode,
                            data: parsedData,
                            headers: res.headers
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: responseData,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    recordTest(name, passed, details = '') {
        this.testResults.total++;
        if (passed) {
            this.testResults.passed++;
            console.log(`  ✅ ${name}`);
        } else {
            this.testResults.failed++;
            console.log(`  ❌ ${name} - ${details}`);
        }
        this.testResults.details.push({ name, passed, details });
    }

    // 1. Company Management Tests
    async testCompanyManagement() {
        console.log('\n🏢 COMPANY MANAGEMENT TESTS\n');
        
        // 1.1 Create Company
        console.log('1.1 Create Company:');
        const companyData = {
            company_code: `CO${Date.now().toString().slice(-8)}`, // Max 20 chars
            company_name_th: 'บริษัททดสอบ จำกัด',
            company_name_en: 'Test Company Ltd.',
            tax_id: '1234567890123'
        };
        
        const createRes = await this.makeRequest('POST', '/api/v1/companies', companyData);
        this.recordTest('Create company with valid data', createRes.status === 201);
        if (createRes.status === 201) {
            this.createdEntities.companies.push(createRes.data.data.company_code);
        }

        // 1.2 Validation Tests
        console.log('\n1.2 Validation Tests:');
        
        // Duplicate company code
        const dupRes = await this.makeRequest('POST', '/api/v1/companies', companyData);
        this.recordTest('Prevent duplicate company code', dupRes.status === 400 || dupRes.status === 409);
        
        // Invalid tax ID
        const invalidTaxRes = await this.makeRequest('POST', '/api/v1/companies', {
            ...companyData,
            company_code: 'TEST-INVALID-TAX',
            tax_id: '123' // Too short
        });
        this.recordTest('Validate tax ID format (13 digits)', invalidTaxRes.status === 400);
        
        // Missing required fields
        const missingFieldsRes = await this.makeRequest('POST', '/api/v1/companies', {
            company_code: 'TEST-MISSING'
        });
        this.recordTest('Validate required fields', missingFieldsRes.status === 400);

        // 1.3 Read Operations
        console.log('\n1.3 Read Operations:');
        
        // Get single company
        const getRes = await this.makeRequest('GET', `/api/v1/companies/${companyData.company_code}`);
        this.recordTest('Get company by code', getRes.status === 200);
        
        // Get all companies with pagination
        const listRes = await this.makeRequest('GET', '/api/v1/companies?page=1&limit=10');
        this.recordTest('List companies with pagination', listRes.status === 200 && listRes.data.data);
        
        // Search companies
        const searchRes = await this.makeRequest('GET', `/api/v1/companies?search=${encodeURIComponent('ทดสอบ')}`);
        this.recordTest('Search companies by name', searchRes.status === 200);
        
        // Filter by status
        const activeRes = await this.makeRequest('GET', '/api/v1/companies?is_active=true');
        this.recordTest('Filter companies by active status', activeRes.status === 200);

        // 1.4 Update Operations
        console.log('\n1.4 Update Operations:');
        
        const updateData = {
            company_name_th: 'บริษัททดสอบ (แก้ไข) จำกัด',
            company_name_en: 'Test Company (Updated) Ltd.'
        };
        const updateRes = await this.makeRequest('PUT', `/api/v1/companies/${companyData.company_code}`, updateData);
        this.recordTest('Update company information', updateRes.status === 200);
        
        // Update status
        const statusRes = await this.makeRequest('PATCH', `/api/v1/companies/${companyData.company_code}/status`, {
            is_active: false
        });
        this.recordTest('Update company status', statusRes.status === 200);

        // 1.5 Delete Operation (will test at the end to avoid constraint issues)
        console.log('\n1.5 Delete Operation: [Will test after all related data is deleted]');
    }

    // 2. Branch Management Tests
    async testBranchManagement() {
        console.log('\n\n🏪 BRANCH MANAGEMENT TESTS\n');
        
        const companyCode = this.createdEntities.companies[0];
        
        // 2.1 Create Branch
        console.log('2.1 Create Branch:');
        const branchData = {
            branch_code: `BR${Date.now().toString().slice(-8)}`, // Max 20 chars
            branch_name: 'สาขาทดสอบ',
            company_code: companyCode,
            is_headquarters: true
        };
        
        const createRes = await this.makeRequest('POST', '/api/v1/branches', branchData);
        this.recordTest('Create branch with valid data', createRes.status === 201);
        if (createRes.status === 201) {
            this.createdEntities.branches.push(createRes.data.data.branch_code);
        }

        // 2.2 Headquarters Constraint
        console.log('\n2.2 Headquarters Constraint:');
        const branch2Data = {
            branch_code: `BR2-${Date.now().toString().slice(-8)}`, // Max 20 chars
            branch_name: 'สาขาทดสอบ 2',
            company_code: companyCode,
            is_headquarters: true // Should fail - already have HQ
        };
        
        const hqRes = await this.makeRequest('POST', '/api/v1/branches', branch2Data);
        this.recordTest('Prevent multiple headquarters', hqRes.status === 400 || hqRes.status === 409);

        // Create regular branch
        branch2Data.is_headquarters = false;
        const br2Res = await this.makeRequest('POST', '/api/v1/branches', branch2Data);
        if (br2Res.status === 201) {
            this.createdEntities.branches.push(br2Res.data.data.branch_code);
        }

        // 2.3 Company Relationship
        console.log('\n2.3 Company Relationship:');
        const invalidCompanyBranch = {
            branch_code: 'TEST-INVALID-CO',
            branch_name: 'Invalid Company Branch',
            company_code: 'NON-EXISTENT-COMPANY'
        };
        const relRes = await this.makeRequest('POST', '/api/v1/branches', invalidCompanyBranch);
        this.recordTest('Validate company exists', relRes.status === 400 || relRes.status === 404);

        // 2.4 Get branches by company
        console.log('\n2.4 Get Branches by Company:');
        const companyBranchesRes = await this.makeRequest('GET', `/api/v1/companies/${companyCode}/branches`);
        this.recordTest('Get branches by company', companyBranchesRes.status === 200);
    }

    // 3. Division Management Tests
    async testDivisionManagement() {
        console.log('\n\n🏗️ DIVISION MANAGEMENT TESTS\n');
        
        const companyCode = this.createdEntities.companies[0];
        const branchCode = this.createdEntities.branches[0];
        
        // 3.1 Create Division
        console.log('3.1 Create Division:');
        const divisionData = {
            division_code: `DIV${Date.now().toString().slice(-8)}`, // Max 20 chars
            division_name: 'ฝ่ายทดสอบ',
            company_code: companyCode,
            branch_code: branchCode
        };
        
        const createRes = await this.makeRequest('POST', '/api/v1/divisions', divisionData);
        this.recordTest('Create division with valid data', createRes.status === 201);
        if (createRes.status === 201) {
            this.createdEntities.divisions.push(createRes.data.data.division_code);
        }

        // 3.2 Create division without branch
        console.log('\n3.2 Division without Branch:');
        const divNoBranch = {
            division_code: `DIVNB${Date.now().toString().slice(-8)}`, // Max 20 chars
            division_name: 'ฝ่ายไม่มีสาขา',
            company_code: companyCode,
            branch_code: null
        };
        
        const noBranchRes = await this.makeRequest('POST', '/api/v1/divisions', divNoBranch);
        this.recordTest('Create division without branch', noBranchRes.status === 201);
        if (noBranchRes.status === 201) {
            this.createdEntities.divisions.push(noBranchRes.data.data.division_code);
        }

        // 3.3 Move Division
        console.log('\n3.3 Move Division:');
        if (this.createdEntities.branches.length > 1) {
            const moveRes = await this.makeRequest('PATCH', `/api/v1/divisions/${divisionData.division_code}/move`, {
                branch_code: this.createdEntities.branches[1]
            });
            this.recordTest('Move division to another branch', moveRes.status === 200);
        }

        // 3.4 Get divisions by company/branch
        console.log('\n3.4 Get Divisions:');
        const byCompanyRes = await this.makeRequest('GET', `/api/v1/companies/${companyCode}/divisions`);
        this.recordTest('Get divisions by company', byCompanyRes.status === 200);
        
        const byBranchRes = await this.makeRequest('GET', `/api/v1/branches/${branchCode}/divisions`);
        this.recordTest('Get divisions by branch', byBranchRes.status === 200);
    }

    // 4. Department Management Tests
    async testDepartmentManagement() {
        console.log('\n\n🏛️ DEPARTMENT MANAGEMENT TESTS\n');
        
        const divisionCode = this.createdEntities.divisions[0];
        
        // 4.1 Create Department
        console.log('4.1 Create Department:');
        const departmentData = {
            department_code: `DEPT${Date.now().toString().slice(-8)}`, // Max 20 chars
            department_name: 'แผนกทดสอบ',
            division_code: divisionCode
        };
        
        const createRes = await this.makeRequest('POST', '/api/v1/departments', departmentData);
        this.recordTest('Create department with valid data', createRes.status === 201);
        if (createRes.status === 201) {
            this.createdEntities.departments.push(createRes.data.data.department_code);
        }

        // 4.2 Division relationship
        console.log('\n4.2 Division Relationship:');
        const invalidDivDept = {
            department_code: 'TEST-INVALID-DIV',
            department_name: 'Invalid Division Dept',
            division_code: 'NON-EXISTENT-DIV'
        };
        const relRes = await this.makeRequest('POST', '/api/v1/departments', invalidDivDept);
        this.recordTest('Validate division exists', relRes.status === 400 || relRes.status === 404);

        // 4.3 Move Department
        console.log('\n4.3 Move Department:');
        if (this.createdEntities.divisions.length > 1) {
            const moveRes = await this.makeRequest('PATCH', `/api/v1/departments/${departmentData.department_code}/move`, {
                division_code: this.createdEntities.divisions[1]
            });
            this.recordTest('Move department to another division', moveRes.status === 200);
        }

        // 4.4 Get departments
        console.log('\n4.4 Get Departments:');
        const byDivisionRes = await this.makeRequest('GET', `/api/v1/divisions/${divisionCode}/departments`);
        this.recordTest('Get departments by division', byDivisionRes.status === 200);
    }

    // 5. API Key Management Tests
    async testApiKeyManagement() {
        console.log('\n\n🔑 API KEY MANAGEMENT TESTS\n');
        
        // Note: API key management might require admin web interface
        console.log('5.1 API Authentication:');
        
        // Test without API key
        const noKeyRes = await this.makeRequest('GET', '/api/v1/companies', null, { 'x-api-key': '' });
        this.recordTest('Reject request without API key', noKeyRes.status === 401);
        
        // Test with invalid API key
        const badKeyRes = await this.makeRequest('GET', '/api/v1/companies', null, { 'x-api-key': 'invalid-key' });
        this.recordTest('Reject request with invalid API key', badKeyRes.status === 401);
        
        // Test read permission
        const readRes = await this.makeRequest('GET', '/api/v1/companies');
        this.recordTest('Allow read with valid API key', readRes.status === 200);
        
        // Test write permission
        const writeTestData = {
            company_code: `PERM${Date.now().toString().slice(-8)}`, // Max 20 chars
            company_name_th: 'ทดสอบ Permission',
            company_name_en: 'Test Permission'
        };
        const writeRes = await this.makeRequest('POST', '/api/v1/companies', writeTestData);
        this.recordTest('Allow write with valid API key', writeRes.status === 201);
        if (writeRes.status === 201) {
            this.createdEntities.companies.push(writeRes.data.data.company_code);
        }
    }

    // 6. Search, Filter, Pagination Tests
    async testSearchFilterPagination() {
        console.log('\n\n🔍 SEARCH, FILTER & PAGINATION TESTS\n');
        
        // 6.1 Pagination
        console.log('6.1 Pagination:');
        const page1Res = await this.makeRequest('GET', '/api/v1/companies?page=1&limit=5');
        this.recordTest('Pagination page 1', page1Res.status === 200 && page1Res.data.pagination);
        
        const page2Res = await this.makeRequest('GET', '/api/v1/companies?page=2&limit=5');
        this.recordTest('Pagination page 2', page2Res.status === 200);
        
        // 6.2 Search
        console.log('\n6.2 Search:');
        const searchThaiRes = await this.makeRequest('GET', `/api/v1/companies?search=${encodeURIComponent('ทดสอบ')}`);
        this.recordTest('Search Thai text', searchThaiRes.status === 200);
        
        const searchEngRes = await this.makeRequest('GET', '/api/v1/companies?search=Test');
        this.recordTest('Search English text', searchEngRes.status === 200);
        
        // 6.3 Filters
        console.log('\n6.3 Filters:');
        const activeFilterRes = await this.makeRequest('GET', '/api/v1/companies?is_active=true');
        this.recordTest('Filter by active status', activeFilterRes.status === 200);
        
        const companyFilterRes = await this.makeRequest('GET', `/api/v1/branches?company_code=${this.createdEntities.companies[0]}`);
        this.recordTest('Filter branches by company', companyFilterRes.status === 200);
        
        // 6.4 Combined filters
        console.log('\n6.4 Combined Filters:');
        const combinedRes = await this.makeRequest('GET', '/api/v1/companies?search=Test&is_active=true&page=1&limit=10');
        this.recordTest('Combined search, filter, and pagination', combinedRes.status === 200);
    }

    // 7. Hierarchical Data Tests
    async testHierarchicalData() {
        console.log('\n\n🌳 HIERARCHICAL DATA TESTS\n');
        
        // 7.1 Organization Tree
        console.log('7.1 Organization Tree:');
        const treeRes = await this.makeRequest('GET', '/api/v1/organization-tree');
        this.recordTest('Get full organization tree', treeRes.status === 200);
        
        // 7.2 Company Tree
        console.log('\n7.2 Company Tree:');
        const companyTreeRes = await this.makeRequest('GET', `/api/v1/organization-tree/${this.createdEntities.companies[0]}`);
        this.recordTest('Get company organization tree', companyTreeRes.status === 200);
        
        // 7.3 Flexible API
        console.log('\n7.3 Flexible API:');
        const flexRes = await this.makeRequest('GET', `/api/v1/flexible/company-departments?company=${this.createdEntities.companies[0]}`);
        this.recordTest('Get company with departments (flexible)', flexRes.status === 200);
        
        const fullRes = await this.makeRequest('GET', `/api/v1/flexible/company-full?company=${this.createdEntities.companies[0]}`);
        this.recordTest('Get company full hierarchy', fullRes.status === 200);
    }

    // 8. Data Export Tests
    async testDataExport() {
        console.log('\n\n📊 DATA EXPORT TESTS\n');
        
        console.log('8.1 Export Tests:');
        console.log('  ⚠️  Note: Export typically requires web interface or different endpoint');
        console.log('  Checking if export endpoints exist...');
        
        // Try common export endpoints
        const exportEndpoints = [
            '/api/v1/companies/export',
            '/api/v1/export/companies',
            '/export/companies'
        ];
        
        for (const endpoint of exportEndpoints) {
            const res = await this.makeRequest('GET', endpoint);
            if (res.status !== 404) {
                this.recordTest(`Export endpoint found: ${endpoint}`, true);
                break;
            }
        }
    }

    // 9. Constraint Tests
    async testConstraints() {
        console.log('\n\n🔒 CONSTRAINT & INTEGRITY TESTS\n');
        
        // 9.1 Foreign Key Constraints
        console.log('9.1 Foreign Key Constraints:');
        
        // Try to delete company with branches
        const delCompanyWithBranchesRes = await this.makeRequest('DELETE', `/api/v1/companies/${this.createdEntities.companies[0]}`);
        this.recordTest('Prevent deleting company with branches', delCompanyWithBranchesRes.status === 400 || delCompanyWithBranchesRes.status === 409);
        
        // Try to delete division with departments
        if (this.createdEntities.departments.length > 0) {
            const delDivWithDeptsRes = await this.makeRequest('DELETE', `/api/v1/divisions/${this.createdEntities.divisions[0]}`);
            this.recordTest('Prevent deleting division with departments', delDivWithDeptsRes.status === 400 || delDivWithDeptsRes.status === 409);
        }
        
        // 9.2 Business Rules
        console.log('\n9.2 Business Rules:');
        
        // Company code format
        const invalidCodeRes = await this.makeRequest('POST', '/api/v1/companies', {
            company_code: 'test code with spaces!@#',
            company_name_th: 'Test',
            company_name_en: 'Test'
        });
        this.recordTest('Validate company code format', invalidCodeRes.status === 400);
    }

    // 10. Cleanup - Delete all test data
    async cleanup() {
        console.log('\n\n🧹 CLEANUP - DELETING TEST DATA\n');
        
        // Delete in reverse order due to constraints
        // 1. Delete Departments
        for (const code of this.createdEntities.departments) {
            const res = await this.makeRequest('DELETE', `/api/v1/departments/${code}`);
            this.recordTest(`Delete department ${code}`, res.status === 200);
        }
        
        // 2. Delete Divisions
        for (const code of this.createdEntities.divisions) {
            const res = await this.makeRequest('DELETE', `/api/v1/divisions/${code}`);
            this.recordTest(`Delete division ${code}`, res.status === 200);
        }
        
        // 3. Delete Branches
        for (const code of this.createdEntities.branches) {
            const res = await this.makeRequest('DELETE', `/api/v1/branches/${code}`);
            this.recordTest(`Delete branch ${code}`, res.status === 200);
        }
        
        // 4. Delete Companies
        for (const code of this.createdEntities.companies) {
            const res = await this.makeRequest('DELETE', `/api/v1/companies/${code}`);
            this.recordTest(`Delete company ${code}`, res.status === 200);
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('=' .repeat(80));
        console.log('🚀 COMPREHENSIVE MSSQL TEST DATABASE TEST SUITE');
        console.log('=' .repeat(80));
        
        const startTime = Date.now();
        
        try {
            await this.testCompanyManagement();
            await this.testBranchManagement();
            await this.testDivisionManagement();
            await this.testDepartmentManagement();
            await this.testApiKeyManagement();
            await this.testSearchFilterPagination();
            await this.testHierarchicalData();
            await this.testDataExport();
            await this.testConstraints();
            await this.cleanup();
        } catch (error) {
            console.error('\n❌ Test suite error:', error.message);
        }
        
        const duration = Date.now() - startTime;
        
        // Print summary
        console.log('\n' + '=' .repeat(80));
        console.log('📊 TEST SUMMARY');
        console.log('=' .repeat(80));
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📋 Total: ${this.testResults.total}`);
        console.log(`📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log('=' .repeat(80));
        
        // Save detailed results
        const report = {
            timestamp: new Date().toISOString(),
            duration: duration,
            summary: this.testResults,
            createdEntities: this.createdEntities
        };
        
        fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed results saved to test-results.json');
    }
}

// Run tests
const tester = new ComprehensiveTestSuite();
tester.runAllTests();