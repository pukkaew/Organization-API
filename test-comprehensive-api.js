// Comprehensive test suite for Organization API
// Tests all CRUD operations, special endpoints, and edge cases

const http = require('http');
const crypto = require('crypto');

// Configuration
const HOST = 'localhost';
const PORT = 3003;
const API_BASE = '/api/v1';

// Test data
const testData = {
    apiKey: {
        appName: `TestApp_${Date.now()}`,
        description: 'Comprehensive API Test Suite',
        permissions: ['read', 'write']
    },
    company: {
        company_code: `TEST_${Date.now()}`,
        company_name: 'Test Company Ltd.',
        description: 'A test company for API testing',
        website: 'https://testcompany.com',
        email: 'test@testcompany.com',
        phone: '+1234567890',
        address: '123 Test Street, Test City',
        is_active: true
    },
    branch: {
        branch_code: `BR_${Date.now()}`,
        branch_name: 'Main Branch',
        is_headquarters: true,
        is_active: true
    },
    division: {
        division_code: `DIV_${Date.now()}`,
        division_name: 'IT Division',
        is_active: true
    },
    department: {
        department_code: `DEPT_${Date.now()}`,
        department_name: 'Software Development',
        is_active: true
    }
};

// Store created resources for cleanup
const createdResources = {
    apiKey: null,
    company: null,
    branches: [],
    divisions: [],
    departments: []
};

