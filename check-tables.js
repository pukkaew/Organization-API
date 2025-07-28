// Check what tables exist in database
require('dotenv').config();
const { executeQuery, connectDatabase, closeDatabase } = require('./src/config/database');

async function checkTables() {
    try {
        console.log('🔍 Checking existing tables in MSSQL database...');
        
        await connectDatabase();
        
        const query = `
            SELECT TABLE_NAME, TABLE_SCHEMA 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `;
        
        const result = await executeQuery(query);
        console.log('📋 Tables found:');
        
        if (result?.recordset?.length > 0) {
            result.recordset.forEach(table => {
                console.log(`  - ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
            });
        } else {
            console.log('  No tables found');
        }
        
        await closeDatabase();
        
    } catch (error) {
        console.error('❌ Error checking tables:', error);
    }
}

checkTables();