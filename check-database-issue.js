const axios = require('axios');

async function checkDatabaseIssue() {
    try {
        // Login first
        const loginResponse = await axios.post('http://localhost:3025/login', 
            new URLSearchParams({
                username: 'admin',
                password: 'admin123'
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                maxRedirects: 0,
                validateStatus: () => true
            });
        
        const cookies = loginResponse.headers['set-cookie'];
        const sessionCookie = cookies.find(cookie => cookie.startsWith('connect.sid='));
        
        console.log('=== Checking Database Issue ===');
        
        // Create a new test company to see if is_active works on new records
        console.log('\n1. Creating new test company...');
        const newCode = 'DBTEST_' + Date.now().toString().slice(-4);
        
        console.log('Creating company with code:', newCode);
        
        const createData = new URLSearchParams({
            company_code: newCode,
            company_name_th: 'บริษัททดสอบฐานข้อมูล จำกัด',
            company_name_en: 'Database Test Company',
            tax_id: '',
            is_active: 'true'
        });
        
        const createResponse = await axios.post('http://localhost:3025/companies', createData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': sessionCookie
            },
            maxRedirects: 0,
            validateStatus: () => true
        });
        
        console.log('Create response:', createResponse.status);
        
        if (createResponse.status === 302) {
            console.log('✅ New company created');
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check the new company's initial status
            const checkResponse = await axios.get('http://localhost:3025/debug/test-companies', {
                headers: { 'Cookie': sessionCookie }
            });
            
            const companies = checkResponse.data.data || [];
            const newCompany = companies.find(c => c.company_code === newCode);
            
            if (newCompany) {
                console.log('New company initial status:', newCompany.is_active);
                
                // Try to toggle this new company
                console.log('\n2. Testing toggle on new company...');
                const toggleResponse = await axios.post(`http://localhost:3025/companies/${newCode}/toggle-status`, '', {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cookie': sessionCookie
                    },
                    maxRedirects: 0,
                    validateStatus: () => true
                });
                
                console.log('Toggle response:', toggleResponse.status);
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check result
                const toggleCheckResponse = await axios.get('http://localhost:3025/debug/test-companies', {
                    headers: { 'Cookie': sessionCookie }
                });
                
                const toggleCheckCompanies = toggleCheckResponse.data.data || [];
                const toggledCompany = toggleCheckCompanies.find(c => c.company_code === newCode);
                
                console.log('After toggle:', toggledCompany.is_active);
                console.log('Toggle worked on new company:', newCompany.is_active !== toggledCompany.is_active ? '✅' : '❌');
                
                // Try editing the new company
                console.log('\n3. Testing edit on new company...');
                const editNewData = new URLSearchParams({
                    _method: 'PUT',
                    company_name_th: 'บริษัททดสอบฐานข้อมูลแก้ไข จำกัด',
                    company_name_en: 'Database Test Edit Company',
                    tax_id: '2222222222222',
                    is_active: toggledCompany.is_active ? 'false' : 'true'
                });
                
                const editNewResponse = await axios.post(`http://localhost:3025/companies/${newCode}`, editNewData, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cookie': sessionCookie
                    },
                    maxRedirects: 0,
                    validateStatus: () => true
                });
                
                console.log('Edit new company response:', editNewResponse.status);
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check edit result
                const editCheckResponse = await axios.get('http://localhost:3025/debug/test-companies', {
                    headers: { 'Cookie': sessionCookie }
                });
                
                const editCheckCompanies = editCheckResponse.data.data || [];
                const editedCompany = editCheckCompanies.find(c => c.company_code === newCode);
                
                console.log('After edit:', editedCompany.is_active);
                console.log('Edit worked on new company:', toggledCompany.is_active !== editedCompany.is_active ? '✅' : '❌');
                
                // Summary for new company
                console.log('\n=== New Company Test Results ===');
                console.log('Initial status:', newCompany.is_active);
                console.log('After toggle:', toggledCompany.is_active);  
                console.log('After edit:', editedCompany.is_active);
                
                if (newCompany.is_active !== toggledCompany.is_active || toggledCompany.is_active !== editedCompany.is_active) {
                    console.log('🎉 Status changes work on NEW companies!');
                    console.log('🔍 Problem might be specific to existing companies');
                } else {
                    console.log('❌ Status changes don\'t work even on new companies');
                    console.log('🔍 Problem is at database level');
                }
                
            } else {
                console.log('❌ New company not found after creation');
            }
        } else {
            console.log('❌ Failed to create new company');
        }
        
    } catch (error) {
        console.error('Database check error:', error.message);
    }
}

checkDatabaseIssue();