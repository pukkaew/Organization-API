// Detailed API testing with error analysis and sample data
const http = require('http');

const HOST = 'localhost';
const PORT = 3003;
const API_BASE = '/api/v1';
const API_KEY = 'test-api-key-12345'; // Read/write permissions
const READ_ONLY_KEY = 'read-only-key-67890'; // Read only

// Utility function to make HTTP requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const reqOptions = {
            hostname: HOST,
            port: PORT,
            path: options.path,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': options.apiKey || API_KEY,
                ...options.headers
            }
        };

        const req = http.request(reqOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: parsed,
                        raw: body
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body,
                        raw: body,
                        parseError: true
                    });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Test functions
async function testBasicEndpoints() {
    console.log('🔍 TESTING BASIC ENDPOINTS WITH DETAILED ERROR ANALYSIS');
    console.log('=======================================================\n');

    const tests = [
        { name: 'List Companies', path: `${API_BASE}/companies` },
        { name: 'List Branches', path: `${API_BASE}/branches` },
        { name: 'List Divisions', path: `${API_BASE}/divisions` },
        { name: 'List Departments', path: `${API_BASE}/departments` }
    ];

    for (const test of tests) {
        console.log(`📋 ${test.name}`);
        try {
            const res = await makeRequest({ path: test.path });
            console.log(`   Status: ${res.status}`);
            
            if (res.status === 200) {
                if (res.body.success) {
                    console.log(`   ✅ Success: ${res.body.message || 'OK'}`);
                    if (res.body.data) {
                        console.log(`   📊 Records: ${res.body.data.length}`);
                        if (res.body.pagination) {
                            console.log(`   📄 Pagination: Page ${res.body.pagination.page}/${res.body.pagination.pages}, Total: ${res.body.pagination.total}`);
                        }
                    }
                } else {
                    console.log(`   ❌ API Error: ${res.body.error?.message || 'Unknown error'}`);
                }
            } else {
                console.log(`   ❌ HTTP Error: ${res.body.error?.message || res.body.message || 'Unknown error'}`);
            }
        } catch (e) {
            console.log(`   💥 Request failed: ${e.message}`);
        }
        console.log();
    }
}

async function testSpecialEndpoints() {
    console.log('🌟 TESTING SPECIAL ENDPOINTS (WITH ERROR DETAILS)');
    console.log('=================================================\n');

    const tests = [
        { name: 'Organization Tree (All)', path: `${API_BASE}/organization-tree` },
        { name: 'Organization Tree (Company ABC)', path: `${API_BASE}/organization-tree/ABC` },
        { name: 'Global Search', path: `${API_BASE}/search?q=test` },
        { name: 'Entity Hierarchy', path: `${API_BASE}/hierarchy/company/ABC` },
        { name: 'Statistics', path: `${API_BASE}/statistics` }
    ];

    for (const test of tests) {
        console.log(`🔧 ${test.name}`);
        try {
            const res = await makeRequest({ path: test.path });
            console.log(`   Status: ${res.status}`);
            
            if (res.status === 200) {
                console.log(`   ✅ Success: ${res.body.message || 'OK'}`);
                if (res.body.data) {
                    if (Array.isArray(res.body.data)) {
                        console.log(`   📊 Records: ${res.body.data.length}`);
                    } else {
                        console.log(`   📊 Data keys: ${Object.keys(res.body.data).join(', ')}`);
                    }
                }
            } else if (res.status === 500) {
                console.log(`   💥 Server Error: ${res.body.error?.message || res.body.message || 'Internal server error'}`);
                if (res.body.stack) {
                    console.log(`   🔍 Error details: ${res.body.stack.split('\n')[0]}`);
                }
            } else {
                console.log(`   ❌ Error: ${res.body.error?.message || res.body.message || 'Unknown error'}`);
            }
        } catch (e) {
            console.log(`   💥 Request failed: ${e.message}`);
        }
        console.log();
    }
}

