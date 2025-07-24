// Debug Hierarchical Data Endpoints
const http = require('http');

class HierarchicalDebugTester {
    constructor() {
        this.apiKey = 'tVCSQZofGuGxj6JrMw8vjyTwKIvi8CqzcrLyUzPw';
    }

    async makeRequest(method, path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3003,
                path: path,
                method: method,
                headers: {
                    'x-api-key': this.apiKey
                }
            };

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
                            data: parsedData
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: responseData
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });
            
            req.end();
        });
    }

    async testHierarchicalEndpoints() {
        console.log('🔍 DEBUG HIERARCHICAL DATA ENDPOINTS\n');
        
        // Test 1: Full organization tree
        console.log('1. Testing full organization tree...');
        const treeRes = await this.makeRequest('GET', '/api/v1/organization-tree');
        console.log(`Status: ${treeRes.status}`);
        if (treeRes.status === 200) {
            console.log(`✅ Found ${treeRes.data.data ? treeRes.data.data.length : 0} companies in tree`);
        } else {
            console.log('❌ Error:', treeRes.data);
        }
        
        // Test 2: Company-specific tree
        console.log('\n2. Testing company-specific tree...');
        // Use RUXCHAI as test company
        const companyTreeRes = await this.makeRequest('GET', '/api/v1/organization-tree/RUXCHAI');
        console.log(`Status: ${companyTreeRes.status}`);
        if (companyTreeRes.status === 200) {
            console.log('✅ Company tree retrieved');
        } else {
            console.log('❌ Error:', companyTreeRes.data);
        }
        
        // Test 3: Flexible API - company with departments
        console.log('\n3. Testing flexible API - company with departments...');
        const flexDeptRes = await this.makeRequest('GET', '/api/v1/flexible/company-departments?company=RUXCHAI');
        console.log(`Status: ${flexDeptRes.status}`);
        if (flexDeptRes.status === 200) {
            console.log('✅ Company departments retrieved');
            console.log('Data structure:', Object.keys(flexDeptRes.data.data || {}));
        } else {
            console.log('❌ Error:', flexDeptRes.data);
        }
        
        // Test 4: Flexible API - company full hierarchy
        console.log('\n4. Testing flexible API - company full hierarchy...');
        const flexFullRes = await this.makeRequest('GET', '/api/v1/flexible/company-full?company=RUXCHAI');
        console.log(`Status: ${flexFullRes.status}`);
        if (flexFullRes.status === 200) {
            console.log('✅ Company full hierarchy retrieved');
            console.log('Data structure:', Object.keys(flexFullRes.data.data || {}));
        } else {
            console.log('❌ Error:', flexFullRes.data);
        }
        
        // Test 5: Custom flexible API
        console.log('\n5. Testing flexible API - custom query...');
        const customRes = await this.makeRequest('GET', '/api/v1/flexible/custom?company=RUXCHAI&include=branches,divisions');
        console.log(`Status: ${customRes.status}`);
        if (customRes.status === 200) {
            console.log('✅ Custom query successful');
            console.log('Data structure:', Object.keys(customRes.data.data || {}));
        } else {
            console.log('❌ Error:', customRes.data);
        }
    }

    async run() {
        console.log('=' .repeat(60));
        console.log('HIERARCHICAL DATA ENDPOINTS DEBUG TEST');
        console.log('=' .repeat(60) + '\n');
        
        await this.testHierarchicalEndpoints();
        
        console.log('\n' + '=' .repeat(60));
    }
}

const tester = new HierarchicalDebugTester();
tester.run();