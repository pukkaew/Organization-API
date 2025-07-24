// Test API with proper API Key authentication
const http = require('http');
const sql = require('mssql');

class AuthenticatedAPITester {
    constructor() {
        this.baseUrl = 'http://localhost:3003';
        this.apiKey = null;
        this.testResults = [];
        this.config = {
            server: process.env.DB_SERVER,
            port: parseInt(process.env.DB_PORT) || 1433,
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        };
    }

    async getApiKey() {
        console.log('🔑 Getting API Key from database...');
        const pool = await sql.connect(this.config);
        
        const result = await pool.request().query(`
            SELECT api_key, app_name, permissions 
            FROM API_Keys 
            WHERE is_active = 1 AND permissions LIKE '%write%'
            ORDER BY created_date DESC
        `);
        
        if (result.recordset.length > 0) {
            this.apiKey = result.recordset[0].api_key;
            console.log(`✅ Using API Key: ${this.apiKey.substring(0, 10)}... (${result.recordset[0].app_name})`);
            console.log(`   Permissions: ${result.recordset[0].permissions}\n`);
        } else {
            throw new Error('No valid API key found with write permissions');
        }
        
        await pool.close();
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
                    'x-api-key': this.apiKey,
                    'User-Agent': 'API-Test-Client/1.0'
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

    logTest(testName, success, statusCode, message = '', responseData = null) {
        const result = {
            test: testName,
            success: success,
            statusCode: statusCode,
            message: message,
            data: responseData
        };
        this.testResults.push(result);
        
        const status = success ? '✅' : '❌';
        console.log(`   ${status} ${testName} (${statusCode}): ${message}`);
        
        // Log detailed error if failed
        if (!success && responseData && responseData.error) {
            console.log(`      Error: ${responseData.error.message}`);
        }
    }

    async testCRUDOperations() {
        console.log('🧪 TESTING FULL CRUD OPERATIONS\n');

        // Test Companies CRUD
        await this.testCompanyCRUD();
        
        // Test Departments CRUD  
        await this.testDepartmentCRUD();
        
        // Test Branches CRUD
        await this.testBranchCRUD();
    }

    async testCompanyCRUD() {
        console.log('🏢 Testing Company CRUD Operations\n');

        try {
            // 1. GET Companies (Read)
            console.log('📖 Test 1.1: GET /api/companies (Read)');
            const getCompanies = await this.makeRequest('GET', '/api/companies');
            this.logTest('GET Companies', 
                getCompanies.statusCode === 200, 
                getCompanies.statusCode, 
                getCompanies.data.success ? `Retrieved ${getCompanies.data.data?.length || 0} companies` : 'Failed to retrieve companies',
                getCompanies.data
            );

            // 2. POST Company (Create)
            console.log('➕ Test 1.2: POST /api/companies (Create)');
            const testCompanyCode = `TEST-${Date.now().toString().slice(-6)}`;
            const newCompany = {
                company_code: testCompanyCode,
                company_name_th: 'บริษัททดสอบ CRUD จำกัด',
                company_name_en: 'Test CRUD Company Ltd.',
                tax_id: `99${Date.now().toString().slice(-11)}`,
                is_active: true
            };

            const createCompany = await this.makeRequest('POST', '/api/companies', newCompany);
            this.logTest('POST Create Company', 
                createCompany.statusCode === 201, 
                createCompany.statusCode, 
                createCompany.data.success ? `Created company ${testCompanyCode}` : 'Failed to create company',
                createCompany.data
            );

            if (createCompany.statusCode === 201 && createCompany.data.success) {
                // 3. GET Company by ID (Read Single)
                console.log('🔍 Test 1.3: GET /api/companies/:code (Read Single)');
                const getCompany = await this.makeRequest('GET', `/api/companies/${testCompanyCode}`);
                this.logTest('GET Company by Code', 
                    getCompany.statusCode === 200, 
                    getCompany.statusCode, 
                    getCompany.data.success ? 'Retrieved company details' : 'Failed to retrieve company',
                    getCompany.data
                );

                // 4. PUT Company (Update)
                console.log('✏️ Test 1.4: PUT /api/companies/:code (Update)');
                const updateData = {
                    company_name_th: 'บริษัททดสอบ CRUD จำกัด (อัพเดท)',
                    company_name_en: 'Test CRUD Company Ltd. (Updated)',
                    tax_id: newCompany.tax_id,
                    is_active: true
                };

                const updateCompany = await this.makeRequest('PUT', `/api/companies/${testCompanyCode}`, updateData);
                this.logTest('PUT Update Company', 
                    updateCompany.statusCode === 200, 
                    updateCompany.statusCode, 
                    updateCompany.data.success ? 'Company updated successfully' : 'Failed to update company',
                    updateCompany.data
                );

                // 5. Verify Update
                console.log('✔️ Test 1.5: Verify Update');
                const verifyUpdate = await this.makeRequest('GET', `/api/companies/${testCompanyCode}`);
                const isUpdated = verifyUpdate.data.success && 
                                 verifyUpdate.data.data.company_name_th.includes('อัพเดท');
                this.logTest('Verify Update', 
                    isUpdated, 
                    verifyUpdate.statusCode, 
                    isUpdated ? 'Update verified successfully' : 'Update verification failed',
                    verifyUpdate.data
                );

                // 6. DELETE Company
                console.log('🗑️ Test 1.6: DELETE /api/companies/:code (Delete)');
                const deleteCompany = await this.makeRequest('DELETE', `/api/companies/${testCompanyCode}`);
                this.logTest('DELETE Company', 
                    deleteCompany.statusCode === 200, 
                    deleteCompany.statusCode, 
                    deleteCompany.data.success ? 'Company deleted successfully' : 'Failed to delete company',
                    deleteCompany.data
                );

                // 7. Verify Delete (should return 404)
                console.log('✔️ Test 1.7: Verify Delete (should be 404)');
                const verifyDelete = await this.makeRequest('GET', `/api/companies/${testCompanyCode}`);
                this.logTest('Verify Delete', 
                    verifyDelete.statusCode === 404, 
                    verifyDelete.statusCode, 
                    verifyDelete.statusCode === 404 ? 'Delete verified - company not found' : 'Delete verification failed',
                    verifyDelete.data
                );
            }

        } catch (error) {
            this.logTest('Company CRUD', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async testDepartmentCRUD() {
        console.log('🏛️ Testing Department CRUD Operations\n');

        try {
            // 1. GET Departments (Read)
            console.log('📖 Test 2.1: GET /api/departments (Read)');
            const getDepartments = await this.makeRequest('GET', '/api/departments');
            this.logTest('GET Departments', 
                getDepartments.statusCode === 200, 
                getDepartments.statusCode, 
                getDepartments.data.success ? `Retrieved ${getDepartments.data.data?.length || 0} departments` : 'Failed to retrieve departments',
                getDepartments.data
            );

            // 2. POST Department (Create)
            console.log('➕ Test 2.2: POST /api/departments (Create)');
            const testDeptCode = `TEST-DEPT-${Date.now().toString().slice(-6)}`;
            const newDepartment = {
                department_code: testDeptCode,
                department_name: 'แผนกทดสอบ CRUD',
                division_code: 'RUXCHAI-DIV01'
            };

            const createDepartment = await this.makeRequest('POST', '/api/departments', newDepartment);
            this.logTest('POST Create Department', 
                createDepartment.statusCode === 201, 
                createDepartment.statusCode, 
                createDepartment.data.success ? `Created department ${testDeptCode}` : 'Failed to create department',
                createDepartment.data
            );

            if (createDepartment.statusCode === 201 && createDepartment.data.success) {
                // 3. GET Department by ID (Read Single)
                console.log('🔍 Test 2.3: GET /api/departments/:code (Read Single)');
                const getDepartment = await this.makeRequest('GET', `/api/departments/${testDeptCode}`);
                this.logTest('GET Department by Code', 
                    getDepartment.statusCode === 200, 
                    getDepartment.statusCode, 
                    getDepartment.data.success ? 'Retrieved department details' : 'Failed to retrieve department',
                    getDepartment.data
                );

                // 4. PUT Department (Update)
                console.log('✏️ Test 2.4: PUT /api/departments/:code (Update)');
                const updateData = {
                    department_name: 'แผนกทดสอบ CRUD (อัพเดท)',
                    division_code: 'RUXCHAI-DIV01'
                };

                const updateDepartment = await this.makeRequest('PUT', `/api/departments/${testDeptCode}`, updateData);
                this.logTest('PUT Update Department', 
                    updateDepartment.statusCode === 200, 
                    updateDepartment.statusCode, 
                    updateDepartment.data.success ? 'Department updated successfully' : 'Failed to update department',
                    updateDepartment.data
                );

                // 5. DELETE Department
                console.log('🗑️ Test 2.5: DELETE /api/departments/:code (Delete)');
                const deleteDepartment = await this.makeRequest('DELETE', `/api/departments/${testDeptCode}`);
                this.logTest('DELETE Department', 
                    deleteDepartment.statusCode === 200, 
                    deleteDepartment.statusCode, 
                    deleteDepartment.data.success ? 'Department deleted successfully' : 'Failed to delete department',
                    deleteDepartment.data
                );
            }

        } catch (error) {
            this.logTest('Department CRUD', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async testBranchCRUD() {
        console.log('🏪 Testing Branch CRUD Operations\n');

        try {
            // 1. GET Branches (Read)
            console.log('📖 Test 3.1: GET /api/branches (Read)');
            const getBranches = await this.makeRequest('GET', '/api/branches');
            this.logTest('GET Branches', 
                getBranches.statusCode === 200, 
                getBranches.statusCode, 
                getBranches.data.success ? `Retrieved ${getBranches.data.data?.length || 0} branches` : 'Failed to retrieve branches',
                getBranches.data
            );

            // 2. POST Branch (Create)
            console.log('➕ Test 3.2: POST /api/branches (Create)');
            const testBranchCode = `TEST-BR-${Date.now().toString().slice(-6)}`;
            const newBranch = {
                branch_code: testBranchCode,
                branch_name: 'สาขาทดสอบ CRUD',
                company_code: 'RUXCHAI',
                is_headquarters: false
            };

            const createBranch = await this.makeRequest('POST', '/api/branches', newBranch);
            this.logTest('POST Create Branch', 
                createBranch.statusCode === 201, 
                createBranch.statusCode, 
                createBranch.data.success ? `Created branch ${testBranchCode}` : 'Failed to create branch',
                createBranch.data
            );

            if (createBranch.statusCode === 201 && createBranch.data.success) {
                // 3. PUT Branch (Update)
                console.log('✏️ Test 3.3: PUT /api/branches/:code (Update)');
                const updateData = {
                    branch_name: 'สาขาทดสอบ CRUD (อัพเดท)',
                    company_code: 'RUXCHAI',
                    is_headquarters: false
                };

                const updateBranch = await this.makeRequest('PUT', `/api/branches/${testBranchCode}`, updateData);
                this.logTest('PUT Update Branch', 
                    updateBranch.statusCode === 200, 
                    updateBranch.statusCode, 
                    updateBranch.data.success ? 'Branch updated successfully' : 'Failed to update branch',
                    updateBranch.data
                );

                // 4. DELETE Branch
                console.log('🗑️ Test 3.4: DELETE /api/branches/:code (Delete)');
                const deleteBranch = await this.makeRequest('DELETE', `/api/branches/${testBranchCode}`);
                this.logTest('DELETE Branch', 
                    deleteBranch.statusCode === 200, 
                    deleteBranch.statusCode, 
                    deleteBranch.data.success ? 'Branch deleted successfully' : 'Failed to delete branch',
                    deleteBranch.data
                );
            }

        } catch (error) {
            this.logTest('Branch CRUD', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async runTests() {
        console.log('🚀 AUTHENTICATED API CRUD TESTING\n');
        console.log('🗄️ Testing against SQL Server Test Database\n');
        console.log('=' + '='.repeat(60) + '\n');

        const startTime = Date.now();

        try {
            // Get API key first
            await this.getApiKey();

            // Wait for server to be ready
            console.log('⏳ Waiting for server to be ready...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Run CRUD tests
            await this.testCRUDOperations();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.logTest('Test Suite', false, 0, error.message);
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Summary
        const passed = this.testResults.filter(r => r.success).length;
        const failed = this.testResults.filter(r => !r.success).length;
        const total = this.testResults.length;

        console.log('\n' + '=' + '='.repeat(60));
        console.log('📊 AUTHENTICATED API CRUD TEST SUMMARY');
        console.log('=' + '='.repeat(60));
        console.log(`⏱️  Total Time: ${duration}ms`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📋 Total: ${total}`);
        console.log(`📈 Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);

        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.filter(r => !r.success).forEach(result => {
                console.log(`   - ${result.test} (${result.statusCode}): ${result.message}`);
            });
            
            console.log('\n🔧 POSSIBLE ISSUES TO CHECK:');
            console.log('   1. API Key permissions (need read_write)');
            console.log('   2. Database constraints or validation errors');
            console.log('   3. Missing required fields in request data');
            console.log('   4. Server-side validation logic');
            console.log('   5. Database connection issues');
        } else if (total > 0) {
            console.log('\n🎉 ALL CRUD OPERATIONS WORKING PERFECTLY!');
            console.log('   ✅ Create (POST) - Working');
            console.log('   ✅ Read (GET) - Working');
            console.log('   ✅ Update (PUT) - Working');
            console.log('   ✅ Delete (DELETE) - Working');
        }

        console.log('=' + '='.repeat(60) + '\n');
    }
}

// Load environment variables
require('dotenv').config();

// Run the tests
const tester = new AuthenticatedAPITester();
tester.runTests();