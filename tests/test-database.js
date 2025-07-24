// Database Test Script
const { connectDatabase, executeQuery, closeDatabase } = require('./src/config/database');

async function testDatabaseOperations() {
    console.log('🚀 Starting Database Tests...\n');
    
    try {
        // Connect to database
        await connectDatabase();
        console.log('✅ Database connected successfully\n');
        
        // Test 1: Get all companies
        console.log('📊 Test 1: Get all companies');
        const companies = await executeQuery('SELECT * FROM Companies WHERE is_active = 1');
        console.log(`   Found ${companies.recordset.length} companies:`);
        companies.recordset.forEach(company => {
            console.log(`   - ${company.company_code}: ${company.company_name_th}`);
        });
        console.log();
        
        // Test 2: Get branches with company info
        console.log('🏢 Test 2: Get branches with company info');
        const branches = await executeQuery(`
            SELECT b.*, c.company_name_th 
            FROM Branches b 
            JOIN Companies c ON b.company_code = c.company_code 
            WHERE b.is_active = 1
        `);
        console.log(`   Found ${branches.recordset.length} branches:`);
        branches.recordset.forEach(branch => {
            console.log(`   - ${branch.branch_code}: ${branch.branch_name} (${branch.company_name_th})`);
        });
        console.log();
        
        // Test 3: Get divisions with hierarchy
        console.log('🏗️ Test 3: Get divisions with hierarchy');
        const divisions = await executeQuery(`
            SELECT d.*, b.branch_name, c.company_name_th 
            FROM Divisions d
            JOIN Branches b ON d.branch_code = b.branch_code
            JOIN Companies c ON d.company_code = c.company_code
            WHERE d.is_active = 1
        `);
        console.log(`   Found ${divisions.recordset.length} divisions:`);
        divisions.recordset.forEach(division => {
            console.log(`   - ${division.division_code}: ${division.division_name} (${division.branch_name})`);
        });
        console.log();
        
        // Test 4: Get departments with full hierarchy
        console.log('🏛️ Test 4: Get departments with full hierarchy');
        const departments = await executeQuery(`
            SELECT dept.*, div.division_name, b.branch_name, c.company_name_th
            FROM Departments dept
            JOIN Divisions div ON dept.division_code = div.division_code
            JOIN Branches b ON div.branch_code = b.branch_code
            JOIN Companies c ON div.company_code = c.company_code
            WHERE dept.is_active = 1
        `);
        console.log(`   Found ${departments.recordset.length} departments:`);
        departments.recordset.forEach(dept => {
            console.log(`   - ${dept.department_code}: ${dept.department_name}`);
            console.log(`     └── Division: ${dept.division_name}`);
            console.log(`     └── Branch: ${dept.branch_name}`);
            console.log(`     └── Company: ${dept.company_name_th}\n`);
        });
        
        // Test 5: Create a new department
        console.log('➕ Test 5: Create new department');
        const newDeptCode = 'TEST-DEPT-' + Date.now();
        const insertResult = await executeQuery(`
            INSERT INTO Departments (department_code, department_name, division_code, is_active, created_by)
            VALUES (?, ?, ?, ?, ?)
        `, {}, [newDeptCode, 'แผนกทดสอบ', 'RUXCHAI-DIV01', 1, 'test-user']);
        
        console.log(`   ✅ Created department: ${newDeptCode}`);
        console.log(`   Rows affected: ${insertResult.rowsAffected[0]}`);
        console.log();
        
        // Test 6: Update the new department
        console.log('✏️ Test 6: Update department');
        const updateResult = await executeQuery(`
            UPDATE Departments 
            SET department_name = ?, updated_date = datetime('now'), updated_by = ?
            WHERE department_code = ?
        `, {}, ['แผนกทดสอบ (อัพเดท)', 'test-user', newDeptCode]);
        
        console.log(`   ✅ Updated department: ${newDeptCode}`);
        console.log(`   Rows affected: ${updateResult.rowsAffected[0]}`);
        console.log();
        
        // Test 7: Verify the update
        console.log('🔍 Test 7: Verify update');
        const verifyResult = await executeQuery(`
            SELECT * FROM Departments WHERE department_code = ?
        `, {}, [newDeptCode]);
        
        if (verifyResult.recordset.length > 0) {
            const dept = verifyResult.recordset[0];
            console.log(`   ✅ Department found: ${dept.department_name}`);
            console.log(`   Created: ${dept.created_date}`);
            console.log(`   Updated: ${dept.updated_date}`);
        }
        console.log();
        
        // Test 8: Delete the test department
        console.log('🗑️ Test 8: Delete test department');
        const deleteResult = await executeQuery(`
            DELETE FROM Departments WHERE department_code = ?
        `, {}, [newDeptCode]);
        
        console.log(`   ✅ Deleted department: ${newDeptCode}`);
        console.log(`   Rows affected: ${deleteResult.rowsAffected[0]}`);
        console.log();
        
        console.log('✅ All database tests completed successfully!\n');
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        await closeDatabase();
        console.log('🔌 Database connection closed');
    }
}

// Run tests
testDatabaseOperations();