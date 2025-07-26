#!/usr/bin/env node

// Test script to verify all CRUD functionality is working
const axios = require('axios');
const https = require('https');

// Configure axios to ignore SSL certificate issues for testing
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    timeout: 10000
});

const BASE_URL = 'http://localhost:3007';
let sessionCookie = '';

// Test configuration
const testConfig = {
    username: 'admin',
    password: 'admin123'
};

// Test results tracking
let testResults = [];
let passedTests = 0;
let totalTests = 0;

function logTest(testName, passed, error = null) {
    totalTests++;
    if (passed) {
        passedTests++;
        console.log(`✅ ${testName}`);
        testResults.push({ test: testName, status: 'PASS' });
    } else {
        console.log(`❌ ${testName} - ${error}`);
        testResults.push({ test: testName, status: 'FAIL', error: error });
    }
}

// Helper function to make authenticated requests
async function makeRequest(method, url, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Cookie': sessionCookie,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        
        if (data) {
            config.data = new URLSearchParams(data).toString();
        }
        
        const response = await axiosInstance(config);
        return response;
    } catch (error) {
        throw error;
    }
}

// Login function
async function login() {
    try {
        // Get login page first to get any CSRF token
        const loginPageResponse = await axiosInstance.get(`${BASE_URL}/login`);
        
        // Login with credentials
        const loginResponse = await axiosInstance.post(`${BASE_URL}/login`, {
            username: testConfig.username,
            password: testConfig.password
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 400;
            }
        });
        
        // Extract session cookie
        if (loginResponse.headers['set-cookie']) {
            sessionCookie = loginResponse.headers['set-cookie']
                .map(cookie => cookie.split(';')[0])
                .join('; ');
        }
        
        logTest('Authentication', true);
        return true;
    } catch (error) {
        logTest('Authentication', false, error.message);
        return false;
    }
}

// Test all main pages load without 500 errors
async function testPageLoads() {
    const pages = [
        { name: 'Dashboard', url: '/' },
        { name: 'Companies List', url: '/companies' },
        { name: 'Branches List', url: '/branches' },
        { name: 'Divisions List', url: '/divisions' },
        { name: 'Departments List', url: '/departments' }
    ];
    
    for (const page of pages) {
        try {
            const response = await makeRequest('GET', page.url);
            const success = response.status === 200;
            logTest(`${page.name} Page Load`, success, 
                !success ? `Status: ${response.status}` : null);
        } catch (error) {
            logTest(`${page.name} Page Load`, false, error.response?.status || error.message);
        }
    }
}

// Test form pages load without 500 errors
async function testFormPages() {
    const formPages = [
        { name: 'Company Create Form', url: '/companies/new' },
        { name: 'Branch Create Form', url: '/branches/new' },
        { name: 'Division Create Form', url: '/divisions/new' },
        { name: 'Department Create Form', url: '/departments/new' }
    ];
    
    for (const page of formPages) {
        try {
            const response = await makeRequest('GET', page.url);
            const success = response.status === 200;
            logTest(`${page.name} Page Load`, success, 
                !success ? `Status: ${response.status}` : null);
        } catch (error) {
            logTest(`${page.name} Page Load`, false, error.response?.status || error.message);
        }
    }
}

// Test CRUD operations
async function testCRUDOperations() {
    const timestamp = Date.now();
    
    // Test Company Creation
    try {
        const companyData = {
            company_code: `TEST${timestamp}`,
            company_name_th: `บริษัททดสอบ ${timestamp} จำกัด`,
            company_name_en: `Test Company ${timestamp} Limited`,
            tax_id: `12345${timestamp.toString().slice(-8)}`,
            _csrf: 'dev-csrf-token'
        };
        
        const createResponse = await makeRequest('POST', '/companies', companyData);
        const success = createResponse.status === 302 || createResponse.status === 200;
        logTest('Company Creation', success, 
            !success ? `Status: ${createResponse.status}` : null);
            
        if (success) {
            // Test Company Edit Page
            try {
                const editResponse = await makeRequest('GET', `/companies/${companyData.company_code}/edit`);
                const editSuccess = editResponse.status === 200;
                logTest('Company Edit Form', editSuccess, 
                    !editSuccess ? `Status: ${editResponse.status}` : null);
            } catch (editError) {
                logTest('Company Edit Form', false, editError.response?.status || editError.message);
            }
        }
    } catch (error) {
        logTest('Company Creation', false, error.response?.status || error.message);
    }
    
    // Test Branch Creation  
    try {
        const branchData = {
            branch_code: `BR${timestamp}`,
            branch_name: `สาขาทดสอบ ${timestamp}`,
            company_code: 'RUXCHAI',
            is_headquarters: false,
            _csrf: 'dev-csrf-token'
        };
        
        const branchResponse = await makeRequest('POST', '/branches', branchData);
        const branchSuccess = branchResponse.status === 302 || branchResponse.status === 200;
        logTest('Branch Creation', branchSuccess, 
            !branchSuccess ? `Status: ${branchResponse.status}` : null);
    } catch (error) {
        logTest('Branch Creation', false, error.response?.status || error.message);
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting Comprehensive CRUD Test Suite');
    console.log('==========================================\n');
    
    const startTime = Date.now();
    
    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without authentication');
        return;
    }
    
    console.log('\n📄 Testing Page Loads...');
    await testPageLoads();
    
    console.log('\n📝 Testing Form Pages...');
    await testFormPages();
    
    console.log('\n🔧 Testing CRUD Operations...');
    await testCRUDOperations();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n==========================================');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('==========================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log(`Duration: ${duration}s`);
    
    if (totalTests - passedTests > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.filter(r => r.status === 'FAIL').forEach(result => {
            console.log(`   - ${result.test}: ${result.error}`);
        });
    }
    
    console.log('\n🎯 Test completed!');
    
    // Exit with error code if tests failed
    process.exit(totalTests - passedTests > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});

// Check if server is running
axiosInstance.get(`${BASE_URL}/`)
    .then(() => {
        runTests();
    })
    .catch(() => {
        console.log('❌ Server is not running on http://localhost:3004');
        console.log('Please start the server first with: npm start');
        process.exit(1);
    });