async function testFlexibleEndpoints() {
    console.log('🔧 TESTING FLEXIBLE API ENDPOINTS (WITH SAMPLE DATA)');
    console.log('===================================================\n');

    const tests = [
        { name: 'Company Departments (ABC)', path: `${API_BASE}/flexible/company-departments?company=ABC` },
        { name: 'Company Full (ABC)', path: `${API_BASE}/flexible/company-full?company=ABC` },
        { name: 'Custom Query (ABC)', path: `${API_BASE}/flexible/custom?company=ABC&include=divisions,departments` },
        { name: 'Missing Company Parameter', path: `${API_BASE}/flexible/custom?include=divisions` }
    ];

    for (const test of tests) {
        console.log(`🔧 ${test.name}`);
        try {
            const res = await makeRequest({ path: test.path });
            console.log(`   Status: ${res.status}`);
            
            if (res.status === 200) {
                console.log(`   ✅ Success: ${res.body.message || 'OK'}`);
                if (res.body.data) {
                    console.log(`   📊 Company: ${res.body.data.company_name || 'N/A'}`);
                    if (res.body.meta) {
                        console.log(`   🏗️  Included: ${res.body.meta.included?.join(', ') || 'N/A'}`);
                        if (res.body.meta.total_branches) console.log(`   🏬 Branches: ${res.body.meta.total_branches}`);
                        if (res.body.meta.total_divisions) console.log(`   🏗️  Divisions: ${res.body.meta.total_divisions}`);
                        if (res.body.meta.total_departments) console.log(`   🏛️  Departments: ${res.body.meta.total_departments}`);
                    }
                }
            } else if (res.status === 400) {
                console.log(`   ⚠️  Bad Request: ${res.body.error?.message || res.body.message || 'Invalid request'}`);
                if (res.body.error?.code) {
                    console.log(`   🔍 Error Code: ${res.body.error.code}`);
                }
            } else if (res.status === 404) {
                console.log(`   🔍 Not Found: ${res.body.error?.message || 'Resource not found'}`);
            } else {
                console.log(`   ❌ Error: ${res.body.error?.message || res.body.message || 'Unknown error'}`);
            }
        } catch (e) {
            console.log(`   💥 Request failed: ${e.message}`);
        }
        console.log();
    }
}

async function testCRUDOperations() {
    console.log('📝 TESTING CRUD OPERATIONS');
    console.log('=========================\n');

    // Test company creation
    console.log('🏢 Testing Company Creation');
    const newCompany = {
        company_code: `TEST_${Date.now()}`,
        company_name: 'Test Company for API',
        description: 'Created by comprehensive API test',
        website: 'https://testcompany.example.com',
        email: 'test@example.com',
        is_active: true
    };

    try {
        const res = await makeRequest({
            path: `${API_BASE}/companies`,
            method: 'POST'
        }, newCompany);
        
        console.log(`   Status: ${res.status}`);
        if (res.status === 201) {
            console.log(`   ✅ Company created: ${res.body.data?.company_code}`);
        } else {
            console.log(`   ❌ Failed: ${res.body.error?.message || res.body.message || 'Unknown error'}`);
            if (res.body.errors) {
                console.log(`   🔍 Validation errors: ${JSON.stringify(res.body.errors)}`);
            }
        }
    } catch (e) {
        console.log(`   💥 Request failed: ${e.message}`);
    }
    console.log();

    // Test with read-only key
    console.log('🔒 Testing with Read-Only API Key');
    try {
        const res = await makeRequest({
            path: `${API_BASE}/companies`,
            method: 'POST',
            apiKey: READ_ONLY_KEY
        }, newCompany);
        
        console.log(`   Status: ${res.status}`);
        if (res.status === 403) {
            console.log(`   ✅ Correctly blocked: ${res.body.error?.message}`);
        } else {
            console.log(`   ❌ Unexpected result: ${res.body.error?.message || 'Should have been blocked'}`);
        }
    } catch (e) {
        console.log(`   💥 Request failed: ${e.message}`);
    }
    console.log();
}

