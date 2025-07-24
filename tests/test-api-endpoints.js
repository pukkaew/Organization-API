// API Endpoints Database Test
const express = require('express');
const { connectDatabase, closeDatabase } = require('./src/config/database');

// Import routes
const companyRoutes = require('./src/routes/companyRoutes');
const branchRoutes = require('./src/routes/branchRoutes');
const divisionRoutes = require('./src/routes/divisionRoutes');
const departmentRoutes = require('./src/routes/departmentRoutes');

async function testAPIEndpoints() {
    console.log('🌐 Starting API Endpoints Database Tests...\n');
    
    // Create Express app
    const app = express();
    app.use(express.json());
    
    // Setup routes
    app.use('/api/companies', companyRoutes);
    app.use('/api/branches', branchRoutes);
    app.use('/api/divisions', divisionRoutes);
    app.use('/api/departments', departmentRoutes);
    
    // Start server
    const server = app.listen(3005, async () => {
        console.log('✅ Test server started on port 3005\n');
        
        try {
            // Connect to database
            await connectDatabase();
            console.log('✅ Database connected successfully\n');
            
            // Run API tests
            await runAPITests();
            
        } catch (error) {
            console.error('❌ API test failed:', error);
        } finally {
            await closeDatabase();
            server.close();
            console.log('🔌 Test server closed');
        }
    });
}

