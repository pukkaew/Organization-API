const axios = require('axios');

async function testCompaniesEndpoint() {
    console.log('🔍 Testing Companies endpoint with session...\n');
    
    try {
        // Create a session with cookie jar
        const cookieJar = [];
        
        // First, get login page to extract any CSRF tokens
        console.log('📍 Getting login page...');
        try {
            const loginPageResponse = await axios.get('http://localhost:3008/login');
            console.log('✅ Login page accessible:', loginPageResponse.status);
        } catch (error) {
            console.log('❌ Login page error:', error.message);
        }
        
        // Try to login with form data
        console.log('🔐 Attempting login...');
        try {
            const loginResponse = await axios.post('http://localhost:3008/login', {
                username: 'admin',
                password: 'admin123'
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                maxRedirects: 0,
                validateStatus: function (status) {
                    return status >= 200 && status < 400; // Accept redirects
                }
            });
            
            console.log('✅ Login response:', loginResponse.status);
            
            // Extract cookies
            if (loginResponse.headers['set-cookie']) {
                cookieJar.push(...loginResponse.headers['set-cookie']);
                console.log('🍪 Cookies received:', cookieJar.length);
            }
        } catch (error) {
            console.log('❌ Login error:', error.response?.status, error.message);
        }
        
        // Now try to access companies page with cookies
        console.log('📍 Accessing companies page...');
        try {
            const companiesResponse = await axios.get('http://localhost:3008/companies', {
                headers: {
                    'Cookie': cookieJar.join('; ')
                },
                maxRedirects: 0,
                validateStatus: function (status) {
                    return status >= 200 && status < 500; // Accept all responses
                }
            });
            
            console.log('✅ Companies page response:', companiesResponse.status);
            
            if (companiesResponse.status === 200) {
                console.log('✅ Companies page loaded successfully!');
                
                // Check for specific content
                const content = companiesResponse.data;
                const hasCompaniesTable = content.includes('company') || content.includes('TEST001');
                const hasError = content.includes('error') || content.includes('Error') || content.includes('500');
                
                console.log('📊 Contains company data:', hasCompaniesTable);
                console.log('❌ Contains error:', hasError);
                
                if (hasError) {
                    console.log('🔍 Error details found in response');
                    // Save error response for debugging
                    require('fs').writeFileSync('companies_error.html', content);
                    console.log('💾 Error response saved to companies_error.html');
                }
            } else if (companiesResponse.status === 302) {
                console.log('🔄 Redirected (likely need authentication)');
            } else if (companiesResponse.status >= 500) {
                console.log('❌ Server error:', companiesResponse.status);
                require('fs').writeFileSync('companies_error.html', companiesResponse.data);
                console.log('💾 Error response saved to companies_error.html');
            }
            
        } catch (error) {
            console.log('❌ Companies page error:', error.response?.status, error.message);
            if (error.response?.data) {
                require('fs').writeFileSync('companies_error.html', error.response.data);
                console.log('💾 Error response saved to companies_error.html');
            }
        }
        
    } catch (error) {
        console.error('❌ Critical error:', error.message);
    }
    
    console.log('\n🏁 Test completed');
}

testCompaniesEndpoint();