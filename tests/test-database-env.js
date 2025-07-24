// Test Database Connection based on .env configuration
require('dotenv').config();
const sql = require('mssql');
const { connectDatabase, executeQuery, closeDatabase } = require('./src/config/database');

async function testDatabaseEnvironment() {
    console.log('🔧 Testing Database Configuration from .env...\n');
    
    // Show current configuration
    console.log('📋 Current Configuration:');
    console.log(`   DB_TYPE: ${process.env.DB_TYPE}`);
    console.log(`   DB_SERVER: ${process.env.DB_SERVER}`);
    console.log(`   DB_DATABASE: ${process.env.DB_DATABASE}`);
    console.log(`   DB_USER: ${process.env.DB_USER}`);
    console.log(`   DB_PORT: ${process.env.DB_PORT}`);
    console.log(`   USE_DATABASE: ${process.env.USE_DATABASE}`);
    console.log();
    
    // Determine which database system to test
    const useSQL = process.env.DB_TYPE !== 'sqlite' && process.env.DB_SERVER && process.env.DB_SERVER !== 'localhost';
    
    if (useSQL) {
        console.log('🗄️  Testing SQL Server Connection...\n');
        await testSQLServerConnection();
    } else {
        console.log('📁 Testing SQLite Connection...\n');
        await testSQLiteConnection();
    }
}

