// Debug DELETE operation
const http = require('http');

class DeleteDebugger {
    constructor() {
        this.apiKey = 'tVCSQZofGuGxj6JrMw8vjyTwKIvi8CqzcrLyUzPw';
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
                    'User-Agent': 'Debug-Delete/1.0'
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
                        const parsedData = JSON.parse(responseData);
                        resolve({
                            status: res.statusCode,
                            data: parsedData,
                            headers: res.headers,
                            raw: responseData
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: null,
                            headers: res.headers,
                            raw: responseData
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

    async debugDeleteFlow() {
        console.log('🔍 DEBUG DELETE FLOW\n');
        
        try {
            // Step 1: Create a company
            console.log('Step 1: Creating test company...');
            const companyData = {
                company_code: 'DEBUG-DELETE-001',
                company_name_th: 'บริษัททดสอบลบ',
                company_name_en: 'Debug Delete Company',
                tax_id: '1111111111111'
            };
            
            const createResult = await this.makeRequest('POST', '/api/v1/companies', companyData);
            console.log(`✅ CREATE Response: ${createResult.status}`);
            console.log('   Data:', JSON.stringify(createResult.data, null, 2));
            
            if (createResult.status !== 201) {
                console.log('❌ Failed to create company, stopping test');
                return;
            }
            
            // Step 2: Verify company exists
            console.log('\nStep 2: Verifying company exists...');
            const readResult = await this.makeRequest('GET', '/api/v1/companies/DEBUG-DELETE-001');
            console.log(`✅ READ Response: ${readResult.status}`);
            
            if (readResult.status !== 200) {
                console.log('❌ Company not found after creation, stopping test');
                return;
            }
            
            // Step 3: Try to delete with detailed debugging
            console.log('\nStep 3: Attempting DELETE...');
            console.log('DELETE URL: /api/v1/companies/DEBUG-DELETE-001');
            console.log('Headers:', {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey.substring(0, 10) + '...',
                'User-Agent': 'Debug-Delete/1.0'
            });
            
            const deleteResult = await this.makeRequest('DELETE', '/api/v1/companies/DEBUG-DELETE-001');
            console.log(`🔍 DELETE Response: ${deleteResult.status}`);
            console.log('   Headers:', deleteResult.headers);
            console.log('   Raw Response:', deleteResult.raw);
            console.log('   Parsed Data:', JSON.stringify(deleteResult.data, null, 2));
            
            if (deleteResult.status === 404) {
                console.log('\n❌ 404 ERROR - Route not found or entity not found');
                console.log('   This suggests either:');
                console.log('   1. The DELETE route is not properly registered');
                console.log('   2. The controller method is not found');
                console.log('   3. The entity was not found in database');
            } else if (deleteResult.status === 200) {
                console.log('\n✅ DELETE SUCCESSFUL');
            } else {
                console.log(`\n⚠️  Unexpected status: ${deleteResult.status}`);
            }
            
        } catch (error) {
            console.log('❌ Error during debug:', error.message);
        }
    }
}

const deleteDebugger = new DeleteDebugger();
deleteDebugger.debugDeleteFlow();