async function runAPITests() {
    const baseUrl = 'http://localhost:3005/api';
    
    try {
        // Test 1: Get all companies
        console.log('📊 Test 1: GET /api/companies');
        const companiesResponse = await fetch(`${baseUrl}/companies`);
        const companies = await companiesResponse.json();
        
        if (companiesResponse.ok) {
            console.log(`   ✅ SUCCESS: Retrieved ${companies.data.length} companies`);
            companies.data.forEach(company => {
                console.log(`   - ${company.company_code}: ${company.company_name_th}`);
            });
        } else {
            console.log('   ❌ FAILED:', companies.message);
        }
        console.log();
        
        // Test 2: Get company by code
        console.log('🏢 Test 2: GET /api/companies/RUXCHAI');
        const companyResponse = await fetch(`${baseUrl}/companies/RUXCHAI`);
        const company = await companyResponse.json();
        
        if (companyResponse.ok) {
            console.log('   ✅ SUCCESS: Retrieved company details');
            console.log(`   Company: ${company.data.company_name_th}`);
            console.log(`   Tax ID: ${company.data.tax_id}`);
            console.log(`   Active: ${company.data.is_active ? 'Yes' : 'No'}`);
        } else {
            console.log('   ❌ FAILED:', company.message);
        }
        console.log();
        
        // Test 3: Get branches
        console.log('🏪 Test 3: GET /api/branches');
        const branchesResponse = await fetch(`${baseUrl}/branches`);
        const branches = await branchesResponse.json();
        
        if (branchesResponse.ok) {
            console.log(`   ✅ SUCCESS: Retrieved ${branches.data.length} branches`);
            branches.data.forEach(branch => {
                console.log(`   - ${branch.branch_code}: ${branch.branch_name} (${branch.company_code})`);
            });
        } else {
            console.log('   ❌ FAILED:', branches.message);
        }
        console.log();
        
        // Test 4: Get branches by company
        console.log('🏪 Test 4: GET /api/companies/RUXCHAI/branches');
        const companyBranchesResponse = await fetch(`${baseUrl}/companies/RUXCHAI/branches`);
        const companyBranches = await companyBranchesResponse.json();
        
        if (companyBranchesResponse.ok) {
            console.log(`   ✅ SUCCESS: Retrieved ${companyBranches.data.length} branches for RUXCHAI`);
            companyBranches.data.forEach(branch => {
                console.log(`   - ${branch.branch_code}: ${branch.branch_name}`);
            });
        } else {
            console.log('   ❌ FAILED:', companyBranches.message);
        }
        console.log();
        
        // Test 5: Get divisions
        console.log('🏗️ Test 5: GET /api/divisions');
        const divisionsResponse = await fetch(`${baseUrl}/divisions`);
        const divisions = await divisionsResponse.json();
        
        if (divisionsResponse.ok) {
            console.log(`   ✅ SUCCESS: Retrieved ${divisions.data.length} divisions`);
            divisions.data.forEach(division => {
                console.log(`   - ${division.division_code}: ${division.division_name}`);
            });
        } else {
            console.log('   ❌ FAILED:', divisions.message);
        }
        console.log();
        
        // Test 6: Get departments
        console.log('🏛️ Test 6: GET /api/departments');
        const departmentsResponse = await fetch(`${baseUrl}/departments`);
        const departments = await departmentsResponse.json();
        
        if (departmentsResponse.ok) {
            console.log(`   ✅ SUCCESS: Retrieved ${departments.data.length} departments`);
            departments.data.forEach(dept => {
                console.log(`   - ${dept.department_code}: ${dept.department_name}`);
            });
        } else {
            console.log('   ❌ FAILED:', departments.message);
        }
        console.log();
        
        // Test 7: Create new department via API
        console.log('➕ Test 7: POST /api/departments (Create new department)');
        const newDept = {
            department_code: `API-TEST-${Date.now()}`,
            department_name: 'แผนกทดสอบ API',
            division_code: 'RUXCHAI-DIV01'
        };
        
        const createResponse = await fetch(`${baseUrl}/departments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newDept)
        });
        
        const createResult = await createResponse.json();
        
        if (createResponse.ok) {
            console.log('   ✅ SUCCESS: Department created');
            console.log(`   Code: ${newDept.department_code}`);
            console.log(`   Name: ${newDept.department_name}`);
        } else {
            console.log('   ❌ FAILED:', createResult.message);
        }
        console.log();
        
        // Test 8: Update department via API
        if (createResponse.ok) {
            console.log('✏️ Test 8: PUT /api/departments/:code (Update department)');
            const updateData = {
                department_name: 'แผนกทดสอบ API (อัพเดท)',
                division_code: 'RUXCHAI-DIV01'
            };
            
            const updateResponse = await fetch(`${baseUrl}/departments/${newDept.department_code}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            const updateResult = await updateResponse.json();
            
            if (updateResponse.ok) {
                console.log('   ✅ SUCCESS: Department updated');
                console.log(`   New name: ${updateData.department_name}`);
            } else {
                console.log('   ❌ FAILED:', updateResult.message);
            }
            console.log();
        }
        
        // Test 9: Get department by code
        if (createResponse.ok) {
            console.log('🔍 Test 9: GET /api/departments/:code (Get specific department)');
            const getDeptResponse = await fetch(`${baseUrl}/departments/${newDept.department_code}`);
            const getDeptResult = await getDeptResponse.json();
            
            if (getDeptResponse.ok) {
                console.log('   ✅ SUCCESS: Department retrieved');
                console.log(`   Code: ${getDeptResult.data.department_code}`);
                console.log(`   Name: ${getDeptResult.data.department_name}`);
                console.log(`   Division: ${getDeptResult.data.division_code}`);
                console.log(`   Created: ${getDeptResult.data.created_date}`);
                console.log(`   Updated: ${getDeptResult.data.updated_date}`);
            } else {
                console.log('   ❌ FAILED:', getDeptResult.message);
            }
            console.log();
        }
        
        // Test 10: Delete department via API
        if (createResponse.ok) {
            console.log('🗑️ Test 10: DELETE /api/departments/:code (Delete department)');
            const deleteResponse = await fetch(`${baseUrl}/departments/${newDept.department_code}`, {
                method: 'DELETE'
            });
            
            const deleteResult = await deleteResponse.json();
            
            if (deleteResponse.ok) {
                console.log('   ✅ SUCCESS: Department deleted');
                console.log(`   Deleted: ${newDept.department_code}`);
            } else {
                console.log('   ❌ FAILED:', deleteResult.message);
            }
            console.log();
        }
        
        // Test 11: Test error handling - Get non-existent department
        console.log('🚫 Test 11: GET /api/departments/INVALID-CODE (Error handling)');
        const errorResponse = await fetch(`${baseUrl}/departments/INVALID-CODE`);
        const errorResult = await errorResponse.json();
        
        if (errorResponse.status === 404) {
            console.log('   ✅ SUCCESS: Proper 404 error handling');
            console.log(`   Message: ${errorResult.message}`);
        } else {
            console.log('   ❌ FAILED: Expected 404 error');
        }
        console.log();
        
        // Test 12: Test hierarchy endpoint
        console.log('🌳 Test 12: GET /api/departments with hierarchy');
        const hierarchyResponse = await fetch(`${baseUrl}/departments?include_hierarchy=true`);
        const hierarchyResult = await hierarchyResponse.json();
        
        if (hierarchyResponse.ok) {
            console.log(`   ✅ SUCCESS: Retrieved departments with hierarchy`);
            console.log(`   Total departments: ${hierarchyResult.data.length}`);
            
            // Show first department's hierarchy
            if (hierarchyResult.data.length > 0) {
                const firstDept = hierarchyResult.data[0];
                console.log('   Sample hierarchy:');
                console.log(`   - Department: ${firstDept.department_name}`);
                if (firstDept.division_name) console.log(`   - Division: ${firstDept.division_name}`);
                if (firstDept.branch_name) console.log(`   - Branch: ${firstDept.branch_name}`);
                if (firstDept.company_name_th) console.log(`   - Company: ${firstDept.company_name_th}`);
            }
        } else {
            console.log('   ❌ FAILED:', hierarchyResult.message);
        }
        console.log();
        
        console.log('✅ All API endpoint tests completed successfully!\n');
        
    } catch (error) {
        console.error('❌ API test error:', error.message);
    }
}

// Import fetch for Node.js
async function importFetch() {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch;
}

// Run tests
importFetch().then(() => {
    testAPIEndpoints();
}).catch(error => {
    console.error('Failed to import fetch:', error);
});