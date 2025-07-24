// Quick debug test for flexible API endpoints
const http = require('http');

const API_KEY = 'test-api-key-12345';
const HOST = 'localhost';
const PORT = 3003;

async function testFlexibleEndpoints() {
    console.log('🔍 DEBUGGING FLEXIBLE API ENDPOINTS');
    console.log('==================================\n');

    const endpoints = [
        { name: 'Company Departments', path: '/api/v1/flexible/company-departments?company=RUXCHAI' },
        { name: 'Company Full', path: '/api/v1/flexible/company-full?company=RUXCHAI' },
        { name: 'Custom Query', path: '/api/v1/flexible/custom?company=RUXCHAI&include=divisions' },
        { name: 'Organization Tree', path: '/api/v1/organization-tree' },
        { name: 'Organization Tree Company', path: '/api/v1/organization-tree/RUXCHAI' }
    ];

    for (const endpoint of endpoints) {
        console.log(`🧪 Testing: ${endpoint.name}`);
        console.log(`   URL: ${endpoint.path}`);
        
        await new Promise((resolve) => {
            const options = {
                hostname: HOST,
                port: PORT,
                path: endpoint.path,
                method: 'GET',
                headers: {
                    'X-API-Key': API_KEY,
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log(`   Status: ${res.statusCode}`);
                    
                    try {
                        const parsed = JSON.parse(data);
                        if (res.statusCode === 200) {
                            console.log(`   ✅ Success: ${parsed.message || 'OK'}`);
                            if (parsed.data) {
                                if (parsed.data.company) {
                                    console.log(`   📊 Company: ${parsed.data.company.company_code} - ${parsed.data.company.company_name_th}`);
                                }
                                if (parsed.meta) {
                                    console.log(`   🏗️  Meta: ${JSON.stringify(parsed.meta)}`);
                                }
                            }
                        } else {
                            console.log(`   ❌ Error: ${parsed.error?.message || 'Unknown error'}`);
                            if (parsed.error?.details) {
                                console.log(`   🔍 Details: ${JSON.stringify(parsed.error.details)}`);
                            }
                        }
                    } catch (e) {
                        console.log(`   ⚠️  Raw response: ${data.substring(0, 200)}`);
                    }
                    
                    console.log();
                    resolve();
                });
            });

            req.on('error', (e) => {
                console.log(`   💥 Request Error: ${e.message}`);
                console.log();
                resolve();
            });

            req.end();
        });
    }

    console.log('✨ Debug test completed!');
}

testFlexibleEndpoints().catch(console.error);