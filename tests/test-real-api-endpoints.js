// Test Real API Endpoints with HTTP Requests
const http = require('http');

class RealAPITester {
    constructor() {
        this.baseUrl = 'http://localhost:3003';
        this.testResults = [];
    }

    async makeRequest(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3003,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Test-Client/1.0'
                }
            };

            if (data) {
                const jsonData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(jsonData);
            }

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const responseData = body ? JSON.parse(body) : {};
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: responseData
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: { raw: body, parseError: error.message }
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

    logTest(testName, success, statusCode, message = '') {
        const result = {
            test: testName,
            success: success,
            statusCode: statusCode,
            message: message
        };
        this.testResults.push(result);
        
        const status = success ? '✅' : '❌';
        console.log(`   ${status} ${testName} (${statusCode}): ${message}`);
    }

    async testCompanyOperations() {
        console.log('🏢 Testing Company Operations\n');

        try {
            // GET /api/companies
            console.log('📊 Test 1.1: GET /api/companies');
            const getCompanies = await this.makeRequest('GET', '/api/companies');
            this.logTest('GET Companies', 
                getCompanies.statusCode === 200, 
                getCompanies.statusCode, 
                getCompanies.data.success ? `Retrieved ${getCompanies.data.data?.length || 0} companies` : getCompanies.data.message
            );

            // GET /api/companies/RUXCHAI
            console.log('📊 Test 1.2: GET /api/companies/RUXCHAI');
            const getCompany = await this.makeRequest('GET', '/api/companies/RUXCHAI');
            this.logTest('GET Company by Code', 
                getCompany.statusCode === 200, 
                getCompany.statusCode, 
                getCompany.data.success ? 'Retrieved company details' : getCompany.data.message
            );

            // POST /api/companies (Create)
            console.log('📊 Test 1.3: POST /api/companies (Create)');
            const newCompany = {
                company_code: `TEST-${Date.now().toString().slice(-6)}`,
                company_name_th: 'บริษัททดสอบ API จำกัด',
                company_name_en: 'Test API Company Ltd.',
                tax_id: '9876543210123',
                is_active: true
            };

            const createCompany = await this.makeRequest('POST', '/api/companies', newCompany);
            this.logTest('POST Create Company', 
                createCompany.statusCode === 201, 
                createCompany.statusCode, 
                createCompany.data.success ? `Created company ${newCompany.company_code}` : createCompany.data.message
            );

            // If company was created successfully, test update and delete
            if (createCompany.statusCode === 201 && createCompany.data.success) {
                // PUT /api/companies/:code (Update)
                console.log('📊 Test 1.4: PUT /api/companies/:code (Update)');
                const updateData = {
                    company_name_th: 'บริษัททดสอบ API จำกัด (อัพเดท)',
                    company_name_en: 'Test API Company Ltd. (Updated)',
                    tax_id: newCompany.tax_id,
                    is_active: true
                };

                const updateCompany = await this.makeRequest('PUT', `/api/companies/${newCompany.company_code}`, updateData);
                this.logTest('PUT Update Company', 
                    updateCompany.statusCode === 200, 
                    updateCompany.statusCode, 
                    updateCompany.data.success ? 'Company updated successfully' : updateCompany.data.message
                );

                // DELETE /api/companies/:code
                console.log('📊 Test 1.5: DELETE /api/companies/:code');
                const deleteCompany = await this.makeRequest('DELETE', `/api/companies/${newCompany.company_code}`);
                this.logTest('DELETE Company', 
                    deleteCompany.statusCode === 200, 
                    deleteCompany.statusCode, 
                    deleteCompany.data.success ? 'Company deleted successfully' : deleteCompany.data.message
                );
            }

        } catch (error) {
            this.logTest('Company Operations', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async testDepartmentOperations() {
        console.log('🏛️ Testing Department Operations\n');

        try {
            // GET /api/departments
            console.log('🏛️ Test 2.1: GET /api/departments');
            const getDepartments = await this.makeRequest('GET', '/api/departments');
            this.logTest('GET Departments', 
                getDepartments.statusCode === 200, 
                getDepartments.statusCode, 
                getDepartments.data.success ? `Retrieved ${getDepartments.data.data?.length || 0} departments` : getDepartments.data.message
            );

            // GET /api/departments with hierarchy
            console.log('🏛️ Test 2.2: GET /api/departments?include_hierarchy=true');
            const getDepartmentsHierarchy = await this.makeRequest('GET', '/api/departments?include_hierarchy=true');
            this.logTest('GET Departments with Hierarchy', 
                getDepartmentsHierarchy.statusCode === 200, 
                getDepartmentsHierarchy.statusCode, 
                getDepartmentsHierarchy.data.success ? 'Retrieved departments with hierarchy' : getDepartmentsHierarchy.data.message
            );

            // POST /api/departments (Create)
            console.log('🏛️ Test 2.3: POST /api/departments (Create)');
            const newDepartment = {
                department_code: `TEST-DEPT-${Date.now().toString().slice(-6)}`,
                department_name: 'แผนกทดสอบ API',
                division_code: 'RUXCHAI-DIV01'
            };

            const createDepartment = await this.makeRequest('POST', '/api/departments', newDepartment);
            this.logTest('POST Create Department', 
                createDepartment.statusCode === 201, 
                createDepartment.statusCode, 
                createDepartment.data.success ? `Created department ${newDepartment.department_code}` : createDepartment.data.message
            );

            // If department was created successfully, test update and delete
            if (createDepartment.statusCode === 201 && createDepartment.data.success) {
                // GET /api/departments/:code
                console.log('🏛️ Test 2.4: GET /api/departments/:code');
                const getDepartment = await this.makeRequest('GET', `/api/departments/${newDepartment.department_code}`);
                this.logTest('GET Department by Code', 
                    getDepartment.statusCode === 200, 
                    getDepartment.statusCode, 
                    getDepartment.data.success ? 'Retrieved department details' : getDepartment.data.message
                );

                // PUT /api/departments/:code (Update)
                console.log('🏛️ Test 2.5: PUT /api/departments/:code (Update)');
                const updateData = {
                    department_name: 'แผนกทดสอบ API (อัพเดท)',
                    division_code: 'RUXCHAI-DIV01'
                };

                const updateDepartment = await this.makeRequest('PUT', `/api/departments/${newDepartment.department_code}`, updateData);
                this.logTest('PUT Update Department', 
                    updateDepartment.statusCode === 200, 
                    updateDepartment.statusCode, 
                    updateDepartment.data.success ? 'Department updated successfully' : updateDepartment.data.message
                );

                // DELETE /api/departments/:code
                console.log('🏛️ Test 2.6: DELETE /api/departments/:code');
                const deleteDepartment = await this.makeRequest('DELETE', `/api/departments/${newDepartment.department_code}`);
                this.logTest('DELETE Department', 
                    deleteDepartment.statusCode === 200, 
                    deleteDepartment.statusCode, 
                    deleteDepartment.data.success ? 'Department deleted successfully' : deleteDepartment.data.message
                );
            }

        } catch (error) {
            this.logTest('Department Operations', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async testBranchOperations() {
        console.log('🏪 Testing Branch Operations\n');

        try {
            // GET /api/branches
            console.log('🏪 Test 3.1: GET /api/branches');
            const getBranches = await this.makeRequest('GET', '/api/branches');
            this.logTest('GET Branches', 
                getBranches.statusCode === 200, 
                getBranches.statusCode, 
                getBranches.data.success ? `Retrieved ${getBranches.data.data?.length || 0} branches` : getBranches.data.message
            );

            // POST /api/branches (Create)
            console.log('🏪 Test 3.2: POST /api/branches (Create)');
            const newBranch = {
                branch_code: `TEST-BR-${Date.now().toString().slice(-6)}`,
                branch_name: 'สาขาทดสอบ API',
                company_code: 'RUXCHAI',
                is_headquarters: false
            };

            const createBranch = await this.makeRequest('POST', '/api/branches', newBranch);
            this.logTest('POST Create Branch', 
                createBranch.statusCode === 201, 
                createBranch.statusCode, 
                createBranch.data.success ? `Created branch ${newBranch.branch_code}` : createBranch.data.message
            );

            // If branch was created successfully, test update and delete
            if (createBranch.statusCode === 201 && createBranch.data.success) {
                // PUT /api/branches/:code (Update)
                console.log('🏪 Test 3.3: PUT /api/branches/:code (Update)');
                const updateData = {
                    branch_name: 'สาขาทดสอบ API (อัพเดท)',
                    company_code: 'RUXCHAI',
                    is_headquarters: false
                };

                const updateBranch = await this.makeRequest('PUT', `/api/branches/${newBranch.branch_code}`, updateData);
                this.logTest('PUT Update Branch', 
                    updateBranch.statusCode === 200, 
                    updateBranch.statusCode, 
                    updateBranch.data.success ? 'Branch updated successfully' : updateBranch.data.message
                );

                // DELETE /api/branches/:code
                console.log('🏪 Test 3.4: DELETE /api/branches/:code');
                const deleteBranch = await this.makeRequest('DELETE', `/api/branches/${newBranch.branch_code}`);
                this.logTest('DELETE Branch', 
                    deleteBranch.statusCode === 200, 
                    deleteBranch.statusCode, 
                    deleteBranch.data.success ? 'Branch deleted successfully' : deleteBranch.data.message
                );
            }

        } catch (error) {
            this.logTest('Branch Operations', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async testErrorScenarios() {
        console.log('⚠️  Testing Error Scenarios\n');

        try {
            // Test 404 - Non-existent company
            console.log('⚠️  Test 4.1: GET /api/companies/INVALID-CODE (404 test)');
            const get404 = await this.makeRequest('GET', '/api/companies/INVALID-CODE');
            this.logTest('404 Not Found', 
                get404.statusCode === 404, 
                get404.statusCode, 
                'Properly returns 404 for non-existent resource'
            );

            // Test validation error - Invalid data
            console.log('⚠️  Test 4.2: POST /api/companies with invalid data');
            const invalidCompany = {
                // Missing required fields
                company_name_th: '',
                tax_id: 'invalid'
            };

            const createInvalid = await this.makeRequest('POST', '/api/companies', invalidCompany);
            this.logTest('Validation Error', 
                createInvalid.statusCode === 400, 
                createInvalid.statusCode, 
                'Properly validates required fields'
            );

            // Test duplicate key
            console.log('⚠️  Test 4.3: POST /api/companies with duplicate code');
            const duplicateCompany = {
                company_code: 'RUXCHAI', // This should already exist
                company_name_th: 'Duplicate Company',
                tax_id: '1111111111111'
            };

            const createDuplicate = await this.makeRequest('POST', '/api/companies', duplicateCompany);
            this.logTest('Duplicate Key Error', 
                createDuplicate.statusCode === 400 || createDuplicate.statusCode === 409, 
                createDuplicate.statusCode, 
                'Properly handles duplicate key constraint'
            );

        } catch (error) {
            this.logTest('Error Scenarios', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async runAllTests() {
        console.log('🚀 REAL API ENDPOINT TESTING\n');
        console.log('🌐 Testing against: http://localhost:3003\n');
        console.log('=' + '='.repeat(50) + '\n');

        const startTime = Date.now();

        try {
            // Wait a moment for server to be ready
            console.log('⏳ Waiting for server to be ready...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));

            await this.testCompanyOperations();
            await this.testDepartmentOperations();
            await this.testBranchOperations();
            await this.testErrorScenarios();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Summary
        const passed = this.testResults.filter(r => r.success).length;
        const failed = this.testResults.filter(r => !r.success).length;
        const total = this.testResults.length;

        console.log('\n' + '=' + '='.repeat(50));
        console.log('📊 REAL API TEST SUMMARY');
        console.log('=' + '='.repeat(50));
        console.log(`⏱️  Total Time: ${duration}ms`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📋 Total: ${total}`);
        console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.filter(r => !r.success).forEach(result => {
                console.log(`   - ${result.test} (${result.statusCode}): ${result.message}`);
            });
        }

        console.log('=' + '='.repeat(50) + '\n');
    }
}

// Run the tests
const tester = new RealAPITester();
tester.runAllTests();