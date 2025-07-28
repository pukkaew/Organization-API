const axios = require('axios');

async function testDashboard() {
    console.log('🔍 Testing Dashboard Specifically...\n');
    
    try {
        // Login first
        const loginResponse = await axios.post('http://localhost:3008/login', 
            'username=admin&password=admin123', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400
        });
        
        const cookies = loginResponse.headers['set-cookie']?.join('; ') || '';
        console.log('✅ Login successful\n');
        
        // Test dashboard
        console.log('📍 Testing Dashboard...');
        const dashboardResponse = await axios.get('http://localhost:3008/', {
            headers: {
                'Cookie': cookies
            },
            timeout: 10000
        });
        
        console.log('✅ Dashboard Status:', dashboardResponse.status);
        
        // Check for specific content
        const content = dashboardResponse.data;
        
        // Look for dashboard cards/stats
        const hasStats = content.includes('Total Companies') || 
                         content.includes('Total Branches') ||
                         content.includes('totalCompanies') ||
                         content.includes('totalBranches');
        
        // Look for error messages
        const hasErrors = content.includes('Invalid object name') ||
                         content.includes('Error:') ||
                         content.includes('RequestError');
        
        console.log('📊 Contains Stats:', hasStats);
        console.log('❌ Contains Errors:', hasErrors);
        
        // Look for specific numbers
        const numbers = content.match(/\b\d+\b/g);
        if (numbers) {
            console.log('🔢 Found numbers:', numbers.slice(0, 10));
        }
        
        // Save dashboard content for manual inspection
        require('fs').writeFileSync('dashboard_full.html', content);
        console.log('💾 Dashboard content saved to dashboard_full.html');
        
        if (hasErrors) {
            console.log('\n🔍 Error sections found in dashboard');
        } else {
            console.log('\n✅ Dashboard appears to be working without errors');
        }
        
    } catch (error) {
        console.error('❌ Dashboard test failed:', error.message);
    }
    
    console.log('\n🏁 Dashboard test completed');
}

testDashboard();