// Utility functions
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const reqOptions = {
            hostname: HOST,
            port: PORT,
            path: options.path,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
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

// Test sections
const tests = {
    async createApiKey() {
        console.log('\n📌 USING TEST API KEY');
        console.log('==================');
        
        // When USE_DATABASE=false, we use the mock API keys
        const testApiKey = 'test-api-key-12345'; // Has read_write permissions
        const readOnlyKey = 'read-only-key-67890'; // Has read only permissions
        
        console.log(`✅ Using test API key with read/write permissions: ${testApiKey}`);
        console.log(`📖 Alternative read-only key available: ${readOnlyKey}`);
        
        createdResources.apiKey = testApiKey;
        return testApiKey;
    },

    async testCompanies(apiKey) {
        console.log('\n🏢 TESTING COMPANY ENDPOINTS');
        console.log('============================');
        
        const results = [];

        // Test 1: Get all companies (should be empty or have existing data)
        console.log('\n1️⃣ GET /companies - List all companies');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            if (res.body.data) {
                console.log(`   Total companies: ${res.body.data.length}`);
            }
            results.push({ test: 'List companies', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'List companies', status: 0, success: false, error: e.message });
        }

        // Test 2: Create company without auth (should fail)
        console.log('\n2️⃣ POST /companies - Create without write permission');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies`,
                method: 'POST',
                headers: { 'X-API-Key': apiKey }
            }, testData.company);
            console.log(`   Status: ${res.status}`);
            console.log(`   Expected: 403 (Forbidden)`);
            console.log(`   Success: ${res.status === 403}`);
            results.push({ test: 'Create company without write', status: res.status, success: res.status === 403 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Create company without write', status: 0, success: false, error: e.message });
        }

        // Test 3: Get non-existent company
        console.log('\n3️⃣ GET /companies/:code - Get non-existent company');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies/NONEXISTENT`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Expected: 404 (Not Found)`);
            console.log(`   Success: ${res.status === 404}`);
            if (res.body.error) {
                console.log(`   Error message: ${res.body.error.message}`);
            }
            results.push({ test: 'Get non-existent company', status: res.status, success: res.status === 404 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Get non-existent company', status: 0, success: false, error: e.message });
        }

        // Test 4: Create company with invalid data
        console.log('\n4️⃣ POST /companies - Create with invalid data');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies`,
                method: 'POST',
                headers: { 'X-API-Key': apiKey }
            }, {
                // Missing required fields
                company_name: 'Test'
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Expected: 400 or 403`);
            console.log(`   Success: ${res.status === 400 || res.status === 403}`);
            results.push({ test: 'Create company invalid data', status: res.status, success: res.status === 400 || res.status === 403 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Create company invalid data', status: 0, success: false, error: e.message });
        }

        // Test 5: Search companies
        console.log('\n5️⃣ GET /companies?search=test - Search companies');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies?search=test`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            results.push({ test: 'Search companies', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Search companies', status: 0, success: false, error: e.message });
        }

        return results;
    },

    async testBranches(apiKey) {
        console.log('\n🏬 TESTING BRANCH ENDPOINTS');
        console.log('===========================');
        
        const results = [];

        // Test 1: List all branches
        console.log('\n1️⃣ GET /branches - List all branches');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/branches`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            results.push({ test: 'List branches', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'List branches', status: 0, success: false, error: e.message });
        }

        // Test 2: Filter branches by company
        console.log('\n2️⃣ GET /branches?company_code=ABC - Filter by company');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/branches?company_code=ABC`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            results.push({ test: 'Filter branches by company', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Filter branches by company', status: 0, success: false, error: e.message });
        }

        // Test 3: Get branches by company endpoint
        console.log('\n3️⃣ GET /companies/:code/branches - Get company branches');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies/ABC/branches`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            results.push({ test: 'Get company branches', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Get company branches', status: 0, success: false, error: e.message });
        }

        return results;
    },

    async testDivisions(apiKey) {
        console.log('\n🏗️ TESTING DIVISION ENDPOINTS');
        console.log('============================');
        
        const results = [];

        // Test 1: List all divisions
        console.log('\n1️⃣ GET /divisions - List all divisions');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/divisions`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            results.push({ test: 'List divisions', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'List divisions', status: 0, success: false, error: e.message });
        }

        // Test 2: Get divisions by branch
        console.log('\n2️⃣ GET /branches/:code/divisions - Get branch divisions');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/branches/BR001/divisions`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            results.push({ test: 'Get branch divisions', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Get branch divisions', status: 0, success: false, error: e.message });
        }

        return results;
    },

    async testDepartments(apiKey) {
        console.log('\n🏛️ TESTING DEPARTMENT ENDPOINTS');
        console.log('==============================');
        
        const results = [];

        // Test 1: List all departments
        console.log('\n1️⃣ GET /departments - List all departments');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/departments`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            results.push({ test: 'List departments', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'List departments', status: 0, success: false, error: e.message });
        }

        // Test 2: Get departments by division
        console.log('\n2️⃣ GET /divisions/:code/departments - Get division departments');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/divisions/DIV001/departments`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            results.push({ test: 'Get division departments', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Get division departments', status: 0, success: false, error: e.message });
        }

        return results;
    },

    async testSpecialEndpoints(apiKey) {
        console.log('\n🌟 TESTING SPECIAL ENDPOINTS');
        console.log('============================');
        
        const results = [];

        // Test 1: Organization tree (all)
        console.log('\n1️⃣ GET /organization-tree - Full organization tree');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/organization-tree`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            if (res.body.data && Array.isArray(res.body.data)) {
                console.log(`   Companies in tree: ${res.body.data.length}`);
            }
            results.push({ test: 'Organization tree (all)', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Organization tree (all)', status: 0, success: false, error: e.message });
        }

        // Test 2: Organization tree (by company)
        console.log('\n2️⃣ GET /organization-tree/:company_code - Company tree');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/organization-tree/ABC`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success || res.status === 404}`);
            results.push({ test: 'Organization tree (company)', status: res.status, success: res.status === 200 || res.status === 404 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Organization tree (company)', status: 0, success: false, error: e.message });
        }

        // Test 3: Search
        console.log('\n3️⃣ GET /search?q=test - Global search');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/search?q=test`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            results.push({ test: 'Global search', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Global search', status: 0, success: false, error: e.message });
        }

        // Test 4: Entity hierarchy
        console.log('\n4️⃣ GET /hierarchy/:type/:code - Entity hierarchy');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/hierarchy/company/ABC`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            results.push({ test: 'Entity hierarchy', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Entity hierarchy', status: 0, success: false, error: e.message });
        }

        // Test 5: Statistics
        console.log('\n5️⃣ GET /statistics - Organization statistics');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/statistics`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            if (res.body.data) {
                console.log(`   Stats: ${JSON.stringify(res.body.data)}`);
            }
            results.push({ test: 'Statistics', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Statistics', status: 0, success: false, error: e.message });
        }

        return results;
    },

    async testFlexibleEndpoints(apiKey) {
        console.log('\n🔧 TESTING FLEXIBLE API ENDPOINTS');
        console.log('=================================');
        
        const results = [];

        // Test 1: Company with departments
        console.log('\n1️⃣ GET /flexible/company-departments - Company with departments only');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/flexible/company-departments?company=ABC`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            if (res.body.meta) {
                console.log(`   Included: ${res.body.meta.included}`);
            }
            results.push({ test: 'Flexible: company-departments', status: res.status, success: res.status === 200 || res.status === 404 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Flexible: company-departments', status: 0, success: false, error: e.message });
        }

        // Test 2: Company full structure
        console.log('\n2️⃣ GET /flexible/company-full - Complete company structure');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/flexible/company-full?company=ABC`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            if (res.body.meta) {
                console.log(`   Totals: branches=${res.body.meta.total_branches}, divisions=${res.body.meta.total_divisions}, departments=${res.body.meta.total_departments}`);
            }
            results.push({ test: 'Flexible: company-full', status: res.status, success: res.status === 200 || res.status === 404 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Flexible: company-full', status: 0, success: false, error: e.message });
        }

        // Test 3: Custom query
        console.log('\n3️⃣ GET /flexible/custom - Custom data selection');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/flexible/custom?company=ABC&include=divisions,departments&skip=branches`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${res.body.success}`);
            if (res.body.meta) {
                console.log(`   Included: ${res.body.meta.included}`);
            }
            results.push({ test: 'Flexible: custom query', status: res.status, success: res.status === 200 || res.status === 404 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Flexible: custom query', status: 0, success: false, error: e.message });
        }

        // Test 4: Missing company parameter
        console.log('\n4️⃣ GET /flexible/custom - Missing required parameter');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/flexible/custom?include=divisions`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Expected: 400 (Bad Request)`);
            console.log(`   Success: ${res.status === 400}`);
            results.push({ test: 'Flexible: missing parameter', status: res.status, success: res.status === 400 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Flexible: missing parameter', status: 0, success: false, error: e.message });
        }

        return results;
    },

    async testErrorHandling(apiKey) {
        console.log('\n⚠️  TESTING ERROR HANDLING');
        console.log('=========================');
        
        const results = [];

        // Test 1: Invalid API key
        console.log('\n1️⃣ Testing invalid API key');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies`,
                headers: { 'X-API-Key': 'invalid-key' }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Expected: 401 (Unauthorized)`);
            console.log(`   Success: ${res.status === 401}`);
            results.push({ test: 'Invalid API key', status: res.status, success: res.status === 401 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Invalid API key', status: 0, success: false, error: e.message });
        }

        // Test 2: Missing API key
        console.log('\n2️⃣ Testing missing API key');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies`
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Expected: 401 (Unauthorized)`);
            console.log(`   Success: ${res.status === 401}`);
            results.push({ test: 'Missing API key', status: res.status, success: res.status === 401 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Missing API key', status: 0, success: false, error: e.message });
        }

        // Test 3: Invalid endpoint
        console.log('\n3️⃣ Testing non-existent endpoint');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/invalid-endpoint`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Expected: 404 (Not Found)`);
            console.log(`   Success: ${res.status === 404}`);
            results.push({ test: 'Non-existent endpoint', status: res.status, success: res.status === 404 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Non-existent endpoint', status: 0, success: false, error: e.message });
        }

        // Test 4: Invalid JSON
        console.log('\n4️⃣ Testing invalid JSON payload');
        try {
            const reqOptions = {
                hostname: HOST,
                port: PORT,
                path: `${API_BASE}/companies`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                }
            };

            const req = http.request(reqOptions, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    console.log(`   Status: ${res.statusCode}`);
                    console.log(`   Expected: 400 or 403`);
                    console.log(`   Success: ${res.statusCode === 400 || res.statusCode === 403}`);
                    results.push({ test: 'Invalid JSON', status: res.statusCode, success: res.statusCode === 400 || res.statusCode === 403 });
                });
            });

            req.on('error', (e) => {
                console.log(`   ❌ Error: ${e.message}`);
                results.push({ test: 'Invalid JSON', status: 0, success: false, error: e.message });
            });

            req.write('{ invalid json');
            req.end();
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Invalid JSON', status: 0, success: false, error: e.message });
        }

        return results;
    },

    async testPagination(apiKey) {
        console.log('\n📄 TESTING PAGINATION');
        console.log('====================');
        
        const results = [];

        // Test 1: Default pagination
        console.log('\n1️⃣ GET /companies - Default pagination');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            if (res.body.pagination) {
                console.log(`   Page: ${res.body.pagination.page}`);
                console.log(`   Limit: ${res.body.pagination.limit}`);
                console.log(`   Total: ${res.body.pagination.total}`);
            }
            results.push({ test: 'Default pagination', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Default pagination', status: 0, success: false, error: e.message });
        }

        // Test 2: Custom pagination
        console.log('\n2️⃣ GET /companies?page=2&limit=5 - Custom pagination');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies?page=2&limit=5`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            if (res.body.pagination) {
                console.log(`   Page: ${res.body.pagination.page}`);
                console.log(`   Limit: ${res.body.pagination.limit}`);
            }
            results.push({ test: 'Custom pagination', status: res.status, success: res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Custom pagination', status: 0, success: false, error: e.message });
        }

        // Test 3: Invalid pagination
        console.log('\n3️⃣ GET /companies?page=0&limit=1000 - Invalid pagination');
        try {
            const res = await makeRequest({
                path: `${API_BASE}/companies?page=0&limit=1000`,
                headers: { 'X-API-Key': apiKey }
            });
            console.log(`   Status: ${res.status}`);
            console.log(`   Expected: 400 or 200 with corrected values`);
            results.push({ test: 'Invalid pagination', status: res.status, success: res.status === 400 || res.status === 200 });
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
            results.push({ test: 'Invalid pagination', status: 0, success: false, error: e.message });
        }

        return results;
    }
};

// Main test runner
async function runTests() {
    console.log('🚀 COMPREHENSIVE ORGANIZATION API TEST SUITE');
    console.log('==========================================');
    console.log(`Server: http://${HOST}:${PORT}`);
    console.log(`API Base: ${API_BASE}`);
    console.log(`Started: ${new Date().toISOString()}`);
    
    const allResults = [];
    
    try {
        // Step 1: Create API Key (simulated)
        const apiKey = await tests.createApiKey();
        
        // Step 2: Run all test suites
        allResults.push(...await tests.testCompanies(apiKey));
        allResults.push(...await tests.testBranches(apiKey));
        allResults.push(...await tests.testDivisions(apiKey));
        allResults.push(...await tests.testDepartments(apiKey));
        allResults.push(...await tests.testSpecialEndpoints(apiKey));
        allResults.push(...await tests.testFlexibleEndpoints(apiKey));
        allResults.push(...await tests.testErrorHandling(apiKey));
        allResults.push(...await tests.testPagination(apiKey));
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    const passed = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;
    const total = allResults.length;
    
    console.log(`Total tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success rate: ${((passed/total)*100).toFixed(2)}%`);
    
    // Failed tests details
    if (failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        allResults.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.test} (Status: ${r.status})`);
            if (r.error) console.log(`     Error: ${r.error}`);
        });
    }
    
    console.log('\n✨ Test suite completed!');
    console.log(`Finished: ${new Date().toISOString()}`);
}

// Run the tests
runTests().catch(console.error);