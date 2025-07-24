// Simple test for Flexible API endpoints
// Test script for new flexible API endpoints added according to Requirements

const http = require('http');

// Mock API Key for testing (when database is available)
const TEST_API_KEY = 'test-api-key-12345';

// Test endpoints
const endpoints = [
    {
        name: 'Company with Departments',
        path: '/api/v1/flexible/company-departments?company=ABC',
        method: 'GET'
    },
    {
        name: 'Company Full Structure',
        path: '/api/v1/flexible/company-full?company=ABC',
        method: 'GET'
    },
    {
        name: 'Custom Query - Include Divisions & Departments',
        path: '/api/v1/flexible/custom?company=ABC&include=divisions,departments',
        method: 'GET'
    },
    {
        name: 'Custom Query - Skip Branches',
        path: '/api/v1/flexible/custom?company=ABC&include=divisions,departments&skip=branches',
        method: 'GET'
    },
    {
        name: 'Organization Tree by Company',
        path: '/api/v1/organization-tree/ABC',
        method: 'GET'
    },
    {
        name: 'Organization Tree (All)',
        path: '/api/v1/organization-tree',
        method: 'GET'
    }
];

function makeRequest(endpoint) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: endpoint.path,
            method: endpoint.method,
            headers: {
                'X-API-Key': TEST_API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (e) => {
            resolve({
                statusCode: 0,
                error: e.message
            });
        });

        req.end();
    });
}

async function testEndpoints() {
    console.log('🚀 Testing Flexible API Endpoints');
    console.log('=====================================\n');

    for (const endpoint of endpoints) {
        console.log(`Testing: ${endpoint.name}`);
        console.log(`${endpoint.method} ${endpoint.path}`);
        
        const response = await makeRequest(endpoint);
        
        if (response.error) {
            console.log(`❌ Error: ${response.error}\n`);
            continue;
        }

        console.log(`Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            try {
                const parsed = JSON.parse(response.body);
                console.log('✅ Success!');
                
                // Show response structure
                if (parsed.success) {
                    console.log('📊 Response structure:');
                    if (parsed.data) {
                        console.log(`  - Data keys: ${Object.keys(parsed.data).join(', ')}`);
                    }
                    if (parsed.meta) {
                        console.log(`  - Meta: ${JSON.stringify(parsed.meta)}`);
                    }
                } else {
                    console.log('⚠️  API returned success=false');
                    if (parsed.error) {
                        console.log(`  - Error: ${parsed.error.message}`);
                    }
                }
            } catch (e) {
                console.log('⚠️  Invalid JSON response');
            }
        } else if (response.statusCode === 401) {
            console.log('🔐 Authentication required (expected when DB is disabled)');
        } else if (response.statusCode === 404) {
            console.log('❌ Endpoint not found');
        } else {
            console.log(`⚠️  Unexpected status: ${response.statusCode}`);
        }
        
        console.log('---\n');
    }

    console.log('✨ Testing completed!');
    console.log('\n📝 Notes:');
    console.log('- Authentication errors are expected when USE_DATABASE=false');
    console.log('- Endpoints are properly registered if status is 401 (not 404)');
    console.log('- Status 404 means endpoint is not implemented');
}

// Run tests
testEndpoints().catch(console.error);