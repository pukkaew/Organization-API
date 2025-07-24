// Debug UPDATE operations
const http = require('http');

class UpdateDebugTester {
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

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async testUpdate() {
        console.log('🔍 DEBUG UPDATE OPERATIONS\n');
        
        // First create a company to update
        const createData = {
            company_code: `UPD${Date.now().toString().slice(-8)}`,
            company_name_th: 'บริษัททดสอบอัพเดท',
            company_name_en: 'Update Test Company',
            tax_id: '1234567890123'
        };
        
        console.log('1. Creating company to update...');
        const createRes = await this.makeRequest('POST', '/api/v1/companies', createData);
        
        if (createRes.status !== 201) {
            console.log('❌ Failed to create company:', createRes.data);
            return;
        }
        
        const companyCode = createRes.data.data.company_code;
        console.log('✅ Company created:', companyCode);
        
        // Test PUT update
        console.log('\n2. Testing PUT update...');
        const updateData = {
            company_name_th: 'บริษัททดสอบ (อัพเดทแล้ว)',
            company_name_en: 'Test Company (Updated)'
        };
        
        const updateRes = await this.makeRequest('PUT', `/api/v1/companies/${companyCode}`, updateData);
        console.log('PUT Response:', updateRes.status);
        console.log('Response Data:', JSON.stringify(updateRes.data, null, 2));
        
        // Test PATCH status update
        console.log('\n3. Testing PATCH status update...');
        const statusData = {
            is_active: false
        };
        
        const statusRes = await this.makeRequest('PATCH', `/api/v1/companies/${companyCode}/status`, statusData);
        console.log('PATCH Response:', statusRes.status);
        console.log('Response Data:', JSON.stringify(statusRes.data, null, 2));
        
        // Verify the updates
        console.log('\n4. Verifying updates...');
        const getRes = await this.makeRequest('GET', `/api/v1/companies/${companyCode}`);
        console.log('GET Response:', getRes.status);
        if (getRes.status === 200) {
            console.log('Current company data:', JSON.stringify(getRes.data.data, null, 2));
        }
    }

    async run() {
        console.log('=' .repeat(60));
        console.log('UPDATE OPERATIONS DEBUG TEST');
        console.log('=' .repeat(60) + '\n');
        
        await this.testUpdate();
        
        console.log('\n' + '=' .repeat(60));
    }
}

const tester = new UpdateDebugTester();
tester.run();