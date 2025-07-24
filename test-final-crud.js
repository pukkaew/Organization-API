// Final CRUD Test with Working API Key
const http = require('http');

class FinalCRUDTester {
    constructor() {
        this.baseUrl = 'http://localhost:3003';
        // Use the Development API Key from the fix
        this.apiKey = 'tVCSQZofGuGxj6JrMw8vjyTwKIvi8CqzcrLyUzPw';
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
                    'x-api-key': this.apiKey,
                    'User-Agent': 'Final-CRUD-Test/1.0'
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
        const result = { test: testName, success, statusCode, message };
        this.testResults.push(result);
        
        const status = success ? '✅' : '❌';
        console.log(`   ${status} ${testName} (${statusCode}): ${message}`);
    }

    async testCompleteCRUD() {
        console.log('🚀 FINAL CRUD TEST WITH WORKING API KEY\n');
        console.log(`🔑 Using API Key: ${this.apiKey.substring(0, 10)}...\n`);
        console.log('=' + '='.repeat(60) + '\n');

        // Test Companies
        await this.testCompanyCRUD();
        
        // Test Departments
        await this.testDepartmentCRUD();
        
        // Test Branches
        await this.testBranchCRUD();
        
        // Test Divisions
        await this.testDivisionCRUD();
    }

