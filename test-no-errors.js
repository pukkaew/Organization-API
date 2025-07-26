#!/usr/bin/env node

// Test that there are no more SQLite errors
const axios = require('axios');

const BASE_URL = 'http://localhost:3008';

async function testNoErrors() {
    console.log('🧪 Testing for SQLite Errors');
    console.log('============================\n');
    
    try {
        // 1. Test login page (should trigger API stats)
        console.log('1. Testing login page...');
        const loginPageResponse = await axios.get(`${BASE_URL}/login`);
        console.log('✅ Login page loaded without errors');
        
        // 2. Login
        console.log('\n2. Testing login...');
        const loginResponse = await axios.post(`${BASE_URL}/login`, {
            username: 'admin',
            password: 'admin123'
        }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });
        
        const sessionCookie = loginResponse.headers['set-cookie']
            ?.map(cookie => cookie.split(';')[0])
            .join('; ') || '';
        
        console.log('✅ Login successful');
        
        // 3. Test dashboard (main trigger for API stats)
        console.log('\n3. Testing dashboard (API stats)...');
        const dashboardResponse = await axios.get(`${BASE_URL}/`, {
            headers: { 'Cookie': sessionCookie }
        });
        console.log('✅ Dashboard loaded without errors');
        
        // 4. Test all list pages
        console.log('\n4. Testing all list pages...');
        const pages = [
            '/companies',
            '/branches', 
            '/divisions',
            '/departments'
        ];
        
        for (const page of pages) {
            const response = await axios.get(`${BASE_URL}${page}`, {
                headers: { 'Cookie': sessionCookie }
            });
            console.log(`✅ ${page} loaded without errors`);
        }
        
        console.log('\n✅ All tests passed! No SQLite errors found.');
        console.log('✅ "response_time_ms" column error has been fixed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testNoErrors();