#!/usr/bin/env node

// Comprehensive test for Add, Edit, Delete functionality
const axios = require('axios');
const https = require('https');

// Configure axios
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    timeout: 10000
});

const BASE_URL = 'http://localhost:3008';
let sessionCookie = '';

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
async function makeRequest(method, url, data = null, followRedirect = false) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Cookie': sessionCookie,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: followRedirect ? 5 : 0,
            validateStatus: function (status) {
                return status >= 200 && status < 400;
            }
        };
        
        if (data) {
            config.data = new URLSearchParams(data).toString();
        }
        
        const response = await axiosInstance(config);
        return response;
    } catch (error) {
        if (error.response) {
            return error.response;
        }
        throw error;
    }
}

// Login function
async function login() {
    try {
        const loginResponse = await axiosInstance.post(`${BASE_URL}/login`, {
            username: 'admin',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });
        
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

// Test CRUD operations for Companies
async function testCompanyCRUD() {
    console.log('\n📦 Testing Company CRUD Operations...');
    const timestamp = Date.now();
    const companyCode = `TESTCO${timestamp}`;
    
    // 1. Create Company
    try {
        const createData = {
            company_code: companyCode,
            company_name_th: `บริษัททดสอบ ${timestamp} จำกัด`,
            company_name_en: `Test Company ${timestamp} Limited`,
            tax_id: `999${timestamp.toString().slice(-10)}`,
            _csrf: 'dev-csrf-token'
        };
        
        const createResponse = await makeRequest('POST', '/companies', createData);
        const createSuccess = createResponse.status === 302 || createResponse.status === 200;
        logTest('Company - Add', createSuccess, 
            !createSuccess ? `Status: ${createResponse.status}` : null);
            
        if (createSuccess) {
            // 2. Edit Company
            try {
                const editData = {
                    company_name_th: `บริษัททดสอบ ${timestamp} จำกัด (แก้ไขแล้ว)`,
                    company_name_en: `Test Company ${timestamp} Limited (Edited)`,
                    tax_id: createData.tax_id,
                    _method: 'PUT',
                    _csrf: 'dev-csrf-token'
                };
                
                const editResponse = await makeRequest('POST', `/companies/${companyCode}`, editData);
                const editSuccess = editResponse.status === 302 || editResponse.status === 200;
                logTest('Company - Edit', editSuccess, 
                    !editSuccess ? `Status: ${editResponse.status}` : null);
            } catch (editError) {
                logTest('Company - Edit', false, editError.message);
            }
            
            // 3. Delete Company
            try {
                const deleteData = {
                    _method: 'DELETE',
                    _csrf: 'dev-csrf-token'
                };
                
                const deleteResponse = await makeRequest('POST', `/companies/${companyCode}/delete`, deleteData);
                const deleteSuccess = deleteResponse.status === 302 || deleteResponse.status === 200;
                logTest('Company - Delete', deleteSuccess, 
                    !deleteSuccess ? `Status: ${deleteResponse.status}` : null);
            } catch (deleteError) {
                logTest('Company - Delete', false, deleteError.message);
            }
        }
    } catch (error) {
        logTest('Company - Add', false, error.message);
    }
}

// Test CRUD operations for Branches
async function testBranchCRUD() {
    console.log('\n🏢 Testing Branch CRUD Operations...');
    const timestamp = Date.now();
    const branchCode = `TESTBR${timestamp}`;
    
    // 1. Create Branch
    try {
        const createData = {
            branch_code: branchCode,
            branch_name: `สาขาทดสอบ ${timestamp}`,
            company_code: 'RUXCHAI',
            is_headquarters: false,
            _csrf: 'dev-csrf-token'
        };
        
        const createResponse = await makeRequest('POST', '/branches', createData);
        const createSuccess = createResponse.status === 302 || createResponse.status === 200;
        logTest('Branch - Add', createSuccess, 
            !createSuccess ? `Status: ${createResponse.status}` : null);
            
        if (createSuccess) {
            // 2. Edit Branch
            try {
                const editData = {
                    branch_name: `สาขาทดสอบ ${timestamp} (แก้ไขแล้ว)`,
                    is_headquarters: false,
                    _method: 'PUT',
                    _csrf: 'dev-csrf-token'
                };
                
                const editResponse = await makeRequest('POST', `/branches/${branchCode}`, editData);
                const editSuccess = editResponse.status === 302 || editResponse.status === 200;
                logTest('Branch - Edit', editSuccess, 
                    !editSuccess ? `Status: ${editResponse.status}` : null);
            } catch (editError) {
                logTest('Branch - Edit', false, editError.message);
            }
            
            // 3. Delete Branch
            try {
                const deleteData = {
                    _method: 'DELETE',
                    _csrf: 'dev-csrf-token'
                };
                
                const deleteResponse = await makeRequest('POST', `/branches/${branchCode}/delete`, deleteData);
                const deleteSuccess = deleteResponse.status === 302 || deleteResponse.status === 200;
                logTest('Branch - Delete', deleteSuccess, 
                    !deleteSuccess ? `Status: ${deleteResponse.status}` : null);
            } catch (deleteError) {
                logTest('Branch - Delete', false, deleteError.message);
            }
        }
    } catch (error) {
        logTest('Branch - Add', false, error.message);
    }
}

// Test CRUD operations for Divisions
async function testDivisionCRUD() {
    console.log('\n📂 Testing Division CRUD Operations...');
    const timestamp = Date.now();
    const divisionCode = `TESTDIV${timestamp}`;
    
    // 1. Create Division
    try {
        const createData = {
            division_code: divisionCode,
            division_name: `ฝ่ายทดสอบ ${timestamp}`,
            company_code: 'RUXCHAI',
            _csrf: 'dev-csrf-token'
        };
        
        const createResponse = await makeRequest('POST', '/divisions', createData);
        const createSuccess = createResponse.status === 302 || createResponse.status === 200;
        logTest('Division - Add', createSuccess, 
            !createSuccess ? `Status: ${createResponse.status}` : null);
            
        if (createSuccess) {
            // 2. Edit Division
            try {
                const editData = {
                    division_name: `ฝ่ายทดสอบ ${timestamp} (แก้ไขแล้ว)`,
                    _method: 'PUT',
                    _csrf: 'dev-csrf-token'
                };
                
                const editResponse = await makeRequest('POST', `/divisions/${divisionCode}`, editData);
                const editSuccess = editResponse.status === 302 || editResponse.status === 200;
                logTest('Division - Edit', editSuccess, 
                    !editSuccess ? `Status: ${editResponse.status}` : null);
            } catch (editError) {
                logTest('Division - Edit', false, editError.message);
            }
            
            // 3. Delete Division
            try {
                const deleteData = {
                    _method: 'DELETE',
                    _csrf: 'dev-csrf-token'
                };
                
                const deleteResponse = await makeRequest('POST', `/divisions/${divisionCode}/delete`, deleteData);
                const deleteSuccess = deleteResponse.status === 302 || deleteResponse.status === 200;
                logTest('Division - Delete', deleteSuccess, 
                    !deleteSuccess ? `Status: ${deleteResponse.status}` : null);
            } catch (deleteError) {
                logTest('Division - Delete', false, deleteError.message);
            }
        }
    } catch (error) {
        logTest('Division - Add', false, error.message);
    }
}

// Test CRUD operations for Departments
async function testDepartmentCRUD() {
    console.log('\n📋 Testing Department CRUD Operations...');
    const timestamp = Date.now();
    const departmentCode = `TESTDEPT${timestamp}`;
    
    // 1. Create Department
    try {
        const createData = {
            department_code: departmentCode,
            department_name: `แผนกทดสอบ ${timestamp}`,
            division_code: 'RUXCHAI-DIV01',
            _csrf: 'dev-csrf-token'
        };
        
        const createResponse = await makeRequest('POST', '/departments', createData);
        const createSuccess = createResponse.status === 302 || createResponse.status === 200;
        logTest('Department - Add', createSuccess, 
            !createSuccess ? `Status: ${createResponse.status}` : null);
            
        if (createSuccess) {
            // 2. Edit Department
            try {
                const editData = {
                    department_name: `แผนกทดสอบ ${timestamp} (แก้ไขแล้ว)`,
                    _method: 'PUT',
                    _csrf: 'dev-csrf-token'
                };
                
                const editResponse = await makeRequest('POST', `/departments/${departmentCode}`, editData);
                const editSuccess = editResponse.status === 302 || editResponse.status === 200;
                logTest('Department - Edit', editSuccess, 
                    !editSuccess ? `Status: ${editResponse.status}` : null);
            } catch (editError) {
                logTest('Department - Edit', false, editError.message);
            }
            
            // 3. Delete Department
            try {
                const deleteData = {
                    _method: 'DELETE',
                    _csrf: 'dev-csrf-token'
                };
                
                const deleteResponse = await makeRequest('POST', `/departments/${departmentCode}/delete`, deleteData);
                const deleteSuccess = deleteResponse.status === 302 || deleteResponse.status === 200;
                logTest('Department - Delete', deleteSuccess, 
                    !deleteSuccess ? `Status: ${deleteResponse.status}` : null);
            } catch (deleteError) {
                logTest('Department - Delete', false, deleteError.message);
            }
        }
    } catch (error) {
        logTest('Department - Add', false, error.message);
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting Full CRUD Test Suite');
    console.log('==========================================\n');
    
    const startTime = Date.now();
    
    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without authentication');
        return;
    }
    
    // Test all entities
    await testCompanyCRUD();
    await testBranchCRUD();
    await testDivisionCRUD();
    await testDepartmentCRUD();
    
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

// Check if server is running
axiosInstance.get(`${BASE_URL}/`)
    .then(() => {
        runTests();
    })
    .catch(() => {
        console.log('❌ Server is not running on http://localhost:3007');
        console.log('Please start the server first with: npm start');
        process.exit(1);
    });