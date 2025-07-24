// Test web login
const http = require('http');

async function login() {
    return new Promise((resolve, reject) => {
        const postData = 'username=admin&password=admin123';
        
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            console.log(`Login status: ${res.statusCode}`);
            console.log('Headers:', res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 302) {
                    console.log('✅ Login successful, redirected to:', res.headers.location);
                    resolve(res.headers['set-cookie']);
                } else {
                    console.log('❌ Login failed');
                    console.log('Response:', data);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

async function getCompaniesPage(cookies) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/companies',
            method: 'GET',
            headers: {
                'Cookie': cookies ? cookies.join('; ') : ''
            }
        };

        const req = http.request(options, (res) => {
            console.log(`\nCompanies page status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Successfully accessed companies page');
                    
                    // Check for display issues
                    if (data.includes('<%') || data.includes('%>')) {
                        console.log('\n⚠️  Found unprocessed EJS tags in output!');
                        const matches = data.match(/<%.*?%>/g);
                        if (matches) {
                            console.log('Unprocessed tags:', matches.slice(0, 5));
                        }
                    }
                    
                    // Save to file for inspection
                    require('fs').writeFileSync('companies-page.html', data);
                    console.log('\n📄 Full page saved to companies-page.html');
                } else {
                    console.log('❌ Failed to access companies page');
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e);
        });

        req.end();
    });
}

async function run() {
    console.log('🔍 Testing Web View Display\n');
    
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const cookies = await login();
    
    if (cookies) {
        // Step 2: Access companies page
        console.log('\nStep 2: Accessing companies page...');
        await getCompaniesPage(cookies);
    }
}

run();