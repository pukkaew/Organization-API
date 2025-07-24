// Database Constraints and Relationships Test
const { connectDatabase, executeQuery, closeDatabase } = require('./src/config/database');

async function testConstraintsAndRelationships() {
    console.log('🔒 Starting Database Constraints and Relationships Tests...\n');
    
    try {
        await connectDatabase();
        console.log('✅ Database connected successfully\n');
        
        // Test 1: Foreign Key Constraint - Try to create branch with invalid company
        console.log('🚫 Test 1: Foreign Key Constraint - Branch with invalid company');
        try {
            await executeQuery(`
                INSERT INTO Branches (branch_code, branch_name, company_code, is_active, created_by)
                VALUES (?, ?, ?, ?, ?)
            `, {}, ['TEST-INVALID', 'Invalid Branch', 'INVALID-COMPANY', 1, 'test-user']);
            console.log('   ❌ FAILED: Should have rejected invalid company_code');
        } catch (error) {
            console.log('   ✅ PASSED: Foreign key constraint enforced');
            console.log(`   Error: ${error.message}`);
        }
        console.log();
        
        // Test 2: Foreign Key Constraint - Try to create division with invalid branch
        console.log('🚫 Test 2: Foreign Key Constraint - Division with invalid branch');
        try {
            await executeQuery(`
                INSERT INTO Divisions (division_code, division_name, company_code, branch_code, is_active, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `, {}, ['TEST-INVALID', 'Invalid Division', 'RUXCHAI', 'INVALID-BRANCH', 1, 'test-user']);
            console.log('   ❌ FAILED: Should have rejected invalid branch_code');
        } catch (error) {
            console.log('   ✅ PASSED: Foreign key constraint enforced');
            console.log(`   Error: ${error.message}`);
        }
        console.log();
        
        // Test 3: Foreign Key Constraint - Try to create department with invalid division
        console.log('🚫 Test 3: Foreign Key Constraint - Department with invalid division');
        try {
            await executeQuery(`
                INSERT INTO Departments (department_code, department_name, division_code, is_active, created_by)
                VALUES (?, ?, ?, ?, ?)
            `, {}, ['TEST-INVALID', 'Invalid Department', 'INVALID-DIVISION', 1, 'test-user']);
            console.log('   ❌ FAILED: Should have rejected invalid division_code');
        } catch (error) {
            console.log('   ✅ PASSED: Foreign key constraint enforced');
            console.log(`   Error: ${error.message}`);
        }
        console.log();
        
        // Test 4: Primary Key Constraint - Try to create duplicate company
        console.log('🚫 Test 4: Primary Key Constraint - Duplicate company code');
        try {
            await executeQuery(`
                INSERT INTO Companies (company_code, company_name_th, is_active, created_by)
                VALUES (?, ?, ?, ?)
            `, {}, ['RUXCHAI', 'Duplicate Company', 1, 'test-user']);
            console.log('   ❌ FAILED: Should have rejected duplicate company_code');
        } catch (error) {
            console.log('   ✅ PASSED: Primary key constraint enforced');
            console.log(`   Error: ${error.message}`);
        }
        console.log();
        
        // Test 5: Unique Constraint - Try to create duplicate tax_id
        console.log('🚫 Test 5: Unique Constraint - Duplicate tax_id');
        try {
            await executeQuery(`
                INSERT INTO Companies (company_code, company_name_th, tax_id, is_active, created_by)
                VALUES (?, ?, ?, ?, ?)
            `, {}, ['TEST-COMPANY', 'Test Company', '0105561234567', 1, 'test-user']);
            console.log('   ❌ FAILED: Should have rejected duplicate tax_id');
        } catch (error) {
            console.log('   ✅ PASSED: Unique constraint enforced');
            console.log(`   Error: ${error.message}`);
        }
        console.log();
        
        // Test 6: Cascade Behavior - Try to delete company with dependent records
        console.log('🔗 Test 6: Cascade Behavior - Delete company with dependencies');
        
        // First, let's check what would happen if we try to delete a company
        const companyWithDeps = await executeQuery(`
            SELECT c.company_code, c.company_name_th,
                   COUNT(DISTINCT b.branch_code) as branch_count,
                   COUNT(DISTINCT d.division_code) as division_count,
                   COUNT(DISTINCT dept.department_code) as department_count
            FROM Companies c
            LEFT JOIN Branches b ON c.company_code = b.company_code
            LEFT JOIN Divisions d ON c.company_code = d.company_code
            LEFT JOIN Departments dept ON d.division_code = dept.division_code
            WHERE c.company_code = 'RUXCHAI'
            GROUP BY c.company_code, c.company_name_th
        `);
        
        if (companyWithDeps.recordset.length > 0) {
            const company = companyWithDeps.recordset[0];
            console.log(`   Company: ${company.company_name_th}`);
            console.log(`   - Branches: ${company.branch_count}`);
            console.log(`   - Divisions: ${company.division_count}`);
            console.log(`   - Departments: ${company.department_count}`);
        }
        
        try {
            await executeQuery(`DELETE FROM Companies WHERE company_code = 'RUXCHAI'`);
            console.log('   ❌ FAILED: Should have prevented deletion due to foreign key references');
        } catch (error) {
            console.log('   ✅ PASSED: Foreign key constraint prevented deletion');
            console.log(`   Error: ${error.message}`);
        }
        console.log();
        
        // Test 7: Data Integrity - Check organizational hierarchy consistency
        console.log('🏗️ Test 7: Data Integrity - Organizational hierarchy consistency');
        
        const hierarchyCheck = await executeQuery(`
            SELECT 
                dept.department_code,
                dept.department_name,
                div.division_code,
                div.division_name,
                div.company_code as div_company,
                b.company_code as branch_company,
                CASE 
                    WHEN div.company_code = b.company_code THEN 'CONSISTENT'
                    ELSE 'INCONSISTENT'
                END as consistency_status
            FROM Departments dept
            JOIN Divisions div ON dept.division_code = div.division_code
            JOIN Branches b ON div.branch_code = b.branch_code
            WHERE dept.is_active = 1
        `);
        
        console.log('   Checking hierarchy consistency:');
        let consistencyIssues = 0;
        hierarchyCheck.recordset.forEach(record => {
            if (record.consistency_status === 'INCONSISTENT') {
                console.log(`   ❌ INCONSISTENT: ${record.department_name} (Division company: ${record.div_company}, Branch company: ${record.branch_company})`);
                consistencyIssues++;
            } else {
                console.log(`   ✅ CONSISTENT: ${record.department_name}`);
            }
        });
        
        if (consistencyIssues === 0) {
            console.log('   ✅ All organizational hierarchies are consistent');
        } else {
            console.log(`   ⚠️  Found ${consistencyIssues} consistency issues`);
        }
        console.log();
        
        // Test 8: Test valid relationship creation
        console.log('✅ Test 8: Valid relationship creation');
        
        // Create test records following proper hierarchy
        const testCompanyCode = 'TEST-COMP-' + Date.now();
        const testBranchCode = 'TEST-BRANCH-' + Date.now();
        const testDivisionCode = 'TEST-DIV-' + Date.now();
        const testDepartmentCode = 'TEST-DEPT-' + Date.now();
        
        // Create company
        await executeQuery(`
            INSERT INTO Companies (company_code, company_name_th, is_active, created_by)
            VALUES (?, ?, ?, ?)
        `, {}, [testCompanyCode, 'บริษัททดสอบ', 1, 'test-user']);
        console.log(`   ✅ Created test company: ${testCompanyCode}`);
        
        // Create branch
        await executeQuery(`
            INSERT INTO Branches (branch_code, branch_name, company_code, is_active, created_by)
            VALUES (?, ?, ?, ?, ?)
        `, {}, [testBranchCode, 'สาขาทดสอบ', testCompanyCode, 1, 'test-user']);
        console.log(`   ✅ Created test branch: ${testBranchCode}`);
        
        // Create division
        await executeQuery(`
            INSERT INTO Divisions (division_code, division_name, company_code, branch_code, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `, {}, [testDivisionCode, 'ฝ่ายทดสอบ', testCompanyCode, testBranchCode, 1, 'test-user']);
        console.log(`   ✅ Created test division: ${testDivisionCode}`);
        
        // Create department
        await executeQuery(`
            INSERT INTO Departments (department_code, department_name, division_code, is_active, created_by)
            VALUES (?, ?, ?, ?, ?)
        `, {}, [testDepartmentCode, 'แผนกทดสอบ', testDivisionCode, 1, 'test-user']);
        console.log(`   ✅ Created test department: ${testDepartmentCode}`);
        
        // Verify the complete hierarchy
        const hierarchyVerification = await executeQuery(`
            SELECT 
                c.company_name_th,
                b.branch_name,
                d.division_name,
                dept.department_name
            FROM Departments dept
            JOIN Divisions d ON dept.division_code = d.division_code
            JOIN Branches b ON d.branch_code = b.branch_code
            JOIN Companies c ON d.company_code = c.company_code
            WHERE dept.department_code = ?
        `, {}, [testDepartmentCode]);
        
        if (hierarchyVerification.recordset.length > 0) {
            const hierarchy = hierarchyVerification.recordset[0];
            console.log('   ✅ Complete hierarchy verified:');
            console.log(`      Company: ${hierarchy.company_name_th}`);
            console.log(`      Branch: ${hierarchy.branch_name}`);
            console.log(`      Division: ${hierarchy.division_name}`);
            console.log(`      Department: ${hierarchy.department_name}`);
        }
        
        // Clean up test data (in reverse order to respect foreign keys)
        await executeQuery(`DELETE FROM Departments WHERE department_code = ?`, {}, [testDepartmentCode]);
        await executeQuery(`DELETE FROM Divisions WHERE division_code = ?`, {}, [testDivisionCode]);
        await executeQuery(`DELETE FROM Branches WHERE branch_code = ?`, {}, [testBranchCode]);
        await executeQuery(`DELETE FROM Companies WHERE company_code = ?`, {}, [testCompanyCode]);
        console.log('   ✅ Test data cleaned up successfully');
        console.log();
        
        console.log('✅ All constraint and relationship tests completed successfully!\n');
        
    } catch (error) {
        console.error('❌ Constraint test failed:', error);
    } finally {
        await closeDatabase();
        console.log('🔌 Database connection closed');
    }
}

// Run tests
testConstraintsAndRelationships();