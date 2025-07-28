require('dotenv').config();
const sql = require('mssql');
const logger = require('./src/utils/logger');

async function testServerDatabase() {
    console.log('🔍 Testing Server Database Connection (Exact Same Config)...\n');
    
    // Use exact same config as server
    const config = {
        server: process.env.DB_SERVER || 'localhost',
        port: parseInt(process.env.DB_PORT) || 1433,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        },
        options: {
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
            enableArithAbort: true
        }
    };
    
    console.log('📋 Database config:', {
        server: config.server,
        port: config.port,
        user: config.user,
        database: process.env.DB_DATABASE,
        encrypt: config.options.encrypt,
        trustServerCertificate: config.options.trustServerCertificate
    });
    
    let pool;
    try {
        // Step 1: Connect without database
        console.log('\n🔌 Step 1: Connecting without database...');
        pool = await sql.connect(config);
        console.log('✅ Connected to server');
        
        // Step 2: Switch to target database
        console.log('\n📂 Step 2: Switching to target database...');
        if (process.env.DB_DATABASE) {
            await pool.request().query(`USE [${process.env.DB_DATABASE}]`);
            console.log(`✅ Switched to database: ${process.env.DB_DATABASE}`);
        }
        
        // Step 3: Test SELECT DB_NAME()
        console.log('\n🔍 Step 3: Checking current database...');
        const dbResult = await pool.request().query('SELECT DB_NAME() as current_db');
        console.log('✅ Current database:', dbResult.recordset[0].current_db);
        
        // Step 4: Check table existence
        console.log('\n📊 Step 4: Checking table existence...');
        const tableResult = await pool.request().query(`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Companies'
        `);
        console.log('✅ Companies table exists:', tableResult.recordset.length > 0);
        if (tableResult.recordset.length > 0) {
            console.log('   Table info:', tableResult.recordset[0]);
        }
        
        // Step 5: Test Companies query
        console.log('\n💾 Step 5: Testing Companies query...');
        const companiesResult = await pool.request().query(`
            SELECT COUNT(*) as total FROM Companies
        `);
        console.log('✅ Companies count:', companiesResult.recordset[0].total);
        
        // Step 6: Test full Company.findPaginated query
        console.log('\n📋 Step 6: Testing exact Company.findPaginated query...');
        const exactQuery = `
            SELECT COUNT(*) as total
            FROM Companies
            WHERE 1=1
        `;
        const exactResult = await pool.request().query(exactQuery);
        console.log('✅ Exact count query:', exactResult.recordset[0].total);
        
        const dataQuery = `
            SELECT company_code, company_name_th, company_name_en, 
                   tax_id, is_active, created_date, created_by, 
                   updated_date, updated_by
            FROM Companies
            WHERE 1=1
            ORDER BY company_code OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
        `;
        const dataResult = await pool.request().query(dataQuery);
        console.log('✅ Exact data query:', dataResult.recordset.length, 'records');
        
        console.log('\n🎉 ALL TESTS PASSED - Database connection is working correctly');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('📊 Error details:', {
            code: error.code,
            number: error.number,
            state: error.state,
            serverName: error.serverName
        });
        console.error('🔍 Full stack:', error.stack);
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n🔌 Database connection closed');
        }
        process.exit(0);
    }
}

testServerDatabase();