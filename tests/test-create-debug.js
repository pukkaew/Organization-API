// Debug Create Operations
const http = require('http');

class CreateDebugTester {
    constructor() {
        this.baseUrl = 'http://localhost:3003';
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
                    'x-api-key': this.apiKey
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

    async debugCreateCompany() {
        console.log('🔍 DEBUG CREATE COMPANY\n');
        
        const companyData = {
            company_code: `DEBUG-${Date.now()}`,
            company_name_th: 'บริษัททดสอบ Debug จำกัด',
            company_name_en: 'Debug Test Company Ltd.',
            tax_id: '1234567890123'
        };
        
        console.log('Request Data:', JSON.stringify(companyData, null, 2));
        console.log('\nSending POST to /api/v1/companies...\n');
        
        try {
            const response = await this.makeRequest('POST', '/api/v1/companies', companyData);
            
            console.log('Response Status:', response.status);
            console.log('Response Headers:', response.headers);
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 201) {
                console.log('\n✅ Company created successfully!');
                return response.data.data.company_code;
            } else {
                console.log('\n❌ Failed to create company');
                return null;
            }
        } catch (error) {
            console.log('❌ Request Error:', error.message);
            return null;
        }
    }

    async debugCreateBranch(companyCode) {
        console.log('\n\n🔍 DEBUG CREATE BRANCH\n');
        
        if (!companyCode) {
            console.log('❌ No company code provided, skipping branch creation');
            return null;
        }
        
        const branchData = {
            branch_code: `BR-DEBUG-${Date.now()}`,
            branch_name: 'สาขา Debug ทดสอบ',
            company_code: companyCode,
            is_headquarters: false
        };
        
        console.log('Request Data:', JSON.stringify(branchData, null, 2));
        console.log('\nSending POST to /api/v1/branches...\n');
        
        try {
            const response = await this.makeRequest('POST', '/api/v1/branches', branchData);
            
            console.log('Response Status:', response.status);
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 201) {
                console.log('\n✅ Branch created successfully!');
                return response.data.data.branch_code;
            } else {
                console.log('\n❌ Failed to create branch');
                return null;
            }
        } catch (error) {
            console.log('❌ Request Error:', error.message);
            return null;
        }
    }

    async testDeleteOperations(companyCode) {
        console.log('\n\n🔍 TEST DELETE OPERATIONS\n');
        
        if (!companyCode) {
            console.log('❌ No company code to test delete');
            return;
        }
        
        console.log(`Testing DELETE /api/v1/companies/${companyCode}...`);
        
        try {
            const response = await this.makeRequest('DELETE', `/api/v1/companies/${companyCode}`);
            
            console.log('Response Status:', response.status);
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 200) {
                console.log('\n✅ DELETE operation is working!');
            } else {
                console.log('\n❌ DELETE operation failed');
            }
        } catch (error) {
            console.log('❌ Request Error:', error.message);
        }
    }

    async run() {
        console.log('=' .repeat(60));
        console.log('CREATE & DELETE OPERATIONS DEBUG TEST');
        console.log('=' .repeat(60));
        
        // Test company creation
        const companyCode = await this.debugCreateCompany();
        
        // Test branch creation
        const branchCode = await this.debugCreateBranch(companyCode);
        
        // Test delete operations
        await this.testDeleteOperations(companyCode);
        
        console.log('\n' + '=' .repeat(60));
    }
}

const tester = new CreateDebugTester();
tester.run();