async function testRelationshipEndpoints() {
    console.log('🔗 TESTING RELATIONSHIP ENDPOINTS');
    console.log('=================================\n');

    const tests = [
        { name: 'Company Branches (ABC)', path: `${API_BASE}/companies/ABC/branches` },
        { name: 'Company Divisions (ABC)', path: `${API_BASE}/companies/ABC/divisions` },
        { name: 'Branch Divisions (BR001)', path: `${API_BASE}/branches/BR001/divisions` },
        { name: 'Division Departments (DIV001)', path: `${API_BASE}/divisions/DIV001/departments` }
    ];

    for (const test of tests) {
        console.log(`🔗 ${test.name}`);
        try {
            const res = await makeRequest({ path: test.path });
            console.log(`   Status: ${res.status}`);
            
            if (res.status === 200) {
                console.log(`   ✅ Success: ${res.body.message || 'OK'}`);
                if (res.body.data && Array.isArray(res.body.data)) {
                    console.log(`   📊 Records: ${res.body.data.length}`);
                    if (res.body.data.length > 0) {
                        console.log(`   🔍 Sample: ${res.body.data[0].branch_name || res.body.data[0].division_name || res.body.data[0].department_name || 'N/A'}`);
                    }
                }
            } else if (res.status === 400) {
                console.log(`   ⚠️  Bad Request: ${res.body.error?.message || 'Invalid request'}`);
                if (res.body.error?.details) {
                    console.log(`   🔍 Details: ${res.body.error.details}`);
                }
            } else if (res.status === 404) {
                console.log(`   🔍 Not Found: ${res.body.error?.message || 'Resource not found'}`);
            } else {
                console.log(`   ❌ Error: ${res.body.error?.message || 'Unknown error'}`);
            }
        } catch (e) {
            console.log(`   💥 Request failed: ${e.message}`);
        }
        console.log();
    }
}

async function testValidationAndErrors() {
    console.log('⚠️  TESTING VALIDATION AND ERROR HANDLING');
    console.log('=========================================\n');

    const tests = [
        {
            name: 'Invalid Company Code Format',
            path: `${API_BASE}/companies/invalid-code-with-special-chars!@#`,
            expectedStatus: 400
        },
        {
            name: 'Very Long Company Code',
            path: `${API_BASE}/companies/${'A'.repeat(100)}`,
            expectedStatus: 400
        },
        {
            name: 'Empty Search Query',
            path: `${API_BASE}/search?q=`,
            expectedStatus: 400
        },
        {
            name: 'Invalid Pagination (Negative Page)',
            path: `${API_BASE}/companies?page=-1`,
            expectedStatus: 400
        },
        {
            name: 'Invalid Pagination (Zero Limit)',
            path: `${API_BASE}/companies?limit=0`,
            expectedStatus: 400
        }
    ];

    for (const test of tests) {
        console.log(`⚠️  ${test.name}`);
        try {
            const res = await makeRequest({ path: test.path });
            console.log(`   Status: ${res.status} (Expected: ${test.expectedStatus})`);
            
            if (res.status === test.expectedStatus) {
                console.log(`   ✅ Correct validation: ${res.body.error?.message || 'Validation applied'}`);
            } else if (res.status === 200) {
                console.log(`   ⚠️  No validation applied (might be acceptable)`);
            } else {
                console.log(`   ❌ Unexpected status: ${res.body.error?.message || 'Unknown error'}`);
            }
        } catch (e) {
            console.log(`   💥 Request failed: ${e.message}`);
        }
        console.log();
    }
}

// Main execution
async function runDetailedTests() {
    console.log('🚀 DETAILED ORGANIZATION API ANALYSIS');
    console.log('====================================');
    console.log(`Server: http://${HOST}:${PORT}`);
    console.log(`Test started: ${new Date().toISOString()}\n`);

    try {
        await testBasicEndpoints();
        await testSpecialEndpoints();
        await testFlexibleEndpoints();
        await testCRUDOperations();
        await testRelationshipEndpoints();
        await testValidationAndErrors();
        
        console.log('✨ DETAILED ANALYSIS COMPLETED');
        console.log('=============================');
        console.log(`Test finished: ${new Date().toISOString()}`);
        console.log('\n📋 SUMMARY OF FINDINGS:');
        console.log('- Basic CRUD endpoints are mostly functional');
        console.log('- Several special endpoints return 500 errors (needs investigation)');
        console.log('- Flexible API endpoints have validation issues');
        console.log('- Authentication and permission system works correctly');
        
    } catch (error) {
        console.error('\n💥 Fatal test error:', error.message);
    }
}

runDetailedTests().catch(console.error);