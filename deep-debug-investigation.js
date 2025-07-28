require('dotenv').config();
const { connectDatabase, executeQuery } = require('./src/config/database');

async function deepDebugInvestigation() {
    console.log('🔍 DEEP DEBUG INVESTIGATION - Comprehensive Error Analysis\n');
    
    try {
        // 1. Environment Variables Check
        console.log('═══ 1. ENVIRONMENT VARIABLES ═══');
        console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`DB_TYPE: ${process.env.DB_TYPE}`);
        console.log(`DB_SERVER: ${process.env.DB_SERVER}`);
        console.log(`DB_DATABASE: ${process.env.DB_DATABASE}`);
        console.log(`USE_DATABASE: ${process.env.USE_DATABASE}`);
        console.log(`FORCE_MSSQL: ${process.env.FORCE_MSSQL}`);
        
        // 2. Database Logic Check
        console.log('\n═══ 2. DATABASE LOGIC CHECK ═══');
        const usingSQLite = process.env.FORCE_MSSQL === 'true' ? false : 
            (process.env.DB_TYPE === 'sqlite');
        const usingMSSQL = process.env.FORCE_MSSQL === 'true' || 
            (process.env.DB_TYPE === 'mssql' && process.env.DB_SERVER);
            
        console.log(`usingSQLite: ${usingSQLite}`);
        console.log(`usingMSSQL: ${usingMSSQL}`);
        console.log(`Should use MSSQL: ${!usingSQLite && usingMSSQL}`);
        
        // 3. Database Connection Test
        console.log('\n═══ 3. DATABASE CONNECTION TEST ═══');
        await connectDatabase();
        console.log('✅ Database connected successfully!');
        
        // 4. Current Database Test
        console.log('\n═══ 4. CURRENT DATABASE VERIFICATION ═══');
        try {
            const currentDB = await executeQuery('SELECT DB_NAME() as current_database');
            console.log(`Current Database: ${currentDB.recordset[0].current_database}`);
        } catch (error) {
            console.log(`❌ Current DB check failed: ${error.message}`);
        }
        
        // 5. Table Existence Check
        console.log('\n═══ 5. TABLE EXISTENCE CHECK ═══');
        try {
            const tables = await executeQuery(`
                SELECT TABLE_SCHEMA, TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_NAME
            `);
            
            console.log(`Found ${tables.recordset.length} tables:`);
            tables.recordset.forEach(table => {
                console.log(`   - ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
            });
            
            // Check specific tables
            const requiredTables = ['Companies', 'Branches', 'Divisions', 'Departments'];
            console.log('\nRequired tables check:');
            for (const tableName of requiredTables) {
                const exists = tables.recordset.some(t => t.TABLE_NAME === tableName);
                console.log(`   ${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'EXISTS' : 'MISSING'}`);
            }
            
        } catch (error) {
            console.log(`❌ Table check failed: ${error.message}`);
        }
        
        // 6. Direct Table Access Test
        console.log('\n═══ 6. DIRECT TABLE ACCESS TEST ═══');
        const testTables = ['Companies', 'Branches', 'Divisions', 'Departments'];
        
        for (const tableName of testTables) {
            try {
                console.log(`\n--- Testing ${tableName} ---`);
                const result = await executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
                console.log(`✅ ${tableName}: ${result.recordset[0].count} records`);
                
                // Get first few records
                const sample = await executeQuery(`SELECT TOP 3 * FROM ${tableName}`);
                if (sample.recordset.length > 0) {
                    console.log(`   Sample records:`);
                    sample.recordset.forEach((record, index) => {
                        const keys = Object.keys(record).slice(0, 3); // First 3 columns
                        const values = keys.map(key => `${key}: ${record[key]}`).join(', ');
                        console.log(`     ${index + 1}. ${values}`);
                    });
                }
                
            } catch (error) {
                console.log(`❌ ${tableName} access failed: ${error.message}`);
                
                // Try with different case
                try {
                    const lowerResult = await executeQuery(`SELECT COUNT(*) as count FROM ${tableName.toLowerCase()}`);
                    console.log(`✅ ${tableName.toLowerCase()}: ${lowerResult.recordset[0].count} records (lowercase worked)`);
                } catch (lowerError) {
                    console.log(`❌ ${tableName.toLowerCase()} also failed: ${lowerError.message}`);
                }
            }
        }
        
        // 7. Schema Information
        console.log('\n═══ 7. DETAILED SCHEMA INFORMATION ═══');
        try {
            const schemas = await executeQuery(`
                SELECT DISTINCT TABLE_SCHEMA 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
            `);
            
            console.log('Available schemas:');
            schemas.recordset.forEach(schema => {
                console.log(`   - ${schema.TABLE_SCHEMA}`);
            });
            
            // Check if tables are in a different schema
            const allTables = await executeQuery(`
                SELECT TABLE_SCHEMA, TABLE_NAME, 
                       CONCAT(TABLE_SCHEMA, '.', TABLE_NAME) as full_name
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                AND (TABLE_NAME LIKE '%ompan%' OR TABLE_NAME LIKE '%ranch%' 
                     OR TABLE_NAME LIKE '%ivision%' OR TABLE_NAME LIKE '%epartment%')
            `);
            
            console.log('\nTables with similar names:');
            allTables.recordset.forEach(table => {
                console.log(`   - ${table.full_name}`);
            });
            
        } catch (error) {
            console.log(`❌ Schema check failed: ${error.message}`);
        }
        
        // 8. Connection Pool Status
        console.log('\n═══ 8. CONNECTION POOL STATUS ═══');
        try {
            const poolInfo = await executeQuery(`
                SELECT 
                    @@SERVERNAME as server_name,
                    @@VERSION as sql_version,
                    DB_NAME() as current_db,
                    USER_NAME() as current_user,
                    @@SPID as connection_id
            `);
            
            const info = poolInfo.recordset[0];
            console.log(`Server: ${info.server_name}`);
            console.log(`Version: ${info.sql_version.substring(0, 100)}...`);
            console.log(`Database: ${info.current_db}`);
            console.log(`User: ${info.current_user}`);
            console.log(`Connection ID: ${info.connection_id}`);
            
        } catch (error) {
            console.log(`❌ Pool status check failed: ${error.message}`);
        }
        
        // 9. Test Model Functions
        console.log('\n═══ 9. MODEL FUNCTION TESTS ═══');
        try {
            console.log('Testing Company model...');
            const Company = require('./src/models/Company');
            const companies = await Company.findAll();
            console.log(`✅ Company.findAll(): ${companies.length} records`);
        } catch (error) {
            console.log(`❌ Company model failed: ${error.message}`);
            console.log(`Stack: ${error.stack}`);
        }
        
        try {
            console.log('Testing Branch model...');
            const Branch = require('./src/models/Branch');
            const branches = await Branch.findAll();
            console.log(`✅ Branch.findAll(): ${branches.length} records`);
        } catch (error) {
            console.log(`❌ Branch model failed: ${error.message}`);
        }
        
        try {
            console.log('Testing Division model...');
            const Division = require('./src/models/Division');
            const divisions = await Division.findAll();
            console.log(`✅ Division.findAll(): ${divisions.length} records`);
        } catch (error) {
            console.log(`❌ Division model failed: ${error.message}`);
        }
        
        try {
            console.log('Testing Department model...');
            const Department = require('./src/models/Department');
            const departments = await Department.findAll();
            console.log(`✅ Department.findAll(): ${departments.length} records`);
        } catch (error) {
            console.log(`❌ Department model failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

deepDebugInvestigation();