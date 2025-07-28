// Check table structure
require('dotenv').config();
const { executeQuery, connectDatabase, closeDatabase } = require('./src/config/database');

async function checkTableStructure() {
    try {
        console.log('🔍 Checking Companies table structure...');
        
        await connectDatabase();
        
        // Check columns
        const columnsQuery = `
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Companies'
            ORDER BY ORDINAL_POSITION
        `;
        
        const columns = await executeQuery(columnsQuery);
        console.log('📋 Columns in Companies table:');
        columns.recordset.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Try direct select
        console.log('\n🧪 Testing direct select...');
        const selectQuery = 'SELECT TOP 1 * FROM Companies';
        const selectResult = await executeQuery(selectQuery);
        console.log('✅ Select result:', selectResult.recordset);
        
        await closeDatabase();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

checkTableStructure();