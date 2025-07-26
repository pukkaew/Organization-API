require('dotenv').config();
const { connectDatabase, executeQuery } = require('../../src/config/database');

async function testDatabaseSwitch() {
    try {
        console.log('🔌 Connecting to MSSQL...');
        await connectDatabase();
        
        console.log('📊 Checking current database...');
        const currentDB = await executeQuery('SELECT DB_NAME() as current_database');
        console.log('Current Database:', currentDB.recordset[0].current_database);
        
        console.log('📋 Listing available databases...');
        const databases = await executeQuery(`
            SELECT name FROM sys.databases 
            WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
            ORDER BY name
        `);
        console.log('Available Databases:');
        databases.recordset.forEach(db => console.log(`  - ${db.name}`));
        
        // Try to switch to the target database directly
        console.log(`\\n🔄 Attempting to switch to ${process.env.DB_DATABASE}...`);
        try {
            await executeQuery(`USE [${process.env.DB_DATABASE}]`);
            console.log(`✅ Successfully switched to ${process.env.DB_DATABASE}`);
            
            // Check current database again
            const newDB = await executeQuery('SELECT DB_NAME() as current_database');
            console.log('New Current Database:', newDB.recordset[0].current_database);
            
        } catch (switchError) {
            console.log(`❌ Could not switch to ${process.env.DB_DATABASE}:`, switchError.message);
        }
        
        // Check if tables exist in current database
        console.log('\\n📋 Checking tables in current database...');
        try {
            const tables = await executeQuery(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_NAME
            `);
            
            if (tables.recordset.length > 0) {
                console.log('Tables found:');
                tables.recordset.forEach(table => console.log(`  - ${table.TABLE_NAME}`));
            } else {
                console.log('No tables found in current database');
            }
        } catch (tableError) {
            console.log('Could not list tables:', tableError.message);
        }
        
        // Check OrgStructureDB specifically
        console.log(`\\n🎯 Checking tables in OrgStructureDB...`);
        try {
            const orgTables = await executeQuery(`
                SELECT TABLE_NAME 
                FROM [OrgStructureDB].INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_NAME
            `);
            
            if (orgTables.recordset.length > 0) {
                console.log('Tables in OrgStructureDB:');
                orgTables.recordset.forEach(table => console.log(`  - ${table.TABLE_NAME}`));
                
                // Try to count companies
                try {
                    const companyCount = await executeQuery('SELECT COUNT(*) as count FROM [OrgStructureDB].[dbo].[Companies]');
                    console.log(`Companies count: ${companyCount.recordset[0].count}`);
                } catch (countError) {
                    console.log('Could not count companies:', countError.message);
                }
            } else {
                console.log('No tables found in OrgStructureDB');
            }
        } catch (orgError) {
            console.log('Could not access OrgStructureDB:', orgError.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDatabaseSwitch();