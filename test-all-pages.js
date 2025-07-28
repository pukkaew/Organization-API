const axios = require('axios');

async function testAllPages() {
    console.log('🔍 Testing All Pages...\n');
    
    const cookieJar = [];
    
    // Login first
    try {
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post('http://localhost:3008/login', {
            username: 'admin',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400
        });
        
        if (loginResponse.headers['set-cookie']) {
            cookieJar.push(...loginResponse.headers['set-cookie']);
        }
        console.log('✅ Login successful\n');
    } catch (error) {
        console.log('❌ Login failed:', error.response?.status);
        return;
    }
    
    const pages = [
        { name: 'Dashboard', url: 'http://localhost:3008/' },
        { name: 'Companies', url: 'http://localhost:3008/companies' },
        { name: 'Branches', url: 'http://localhost:3008/branches' },
        { name: 'Divisions', url: 'http://localhost:3008/divisions' },
        { name: 'Departments', url: 'http://localhost:3008/departments' },
        { name: 'API Keys', url: 'http://localhost:3008/api-keys' }
    ];
    
    for (const page of pages) {
        try {
            console.log(`📍 Testing ${page.name}...`);
            
            const response = await axios.get(page.url, {
                headers: {
                    'Cookie': cookieJar.join('; ')
                },
                timeout: 10000,
                validateStatus: status => status >= 200 && status < 500
            });
            
            if (response.status === 200) {
                const hasData = response.data.length > 1000; // Basic check for content
                const hasError = response.data.toLowerCase().includes('error') || 
                                response.data.includes('500') ||
                                response.data.includes('Invalid object name');
                
                if (hasError) {
                    console.log(`❌ ${page.name}: Error found in response`);
                    require('fs').writeFileSync(`${page.name.toLowerCase()}_error.html`, response.data);
                } else {
                    console.log(`✅ ${page.name}: Working (${hasData ? 'with data' : 'minimal content'})`);
                }
            } else {
                console.log(`⚠️  ${page.name}: Status ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ ${page.name}: ${error.message}`);
        }
    }
    
    console.log('\n🏁 Page testing completed');
}

testAllPages();