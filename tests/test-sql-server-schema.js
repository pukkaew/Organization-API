// Check SQL Server Schema and Test with Correct Values
require('dotenv').config();
const sql = require('mssql');

async function checkSQLServerSchema() {
    console.log('🔍 Checking SQL Server Test Database Schema...\n');
    
    const config = {
        server: process.env.DB_SERVER,
        port: parseInt(process.env.DB_PORT) || 1433,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        },
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        }
    };
    
    try {
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server Test Database\n');
        
        // Check API_Keys table constraints
        console.log('🔒 Checking API_Keys table constraints...');
        const constraints = await pool.request().query(`
            SELECT 
                cc.CONSTRAINT_NAME,
                cc.CHECK_CLAUSE
            FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
            JOIN INFORMATION_SCHEMA.CONSTRAINT_TABLE_USAGE ctu 
                ON cc.CONSTRAINT_NAME = ctu.CONSTRAINT_NAME
            WHERE ctu.TABLE_NAME = 'API_Keys'
        `);
        
        if (constraints.recordset.length > 0) {
            console.log('   Found constraints:');
            constraints.recordset.forEach(constraint => {
                console.log(`   - ${constraint.CONSTRAINT_NAME}: ${constraint.CHECK_CLAUSE}`);
            });
        } else {
            console.log('   No constraints found');
        }
        console.log();
        
        // Check column definitions
        console.log('📋 Checking API_Keys column definitions...');
        const columns = await pool.request().query(`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'API_Keys'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('   Columns:');
        columns.recordset.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        console.log();
        
        // Try inserting with correct permissions
        console.log('✅ Testing API Keys insert with correct values...');
        
        // First check what permissions are allowed
        const permissionCheck = await pool.request().query(`
            SELECT name, definition 
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('API_Keys')
        `);
        
        if (permissionCheck.recordset.length > 0) {
            console.log('   Permission constraints:');
            permissionCheck.recordset.forEach(check => {
                console.log(`   - ${check.name}: ${check.definition}`);
            });
        }
        
        // Try inserting with valid permissions
        const validPermissions = ['read', 'write', 'admin'];
        console.log(`\n   Trying to insert API keys with permissions: ${validPermissions.join(', ')}`);
        
        try {
            await pool.request().query(`
                INSERT INTO API_Keys (api_key, api_key_hash, app_name, permissions, is_active, created_by, created_date) VALUES
                ('test-key-1', 'hash123', 'Test App 1', 'read', 1, 'admin', GETDATE())
            `);
            console.log('   ✅ API Key with "read" permission inserted successfully');
        } catch (error) {
            console.log(`   ❌ Failed to insert with "read": ${error.message}`);
        }
        
        try {
            await pool.request().query(`
                INSERT INTO API_Keys (api_key, api_key_hash, app_name, permissions, is_active, created_by, created_date) VALUES
                ('test-key-2', 'hash456', 'Test App 2', 'write', 1, 'admin', GETDATE())
            `);
            console.log('   ✅ API Key with "write" permission inserted successfully');
        } catch (error) {
            console.log(`   ❌ Failed to insert with "write": ${error.message}`);
        }
        
        try {
            await pool.request().query(`
                INSERT INTO API_Keys (api_key, api_key_hash, app_name, permissions, is_active, created_by, created_date) VALUES
                ('test-key-3', 'hash789', 'Test App 3', 'admin', 1, 'admin', GETDATE())
            `);
            console.log('   ✅ API Key with "admin" permission inserted successfully');
        } catch (error) {
            console.log(`   ❌ Failed to insert with "admin": ${error.message}`);
        }
        
        // Test the main functionality with current data
        console.log('\n🧪 Testing main database operations...\n');
        
        // Test company operations
        console.log('🏢 Testing company operations...');
        const companiesResult = await pool.request().query(`
            SELECT company_code, company_name_th, is_active, created_date 
            FROM Companies 
            WHERE is_active = 1
        `);
        
        console.log(`   ✅ Retrieved ${companiesResult.recordset.length} active companies:`);
        companiesResult.recordset.forEach(company => {
            console.log(`   - ${company.company_code}: ${company.company_name_th}`);
        });
        console.log();
        
        // Test hierarchy query
        console.log('🌳 Testing complete organizational hierarchy...');
        const hierarchyResult = await pool.request().query(`
            SELECT 
                c.company_code,
                c.company_name_th,
                b.branch_code,
                b.branch_name,
                d.division_code,
                d.division_name,
                dept.department_code,
                dept.department_name
            FROM Companies c
            LEFT JOIN Branches b ON c.company_code = b.company_code AND b.is_active = 1
            LEFT JOIN Divisions d ON b.branch_code = d.branch_code AND d.is_active = 1
            LEFT JOIN Departments dept ON d.division_code = dept.division_code AND dept.is_active = 1
            WHERE c.is_active = 1
            ORDER BY c.company_name_th, b.branch_name, d.division_name, dept.department_name
        `);
        
        console.log(`   ✅ Complete hierarchy (${hierarchyResult.recordset.length} records):`);
        
        let currentCompany = '';
        let currentBranch = '';
        let currentDivision = '';
        
        hierarchyResult.recordset.forEach(row => {
            if (row.company_code !== currentCompany) {
                console.log(`   🏢 ${row.company_name_th} (${row.company_code})`);
                currentCompany = row.company_code;
                currentBranch = '';
                currentDivision = '';
            }
            
            if (row.branch_code && row.branch_code !== currentBranch) {
                console.log(`      🏪 ${row.branch_name} (${row.branch_code})`);
                currentBranch = row.branch_code;
                currentDivision = '';
            }
            
            if (row.division_code && row.division_code !== currentDivision) {
                console.log(`         🏗️ ${row.division_name} (${row.division_code})`);
                currentDivision = row.division_code;
            }
            
            if (row.department_code) {
                console.log(`            🏛️ ${row.department_name} (${row.department_code})`);
            }
        });
        console.log();
        
        // Test CRUD operations with proper field sizes
        console.log('⚡ Testing CRUD operations...');
        const testCode = `TEST${Date.now().toString().slice(-6)}`;  // Shorter code
        
        try {
            // Create
            await pool.request()
                .input('code', sql.VarChar(50), testCode)
                .input('name', sql.NVarChar(200), 'Test Company')
                .input('active', sql.Bit, 1)
                .input('createdBy', sql.VarChar(100), 'test-user')
                .query(`
                    INSERT INTO Companies (company_code, company_name_th, is_active, created_by, created_date)
                    VALUES (@code, @name, @active, @createdBy, GETDATE())
                `);
            console.log('   ✅ CREATE: Test company created');
            
            // Read
            const readResult = await pool.request()
                .input('code', sql.VarChar(50), testCode)
                .query('SELECT * FROM Companies WHERE company_code = @code');
            
            if (readResult.recordset.length > 0) {
                console.log('   ✅ READ: Test company retrieved');
                console.log(`      Name: ${readResult.recordset[0].company_name_th}`);
                console.log(`      Created: ${readResult.recordset[0].created_date}`);
            }
            
            // Update
            await pool.request()
                .input('code', sql.VarChar(50), testCode)
                .input('name', sql.NVarChar(200), 'Test Company (Updated)')
                .input('updatedBy', sql.VarChar(100), 'test-user')
                .query(`
                    UPDATE Companies 
                    SET company_name_th = @name, updated_by = @updatedBy, updated_date = GETDATE()
                    WHERE company_code = @code
                `);
            console.log('   ✅ UPDATE: Test company updated');
            
            // Delete
            await pool.request()
                .input('code', sql.VarChar(50), testCode)
                .query('DELETE FROM Companies WHERE company_code = @code');
            console.log('   ✅ DELETE: Test company deleted');
            
        } catch (crudError) {
            console.log('   ❌ CRUD operations failed:', crudError.message);
        }
        
        await pool.close();
        console.log('\n✅ SQL Server Test Database verification completed!\n');
        
    } catch (error) {
        console.error('❌ Schema check failed:', error.message);
    }
}

// Run the check
checkSQLServerSchema();