    async testCompanyCRUD() {
        console.log('🏢 COMPANY CRUD TEST\n');

        try {
            // CREATE
            const testCode = `FINAL-${Date.now().toString().slice(-6)}`;
            const companyData = {
                company_code: testCode,
                company_name_th: 'บริษัททดสอบ Final CRUD จำกัด',
                company_name_en: 'Final CRUD Test Company Ltd.',
                tax_id: `88${Date.now().toString().slice(-11)}`,
                is_active: true
            };

            console.log('➕ CREATE: POST /api/v1/companies');
            const createResp = await this.makeRequest('POST', '/api/v1/companies', companyData);
            this.logTest('Company CREATE', createResp.statusCode === 201, createResp.statusCode, 
                createResp.data.success ? `Created ${testCode}` : createResp.data.message);

            if (createResp.statusCode === 201) {
                // READ
                console.log('📖 READ: GET /api/v1/companies/:code');
                const readResp = await this.makeRequest('GET', `/api/v1/companies/${testCode}`);
                this.logTest('Company READ', readResp.statusCode === 200, readResp.statusCode,
                    readResp.data.success ? 'Retrieved company' : readResp.data.message);

                // UPDATE
                console.log('✏️ UPDATE: PUT /api/v1/companies/:code');
                const updateData = {
                    ...companyData,
                    company_name_th: 'บริษัททดสอบ Final CRUD จำกัด (อัพเดท)'
                };
                const updateResp = await this.makeRequest('PUT', `/api/v1/companies/${testCode}`, updateData);
                this.logTest('Company UPDATE', updateResp.statusCode === 200, updateResp.statusCode,
                    updateResp.data.success ? 'Updated company' : updateResp.data.message);

                // DELETE
                console.log('🗑️ DELETE: DELETE /api/v1/companies/:code');
                const deleteResp = await this.makeRequest('DELETE', `/api/v1/companies/${testCode}`);
                this.logTest('Company DELETE', deleteResp.statusCode === 200, deleteResp.statusCode,
                    deleteResp.data.success ? 'Deleted company' : deleteResp.data.message);
            }

        } catch (error) {
            this.logTest('Company CRUD', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async testDepartmentCRUD() {
        console.log('🏛️ DEPARTMENT CRUD TEST\n');

        try {
            // CREATE
            const testCode = `DEPT-${Date.now().toString().slice(-6)}`;
            const deptData = {
                department_code: testCode,
                department_name: 'แผนกทดสอบ Final CRUD',
                division_code: 'RUXCHAI-DIV01'
            };

            console.log('➕ CREATE: POST /api/v1/departments');
            const createResp = await this.makeRequest('POST', '/api/v1/departments', deptData);
            this.logTest('Department CREATE', createResp.statusCode === 201, createResp.statusCode,
                createResp.data.success ? `Created ${testCode}` : createResp.data.message);

            if (createResp.statusCode === 201) {
                // READ
                console.log('📖 READ: GET /api/v1/departments/:code');
                const readResp = await this.makeRequest('GET', `/api/v1/departments/${testCode}`);
                this.logTest('Department READ', readResp.statusCode === 200, readResp.statusCode,
                    readResp.data.success ? 'Retrieved department' : readResp.data.message);

                // UPDATE
                console.log('✏️ UPDATE: PUT /api/v1/departments/:code');
                const updateData = {
                    ...deptData,
                    department_name: 'แผนกทดสอบ Final CRUD (อัพเดท)'
                };
                const updateResp = await this.makeRequest('PUT', `/api/v1/departments/${testCode}`, updateData);
                this.logTest('Department UPDATE', updateResp.statusCode === 200, updateResp.statusCode,
                    updateResp.data.success ? 'Updated department' : updateResp.data.message);

                // DELETE
                console.log('🗑️ DELETE: DELETE /api/v1/departments/:code');
                const deleteResp = await this.makeRequest('DELETE', `/api/v1/departments/${testCode}`);
                this.logTest('Department DELETE', deleteResp.statusCode === 200, deleteResp.statusCode,
                    deleteResp.data.success ? 'Deleted department' : deleteResp.data.message);
            }

        } catch (error) {
            this.logTest('Department CRUD', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async testBranchCRUD() {
        console.log('🏪 BRANCH CRUD TEST\n');

        try {
            // CREATE
            const testCode = `BR-${Date.now().toString().slice(-6)}`;
            const branchData = {
                branch_code: testCode,
                branch_name: 'สาขาทดสอบ Final CRUD',
                company_code: 'RUXCHAI',
                is_headquarters: false
            };

            console.log('➕ CREATE: POST /api/v1/branches');
            const createResp = await this.makeRequest('POST', '/api/v1/branches', branchData);
            this.logTest('Branch CREATE', createResp.statusCode === 201, createResp.statusCode,
                createResp.data.success ? `Created ${testCode}` : createResp.data.message);

            if (createResp.statusCode === 201) {
                // READ
                console.log('📖 READ: GET /api/v1/branches/:code');
                const readResp = await this.makeRequest('GET', `/api/v1/branches/${testCode}`);
                this.logTest('Branch READ', readResp.statusCode === 200, readResp.statusCode,
                    readResp.data.success ? 'Retrieved branch' : readResp.data.message);

                // UPDATE
                console.log('✏️ UPDATE: PUT /api/v1/branches/:code');
                const updateData = {
                    ...branchData,
                    branch_name: 'สาขาทดสอบ Final CRUD (อัพเดท)'
                };
                const updateResp = await this.makeRequest('PUT', `/api/v1/branches/${testCode}`, updateData);
                this.logTest('Branch UPDATE', updateResp.statusCode === 200, updateResp.statusCode,
                    updateResp.data.success ? 'Updated branch' : updateResp.data.message);

                // DELETE
                console.log('🗑️ DELETE: DELETE /api/v1/branches/:code');
                const deleteResp = await this.makeRequest('DELETE', `/api/v1/branches/${testCode}`);
                this.logTest('Branch DELETE', deleteResp.statusCode === 200, deleteResp.statusCode,
                    deleteResp.data.success ? 'Deleted branch' : deleteResp.data.message);
            }

        } catch (error) {
            this.logTest('Branch CRUD', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async testDivisionCRUD() {
        console.log('🏗️ DIVISION CRUD TEST\n');

        try {
            // CREATE
            const testCode = `DIV-${Date.now().toString().slice(-6)}`;
            const divisionData = {
                division_code: testCode,
                division_name: 'ฝ่ายทดสอบ Final CRUD',
                company_code: 'RUXCHAI',
                branch_code: 'RUXCHAI-HQ'
            };

            console.log('➕ CREATE: POST /api/v1/divisions');
            const createResp = await this.makeRequest('POST', '/api/v1/divisions', divisionData);
            this.logTest('Division CREATE', createResp.statusCode === 201, createResp.statusCode,
                createResp.data.success ? `Created ${testCode}` : createResp.data.message);

            if (createResp.statusCode === 201) {
                // READ
                console.log('📖 READ: GET /api/v1/divisions/:code');
                const readResp = await this.makeRequest('GET', `/api/v1/divisions/${testCode}`);
                this.logTest('Division READ', readResp.statusCode === 200, readResp.statusCode,
                    readResp.data.success ? 'Retrieved division' : readResp.data.message);

                // UPDATE
                console.log('✏️ UPDATE: PUT /api/v1/divisions/:code');
                const updateData = {
                    ...divisionData,
                    division_name: 'ฝ่ายทดสอบ Final CRUD (อัพเดท)'
                };
                const updateResp = await this.makeRequest('PUT', `/api/v1/divisions/${testCode}`, updateData);
                this.logTest('Division UPDATE', updateResp.statusCode === 200, updateResp.statusCode,
                    updateResp.data.success ? 'Updated division' : updateResp.data.message);

                // DELETE
                console.log('🗑️ DELETE: DELETE /api/v1/divisions/:code');
                const deleteResp = await this.makeRequest('DELETE', `/api/v1/divisions/${testCode}`);
                this.logTest('Division DELETE', deleteResp.statusCode === 200, deleteResp.statusCode,
                    deleteResp.data.success ? 'Deleted division' : deleteResp.data.message);
            }

        } catch (error) {
            this.logTest('Division CRUD', false, 0, `Error: ${error.message}`);
        }
        console.log();
    }

    async runTests() {
        const startTime = Date.now();

        await this.testCompleteCRUD();

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Summary
        const passed = this.testResults.filter(r => r.success).length;
        const failed = this.testResults.filter(r => !r.success).length;
        const total = this.testResults.length;

        console.log('\n' + '=' + '='.repeat(60));
        console.log('📊 FINAL CRUD TEST SUMMARY');
        console.log('=' + '='.repeat(60));
        console.log(`⏱️  Total Time: ${duration}ms`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📋 Total: ${total}`);
        console.log(`📈 Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);

        if (failed > 0) {
            console.log('\n❌ FAILED OPERATIONS:');
            this.testResults.filter(r => !r.success).forEach(result => {
                console.log(`   - ${result.test} (${result.statusCode}): ${result.message}`);
            });
        } else if (total > 0) {
            console.log('\n🎉 ALL CRUD OPERATIONS WORKING PERFECTLY!');
            console.log('   ✅ CREATE (POST) - Working');
            console.log('   ✅ READ (GET) - Working');
            console.log('   ✅ UPDATE (PUT) - Working');
            console.log('   ✅ DELETE (DELETE) - Working');
            console.log('\n🚀 API is fully functional and ready for production!');
        }

        console.log('=' + '='.repeat(60) + '\n');
    }
}

// Run the final test
const tester = new FinalCRUDTester();
tester.runTests();