async function testSQLServerConnection() {
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
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || true,
            enableArithAbort: true
        }
    };
    
    try {
        console.log('🔌 Attempting SQL Server connection...');
        console.log(`   Server: ${config.server}:${config.port}`);
        console.log(`   Database: ${config.database}`);
        console.log(`   User: ${config.user}`);
        
        const pool = await sql.connect(config);
        console.log('✅ SQL Server connection successful!\n');
        
        // Test basic query
        console.log('📊 Testing basic queries...');
        
        // Check if database exists and accessible
        const dbCheck = await pool.request().query(`
            SELECT DB_NAME() as current_database, @@VERSION as sql_version
        `);
        
        console.log(`   ✅ Connected to database: ${dbCheck.recordset[0].current_database}`);
        console.log(`   ✅ SQL Server version: ${dbCheck.recordset[0].sql_version.split('\n')[0]}`);
        console.log();
        
        // Check tables
        console.log('📋 Checking database tables...');
        const tablesCheck = await pool.request().query(`
            SELECT TABLE_NAME, TABLE_TYPE 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        
        if (tablesCheck.recordset.length > 0) {
            console.log(`   ✅ Found ${tablesCheck.recordset.length} tables:`);
            tablesCheck.recordset.forEach(table => {
                console.log(`      - ${table.TABLE_NAME}`);
            });
        } else {
            console.log('   ⚠️  No tables found in database');
        }
        console.log();
        
        // Test sample data if tables exist
        const organizationTables = ['Companies', 'Branches', 'Divisions', 'Departments'];
        console.log('📈 Checking sample data...');
        
        for (const tableName of organizationTables) {
            try {
                const countResult = await pool.request().query(`
                    SELECT COUNT(*) as record_count FROM [${tableName}]
                `);
                console.log(`   - ${tableName}: ${countResult.recordset[0].record_count} records`);
            } catch (error) {
                console.log(`   - ${tableName}: Table not found or error`);
            }
        }
        console.log();
        
        // Test a simple CRUD operation
        console.log('⚡ Testing CRUD operations...');
        
        const testCode = `SQL-TEST-${Date.now()}`;
        
        try {
            // Create
            await pool.request()
                .input('code', sql.VarChar, testCode)
                .input('name', sql.NVarChar, 'Test Company from ENV')
                .input('active', sql.Bit, 1)
                .input('createdBy', sql.VarChar, 'env-test')
                .query(`
                    INSERT INTO Companies (company_code, company_name_th, is_active, created_by, created_date)
                    VALUES (@code, @name, @active, @createdBy, GETDATE())
                `);
            console.log('   ✅ CREATE: Test company created');
            
            // Read
            const readResult = await pool.request()
                .input('code', sql.VarChar, testCode)
                .query('SELECT * FROM Companies WHERE company_code = @code');
            
            if (readResult.recordset.length > 0) {
                console.log('   ✅ READ: Test company retrieved');
                console.log(`      Name: ${readResult.recordset[0].company_name_th}`);
                console.log(`      Created: ${readResult.recordset[0].created_date}`);
            }
            
            // Update
            await pool.request()
                .input('code', sql.VarChar, testCode)
                .input('name', sql.NVarChar, 'Test Company from ENV (Updated)')
                .input('updatedBy', sql.VarChar, 'env-test')
                .query(`
                    UPDATE Companies 
                    SET company_name_th = @name, updated_by = @updatedBy, updated_date = GETDATE()
                    WHERE company_code = @code
                `);
            console.log('   ✅ UPDATE: Test company updated');
            
            // Delete
            await pool.request()
                .input('code', sql.VarChar, testCode)
                .query('DELETE FROM Companies WHERE company_code = @code');
            console.log('   ✅ DELETE: Test company deleted');
            
        } catch (crudError) {
            console.log('   ⚠️  CRUD operations failed (tables may not exist yet)');
            console.log(`   Error: ${crudError.message}`);
        }
        
        await pool.close();
        console.log('\n✅ SQL Server testing completed successfully!\n');
        
    } catch (error) {
        console.error('❌ SQL Server connection failed:', error.message);
        console.error('   Please check:');
        console.error('   - Server address and port');
        console.error('   - Database credentials');
        console.error('   - Network connectivity');
        console.error('   - Firewall settings');
        console.log();
    }
}

async function testSQLiteConnection() {
    try {
        console.log('🔌 Testing SQLite connection via config...');
        
        await connectDatabase();
        console.log('✅ SQLite connection successful!\n');
        
        // Test queries using the existing database config
        console.log('📊 Testing database queries...');
        
        // Check tables
        const tables = await executeQuery(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);
        
        console.log(`   ✅ Found ${tables.recordset.length} tables:`);
        tables.recordset.forEach(table => {
            console.log(`      - ${table.name}`);
        });
        console.log();
        
        // Check sample data
        const organizationTables = ['Companies', 'Branches', 'Divisions', 'Departments'];
        console.log('📈 Checking sample data...');
        
        for (const tableName of organizationTables) {
            try {
                const countResult = await executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
                console.log(`   - ${tableName}: ${countResult.recordset[0].count} records`);
            } catch (error) {
                console.log(`   - ${tableName}: Error or table not found`);
            }
        }
        console.log();
        
        // Test CRUD operations
        console.log('⚡ Testing CRUD operations...');
        const testCode = `SQLITE-TEST-${Date.now()}`;
        
        try {
            // Create
            await executeQuery(`
                INSERT INTO Companies (company_code, company_name_th, is_active, created_by, created_date)
                VALUES (?, ?, ?, ?, datetime('now'))
            `, {}, [testCode, 'Test Company from SQLite ENV', 1, 'env-test']);
            console.log('   ✅ CREATE: Test company created');
            
            // Read
            const readResult = await executeQuery(
                'SELECT * FROM Companies WHERE company_code = ?',
                {}, [testCode]
            );
            
            if (readResult.recordset.length > 0) {
                console.log('   ✅ READ: Test company retrieved');
                console.log(`      Name: ${readResult.recordset[0].company_name_th}`);
                console.log(`      Created: ${readResult.recordset[0].created_date}`);
            }
            
            // Update
            await executeQuery(`
                UPDATE Companies 
                SET company_name_th = ?, updated_by = ?, updated_date = datetime('now')
                WHERE company_code = ?
            `, {}, ['Test Company from SQLite ENV (Updated)', 'env-test', testCode]);
            console.log('   ✅ UPDATE: Test company updated');
            
            // Delete
            await executeQuery('DELETE FROM Companies WHERE company_code = ?', {}, [testCode]);
            console.log('   ✅ DELETE: Test company deleted');
            
        } catch (crudError) {
            console.log('   ⚠️  CRUD operations failed');
            console.log(`   Error: ${crudError.message}`);
        }
        
        await closeDatabase();
        console.log('\n✅ SQLite testing completed successfully!\n');
        
    } catch (error) {
        console.error('❌ SQLite connection failed:', error.message);
    }
}

// Run the test
testDatabaseEnvironment();