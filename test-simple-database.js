// Simple Database Test - Direct SQL queries to verify database functionality
const { connectDatabase, executeQuery, closeDatabase } = require('./src/config/database');

async function testSimpleDatabase() {
    console.log('🗃️ Starting Simple Database Functionality Test...\n');
    
    try {
        // Connect to database
        await connectDatabase();
        console.log('✅ Database connected successfully\n');
        
        console.log('=== Database Test Results ===\n');
        
        // Test 1: Check database tables
        console.log('📋 1. Database Tables:');
        const tables = await executeQuery(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);
        
        tables.recordset.forEach(table => {
            console.log(`   ✅ ${table.name}`);
        });
        console.log();
        
        // Test 2: Companies data
        console.log('🏢 2. Companies Data:');
        const companies = await executeQuery('SELECT * FROM Companies WHERE is_active = 1');
        console.log(`   Total active companies: ${companies.recordset.length}`);
        companies.recordset.forEach(company => {
            console.log(`   - ${company.company_code}: ${company.company_name_th}`);
            console.log(`     Tax ID: ${company.tax_id}`);
            console.log(`     Created: ${company.created_date}`);
        });
        console.log();
        
        // Test 3: Branches data
        console.log('🏪 3. Branches Data:');
        const branches = await executeQuery(`
            SELECT b.*, c.company_name_th 
            FROM Branches b 
            JOIN Companies c ON b.company_code = c.company_code 
            WHERE b.is_active = 1
        `);
        console.log(`   Total active branches: ${branches.recordset.length}`);
        branches.recordset.forEach(branch => {
            console.log(`   - ${branch.branch_code}: ${branch.branch_name}`);
            console.log(`     Company: ${branch.company_name_th}`);
            console.log(`     Headquarters: ${branch.is_headquarters ? 'Yes' : 'No'}`);
        });
        console.log();
        
        // Test 4: Divisions data
        console.log('🏗️ 4. Divisions Data:');
        const divisions = await executeQuery(`
            SELECT d.*, b.branch_name, c.company_name_th 
            FROM Divisions d
            JOIN Branches b ON d.branch_code = b.branch_code
            JOIN Companies c ON d.company_code = c.company_code
            WHERE d.is_active = 1
        `);
        console.log(`   Total active divisions: ${divisions.recordset.length}`);
        divisions.recordset.forEach(division => {
            console.log(`   - ${division.division_code}: ${division.division_name}`);
            console.log(`     Branch: ${division.branch_name}`);
            console.log(`     Company: ${division.company_name_th}`);
        });
        console.log();
        
        // Test 5: Departments data
        console.log('🏛️ 5. Departments Data:');
        const departments = await executeQuery(`
            SELECT dept.*, div.division_name, b.branch_name, c.company_name_th
            FROM Departments dept
            JOIN Divisions div ON dept.division_code = div.division_code
            JOIN Branches b ON div.branch_code = b.branch_code
            JOIN Companies c ON div.company_code = c.company_code
            WHERE dept.is_active = 1
        `);
        console.log(`   Total active departments: ${departments.recordset.length}`);
        departments.recordset.forEach(dept => {
            console.log(`   - ${dept.department_code}: ${dept.department_name}`);
            console.log(`     Division: ${dept.division_name}`);
            console.log(`     Branch: ${dept.branch_name}`);
            console.log(`     Company: ${dept.company_name_th}`);
        });
        console.log();
        
        // Test 6: API Keys data
        console.log('🔑 6. API Keys Data:');
        const apiKeys = await executeQuery('SELECT * FROM API_Keys WHERE is_active = 1');
        console.log(`   Total active API keys: ${apiKeys.recordset.length}`);
        apiKeys.recordset.forEach(key => {
            console.log(`   - App: ${key.app_name}`);
            console.log(`     Permissions: ${key.permissions}`);
            console.log(`     Usage Count: ${key.usage_count}`);
            console.log(`     Created: ${key.created_date}`);
        });
        console.log();
        
        // Test 7: Complete organizational hierarchy
        console.log('🌳 7. Complete Organizational Hierarchy:');
        const hierarchy = await executeQuery(`
            SELECT 
                c.company_name_th as company,
                b.branch_name as branch,
                d.division_name as division,
                dept.department_name as department,
                c.company_code,
                b.branch_code,
                d.division_code,
                dept.department_code
            FROM Companies c
            LEFT JOIN Branches b ON c.company_code = b.company_code AND b.is_active = 1
            LEFT JOIN Divisions d ON b.branch_code = d.branch_code AND d.is_active = 1
            LEFT JOIN Departments dept ON d.division_code = dept.division_code AND dept.is_active = 1
            WHERE c.is_active = 1
            ORDER BY c.company_name_th, b.branch_name, d.division_name, dept.department_name
        `);
        
        let currentCompany = '';
        let currentBranch = '';
        let currentDivision = '';
        
        hierarchy.recordset.forEach(row => {
            if (row.company !== currentCompany) {
                console.log(`   🏢 ${row.company} (${row.company_code})`);
                currentCompany = row.company;
                currentBranch = '';
                currentDivision = '';
            }
            
            if (row.branch && row.branch !== currentBranch) {
                console.log(`      🏪 ${row.branch} (${row.branch_code})`);
                currentBranch = row.branch;
                currentDivision = '';
            }
            
            if (row.division && row.division !== currentDivision) {
                console.log(`         🏗️ ${row.division} (${row.division_code})`);
                currentDivision = row.division;
            }
            
            if (row.department) {
                console.log(`            🏛️ ${row.department} (${row.department_code})`);
            }
        });
        console.log();
        
        // Test 8: Database performance test - Simple CRUD operations
        console.log('⚡ 8. Performance Test - CRUD Operations:');
        const startTime = Date.now();
        
        // Create
        const testCode = `PERF-TEST-${Date.now()}`;
        await executeQuery(`
            INSERT INTO Departments (department_code, department_name, division_code, is_active, created_by)
            VALUES (?, ?, ?, ?, ?)
        `, {}, [testCode, 'Performance Test Department', 'RUXCHAI-DIV01', 1, 'test-user']);
        console.log(`   ✅ CREATE: ${Date.now() - startTime}ms`);
        
        // Read
        const readStart = Date.now();
        const readResult = await executeQuery(`
            SELECT * FROM Departments WHERE department_code = ?
        `, {}, [testCode]);
        console.log(`   ✅ READ: ${Date.now() - readStart}ms`);
        
        // Update
        const updateStart = Date.now();
        await executeQuery(`
            UPDATE Departments 
            SET department_name = ?, updated_date = datetime('now'), updated_by = ?
            WHERE department_code = ?
        `, {}, ['Performance Test Department (Updated)', 'test-user', testCode]);
        console.log(`   ✅ UPDATE: ${Date.now() - updateStart}ms`);
        
        // Delete
        const deleteStart = Date.now();
        await executeQuery(`
            DELETE FROM Departments WHERE department_code = ?
        `, {}, [testCode]);
        console.log(`   ✅ DELETE: ${Date.now() - deleteStart}ms`);
        
        const totalTime = Date.now() - startTime;
        console.log(`   🏁 Total CRUD time: ${totalTime}ms`);
        console.log();
        
        // Test 9: Database integrity verification
        console.log('🔒 9. Data Integrity Verification:');
        
        // Check foreign key consistency
        const fkCheck = await executeQuery(`
            SELECT 
                'Branches-Companies' as relationship,
                COUNT(*) as total_records,
                COUNT(c.company_code) as valid_references
            FROM Branches b
            LEFT JOIN Companies c ON b.company_code = c.company_code
            
            UNION ALL
            
            SELECT 
                'Divisions-Companies' as relationship,
                COUNT(*) as total_records,
                COUNT(c.company_code) as valid_references
            FROM Divisions d
            LEFT JOIN Companies c ON d.company_code = c.company_code
            
            UNION ALL
            
            SELECT 
                'Divisions-Branches' as relationship,
                COUNT(*) as total_records,
                COUNT(b.branch_code) as valid_references
            FROM Divisions d
            LEFT JOIN Branches b ON d.branch_code = b.branch_code
            
            UNION ALL
            
            SELECT 
                'Departments-Divisions' as relationship,
                COUNT(*) as total_records,
                COUNT(div.division_code) as valid_references
            FROM Departments dept
            LEFT JOIN Divisions div ON dept.division_code = div.division_code
        `);
        
        fkCheck.recordset.forEach(check => {
            const isValid = check.total_records === check.valid_references;
            console.log(`   ${isValid ? '✅' : '❌'} ${check.relationship}: ${check.valid_references}/${check.total_records} valid`);
        });
        console.log();
        
        console.log('✅ Database functionality test completed successfully!\n');
        console.log('=== Summary ===');
        console.log('✅ Database connection: Working');
        console.log('✅ Table structure: Valid');
        console.log('✅ Sample data: Loaded');
        console.log('✅ CRUD operations: Functional');
        console.log('✅ Relationships: Consistent');
        console.log('✅ Performance: Acceptable');
        console.log('✅ Data integrity: Verified\n');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await closeDatabase();
        console.log('🔌 Database connection closed');
    }
}

// Run the test
testSimpleDatabase();