const axios = require('axios');

class ApiEditTester {
    constructor() {
        this.baseURL = 'http://localhost:3004/api';
        this.apiKey = 'test-api-key-12345'; // Using one of the test API keys
    }

    async makeRequest(method, url, data = null) {
        try {
            const config = {
                method,
                url: `${this.baseURL}${url}`,
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                validateStatus: () => true
            };

            if (data && (method === 'PUT' || method === 'POST')) {
                config.data = data;
            }

            const response = await axios(config);
            return response;
        } catch (error) {
            console.error(`Request failed: ${method} ${url}`, error.message);
            return { status: 500, data: { message: error.message } };
        }
    }

    async testCompanyApiEdit() {
        console.log('\n📝 Testing Company API Edit...');
        
        // First get the current company
        const getResponse = await this.makeRequest('GET', '/companies/RUXCHAI');
        console.log(`Get company status: ${getResponse.status}`);
        
        if (getResponse.status !== 200) {
            console.log('❌ Cannot get company data');
            return false;
        }

        // Test the fix by updating all available fields
        const updateData = {
            company_name_th: 'บริษัท ทดสอบ API แก้ไข จำกัด',
            company_name_en: 'API Edit Test Company Limited',
            tax_id: '1234567890987',
            website: 'https://www.apiedited.com',
            email: 'api@edited.com',
            phone: '02-111-2222',
            address: '789 API Updated Street, Bangkok',
            is_active: true
        };
        
        const updateResponse = await this.makeRequest('PUT', '/companies/RUXCHAI', updateData);
        console.log(`Update status: ${updateResponse.status}`);
        
        if (updateResponse.status !== 200) {
            console.log(`❌ Update failed: ${JSON.stringify(updateResponse.data)}`);
            return false;
        }
        
        console.log('✅ Company API update successful');
        return true;
    }

    async testBranchApiEdit() {
        console.log('\n🏪 Testing Branch API Edit...');
        
        const updateData = {
            branch_name: 'สำนักงานใหญ่ (แก้ไขผ่าน API)',
            is_headquarters: true,
            is_active: true
        };
        
        const updateResponse = await this.makeRequest('PUT', '/branches/RUXCHAI-HQ', updateData);
        console.log(`Update status: ${updateResponse.status}`);
        
        if (updateResponse.status !== 200) {
            console.log(`❌ Update failed: ${JSON.stringify(updateResponse.data)}`);
            return false;
        }
        
        console.log('✅ Branch API update successful');
        return true;
    }

    async testDivisionApiEdit() {
        console.log('\n🏗️ Testing Division API Edit...');
        
        const updateData = {
            division_name: 'ฝ่ายขาย (แก้ไขผ่าน API)',
            branch_code: 'RUXCHAI-HQ',
            is_active: true
        };
        
        const updateResponse = await this.makeRequest('PUT', '/divisions/RUXCHAI-DIV01', updateData);
        console.log(`Update status: ${updateResponse.status}`);
        
        if (updateResponse.status !== 200) {
            console.log(`❌ Update failed: ${JSON.stringify(updateResponse.data)}`);
            return false;
        }
        
        console.log('✅ Division API update successful');
        return true;
    }

    async testDepartmentApiEdit() {
        console.log('\n👥 Testing Department API Edit...');
        
        const updateData = {
            department_name: 'แผนกขายในประเทศ (แก้ไขผ่าน API)',
            division_code: 'RUXCHAI-DIV01',
            is_active: true
        };
        
        const updateResponse = await this.makeRequest('PUT', '/departments/RUXCHAI-DEPT01', updateData);
        console.log(`Update status: ${updateResponse.status}`);
        
        if (updateResponse.status !== 200) {
            console.log(`❌ Update failed: ${JSON.stringify(updateResponse.data)}`);
            return false;
        }
        
        console.log('✅ Department API update successful');
        return true;
    }

    async runTests() {
        console.log('🧪 TESTING API CONTROLLER EDIT FIXES');
        console.log('='.repeat(50));
        
        let totalTests = 0;
        let passedTests = 0;
        
        const tests = [
            { name: 'Company API Edit', test: () => this.testCompanyApiEdit() },
            { name: 'Branch API Edit', test: () => this.testBranchApiEdit() },
            { name: 'Division API Edit', test: () => this.testDivisionApiEdit() },
            { name: 'Department API Edit', test: () => this.testDepartmentApiEdit() }
        ];
        
        for (const { name, test } of tests) {
            totalTests++;
            try {
                const success = await test();
                if (success) passedTests++;
            } catch (error) {
                console.log(`❌ ${name} test failed: ${error.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 API TEST RESULTS');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        console.log(`Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All API edit functionality tests passed!');
        } else {
            console.log('⚠️ Some API tests failed - check the controller logic');
        }
    }
}

const tester = new ApiEditTester();
tester.runTests().catch(console.error);