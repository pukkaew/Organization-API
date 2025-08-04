const axios = require('axios');

async function fixToggleFinal() {
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
        
        console.log('=== Final Toggle Fix Test ===');
        
        // Use Edit form to change status (workaround)
        // Add is_active field to the edit form via POST data
        
        // Get current status
        const beforeResponse = await axios.get('http://localhost:3025/debug/test-companies', {
            headers: { 'Cookie': sessionCookie }
        });
        
        const companies = beforeResponse.data.data || [];
        const company = companies.find(c => c.company_code === 'EDIT001');
        
        console.log('Current status:', company.is_active);
        
        // Use Edit form but add is_active field
        const editData = new URLSearchParams({
            _method: 'PUT',
            company_name_th: company.company_name_th,
            company_name_en: company.company_name_en || '',
            tax_id: company.tax_id || '',
            is_active: company.is_active ? 'false' : 'true' // Toggle through edit
        });
        
        const editResponse = await axios.post(`http://localhost:3025/companies/EDIT001`, editData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': sessionCookie
            },
            maxRedirects: 0,
            validateStatus: () => true
        });
        
        console.log('Edit response status:', editResponse.status);
        
        // Check result
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const afterResponse = await axios.get('http://localhost:3025/debug/test-companies', {
            headers: { 'Cookie': sessionCookie }
        });
        
        const afterCompanies = afterResponse.data.data || [];
        const afterCompany = afterCompanies.find(c => c.company_code === 'EDIT001');
        
        console.log('After edit with is_active:', afterCompany.is_active);
        console.log('Status changed:', company.is_active !== afterCompany.is_active ? '✅' : '❌');
        
        if (company.is_active !== afterCompany.is_active) {
            console.log('🎉 Status can be changed through Edit form!');
            console.log('Solution: Modify Edit form to include is_active toggle');
        } else {
            console.log('❌ Status cannot be changed through any method');
        }
        
    } catch (error) {
        console.error('Final test error:', error.message);
    }
}

fixToggleFinal();