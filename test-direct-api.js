// Direct API Test (without server setup issues)
const { connectDatabase, executeQuery, closeDatabase } = require('./src/config/database');

// Import controllers directly
const companyController = require('./src/controllers/companyController');
const branchController = require('./src/controllers/branchController');
const divisionController = require('./src/controllers/divisionController');
const departmentController = require('./src/controllers/departmentController');

// Mock Express request/response objects
function createMockReq(params = {}, query = {}, body = {}) {
    return {
        params,
        query,
        body,
        flash: () => {},
        user: { username: 'test-user' }
    };
}

function createMockRes() {
    const res = {
        statusCode: 200,
        data: null,
        json: function(data) {
            this.data = data;
            return this;
        },
        status: function(code) {
            this.statusCode = code;
            return this;
        }
    };
    return res;
}

async function testDirectAPI() {
    console.log('🎯 Starting Direct API Controller Tests...\n');
    
    try {
        // Connect to database
        await connectDatabase();
        console.log('✅ Database connected successfully\n');
        
        // Test 1: Get all companies
        console.log('📊 Test 1: Get all companies (Controller)');
        const req1 = createMockReq();
        const res1 = createMockRes();
        
        await companyController.getAllCompanies(req1, res1);
        
        if (res1.statusCode === 200 && res1.data && res1.data.success) {
            console.log(`   ✅ SUCCESS: Retrieved ${res1.data.data.length} companies`);
            res1.data.data.forEach(company => {
                console.log(`   - ${company.company_code}: ${company.company_name_th}`);
            });
        } else {
            console.log('   ❌ FAILED: Could not retrieve companies');
            console.log('   Response:', res1.data);
        }
        console.log();
        
        // Test 2: Get company by code
        console.log('🏢 Test 2: Get company by code (RUXCHAI)');
        const req2 = createMockReq({ code: 'RUXCHAI' });
        const res2 = createMockRes();
        
        await companyController.getCompanyByCode(req2, res2);
        
        if (res2.statusCode === 200 && res2.data && res2.data.success) {
            const company = res2.data.data;
            console.log('   ✅ SUCCESS: Retrieved company details');
            console.log(`   Company: ${company.company_name_th}`);
            console.log(`   Tax ID: ${company.tax_id}`);
            console.log(`   Active: ${company.is_active ? 'Yes' : 'No'}`);
        } else {
            console.log('   ❌ FAILED: Could not retrieve company');
            console.log('   Response:', res2.data);
        }
        console.log();
        
        // Test 3: Get all branches
        console.log('🏪 Test 3: Get all branches');
        const req3 = createMockReq();
        const res3 = createMockRes();
        
        await branchController.getAllBranches(req3, res3);
        
        if (res3.statusCode === 200 && res3.data && res3.data.success) {
            console.log(`   ✅ SUCCESS: Retrieved ${res3.data.data.length} branches`);
            res3.data.data.forEach(branch => {
                console.log(`   - ${branch.branch_code}: ${branch.branch_name} (${branch.company_code})`);
            });
        } else {
            console.log('   ❌ FAILED: Could not retrieve branches');
            console.log('   Response:', res3.data);
        }
        console.log();
        
        // Test 4: Get branches by company
        console.log('🏪 Test 4: Get branches by company (RUXCHAI)');
        const req4 = createMockReq({ companyCode: 'RUXCHAI' });
        const res4 = createMockRes();
        
        await branchController.getBranchesByCompany(req4, res4);
        
        if (res4.statusCode === 200 && res4.data && res4.data.success) {
            console.log(`   ✅ SUCCESS: Retrieved ${res4.data.data.length} branches for RUXCHAI`);
            res4.data.data.forEach(branch => {
                console.log(`   - ${branch.branch_code}: ${branch.branch_name}`);
            });
        } else {
            console.log('   ❌ FAILED: Could not retrieve company branches');
            console.log('   Response:', res4.data);
        }
        console.log();
        
        // Test 5: Get all divisions
        console.log('🏗️ Test 5: Get all divisions');
        const req5 = createMockReq();
        const res5 = createMockRes();
        
        await divisionController.getAllDivisions(req5, res5);
        
        if (res5.statusCode === 200 && res5.data && res5.data.success) {
            console.log(`   ✅ SUCCESS: Retrieved ${res5.data.data.length} divisions`);
            res5.data.data.forEach(division => {
                console.log(`   - ${division.division_code}: ${division.division_name}`);
            });
        } else {
            console.log('   ❌ FAILED: Could not retrieve divisions');
            console.log('   Response:', res5.data);
        }
        console.log();
        
        // Test 6: Get all departments
        console.log('🏛️ Test 6: Get all departments');
        const req6 = createMockReq();
        const res6 = createMockRes();
        
        await departmentController.getAllDepartments(req6, res6);
        
        if (res6.statusCode === 200 && res6.data && res6.data.success) {
            console.log(`   ✅ SUCCESS: Retrieved ${res6.data.data.length} departments`);
            res6.data.data.forEach(dept => {
                console.log(`   - ${dept.department_code}: ${dept.department_name}`);
            });
        } else {
            console.log('   ❌ FAILED: Could not retrieve departments');
            console.log('   Response:', res6.data);
        }
        console.log();
        
        // Test 7: Create new department
        console.log('➕ Test 7: Create new department');
        const newDeptCode = `DIRECT-TEST-${Date.now()}`;
        const req7 = createMockReq(
            {},
            {},
            {
                department_code: newDeptCode,
                department_name: 'แผนกทดสอบ Direct API',
                division_code: 'RUXCHAI-DIV01'
            }
        );
        const res7 = createMockRes();
        
        await departmentController.createDepartment(req7, res7);
        
        if (res7.statusCode === 201 && res7.data && res7.data.success) {
            console.log('   ✅ SUCCESS: Department created');
            console.log(`   Code: ${newDeptCode}`);
            console.log(`   Name: ${req7.body.department_name}`);
        } else {
            console.log('   ❌ FAILED: Could not create department');
            console.log('   Response:', res7.data);
        }
        console.log();
        
        // Test 8: Get department by code
        console.log('🔍 Test 8: Get department by code');
        const req8 = createMockReq({ code: newDeptCode });
        const res8 = createMockRes();
        
        await departmentController.getDepartmentByCode(req8, res8);
        
        if (res8.statusCode === 200 && res8.data && res8.data.success) {
            const dept = res8.data.data;
            console.log('   ✅ SUCCESS: Department retrieved');
            console.log(`   Code: ${dept.department_code}`);
            console.log(`   Name: ${dept.department_name}`);
            console.log(`   Division: ${dept.division_code}`);
            console.log(`   Created: ${dept.created_date}`);
        } else {
            console.log('   ❌ FAILED: Could not retrieve department');
            console.log('   Response:', res8.data);
        }
        console.log();
        
        // Test 9: Update department
        console.log('✏️ Test 9: Update department');
        const req9 = createMockReq(
            { code: newDeptCode },
            {},
            {
                department_name: 'แผนกทดสอบ Direct API (อัพเดท)',
                division_code: 'RUXCHAI-DIV01'
            }
        );
        const res9 = createMockRes();
        
        await departmentController.updateDepartment(req9, res9);
        
        if (res9.statusCode === 200 && res9.data && res9.data.success) {
            console.log('   ✅ SUCCESS: Department updated');
            console.log(`   New name: ${req9.body.department_name}`);
        } else {
            console.log('   ❌ FAILED: Could not update department');
            console.log('   Response:', res9.data);
        }
        console.log();
        
        // Test 10: Delete department
        console.log('🗑️ Test 10: Delete department');
        const req10 = createMockReq({ code: newDeptCode });
        const res10 = createMockRes();
        
        await departmentController.deleteDepartment(req10, res10);
        
        if (res10.statusCode === 200 && res10.data && res10.data.success) {
            console.log('   ✅ SUCCESS: Department deleted');
            console.log(`   Deleted: ${newDeptCode}`);
        } else {
            console.log('   ❌ FAILED: Could not delete department');
            console.log('   Response:', res10.data);
        }
        console.log();
        
        // Test 11: Get non-existent department (error handling)
        console.log('🚫 Test 11: Get non-existent department');
        const req11 = createMockReq({ code: 'INVALID-DEPT-CODE' });
        const res11 = createMockRes();
        
        await departmentController.getDepartmentByCode(req11, res11);
        
        if (res11.statusCode === 404) {
            console.log('   ✅ SUCCESS: Proper 404 error handling');
            console.log(`   Message: ${res11.data.message}`);
        } else {
            console.log('   ❌ FAILED: Expected 404 error');
            console.log('   Response:', res11.data);
        }
        console.log();
        
        // Test 12: Test departments with hierarchy
        console.log('🌳 Test 12: Get departments with hierarchy');
        const req12 = createMockReq({}, { include_hierarchy: 'true' });
        const res12 = createMockRes();
        
        await departmentController.getAllDepartments(req12, res12);
        
        if (res12.statusCode === 200 && res12.data && res12.data.success) {
            console.log(`   ✅ SUCCESS: Retrieved departments with hierarchy`);
            console.log(`   Total departments: ${res12.data.data.length}`);
            
            // Show first department's hierarchy
            if (res12.data.data.length > 0) {
                const firstDept = res12.data.data[0];
                console.log('   Sample hierarchy:');
                console.log(`   - Department: ${firstDept.department_name}`);
                if (firstDept.division_name) console.log(`   - Division: ${firstDept.division_name}`);
                if (firstDept.branch_name) console.log(`   - Branch: ${firstDept.branch_name}`);
                if (firstDept.company_name_th) console.log(`   - Company: ${firstDept.company_name_th}`);
            }
        } else {
            console.log('   ❌ FAILED: Could not retrieve departments with hierarchy');
            console.log('   Response:', res12.data);
        }
        console.log();
        
        console.log('✅ All direct API controller tests completed successfully!\n');
        
    } catch (error) {
        console.error('❌ Direct API test failed:', error);
    } finally {
        await closeDatabase();
        console.log('🔌 Database connection closed');
    }
}

// Run tests
testDirectAPI();