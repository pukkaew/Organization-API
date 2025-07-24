// Simple DELETE test
const http = require('http');

// First, let's test if PUT works (for comparison)
async function testPut() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/api/v1/companies/TEST123',
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'tVCSQZofGuGxj6JrMw8vjyTwKIvi8CqzcrLyUzPw'
            }
        };

        const data = JSON.stringify({ company_name_th: 'Test Update' });
        options.headers['Content-Length'] = Buffer.byteLength(data);

        const req = http.request(options, (res) => {
            console.log(`PUT /api/v1/companies/TEST123 - Status: ${res.statusCode}`);
            res.on('data', () => {});
            res.on('end', () => resolve());
        });

        req.write(data);
        req.end();
    });
}

// Test DELETE with same pattern
async function testDelete() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/api/v1/companies/TEST123',
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'tVCSQZofGuGxj6JrMw8vjyTwKIvi8CqzcrLyUzPw'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`DELETE /api/v1/companies/TEST123 - Status: ${res.statusCode}`);
                console.log('Response:', body);
                resolve();
            });
        });

        req.end();
    });
}

// Test OPTIONS to see allowed methods
async function testOptions() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/api/v1/companies/TEST123',
            method: 'OPTIONS',
            headers: {
                'x-api-key': 'tVCSQZofGuGxj6JrMw8vjyTwKIvi8CqzcrLyUzPw'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`OPTIONS /api/v1/companies/TEST123 - Status: ${res.statusCode}`);
            console.log('Allow header:', res.headers.allow);
            console.log('Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
            res.on('data', () => {});
            res.on('end', () => resolve());
        });

        req.end();
    });
}

async function run() {
    console.log('Testing HTTP methods...\n');
    await testPut();
    await testDelete();
    await testOptions();
}

run();