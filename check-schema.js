const { executeQuery } = require('./src/config/database');

async function checkSchema() {
    try {
        console.log('=== Checking Database Schema ===');
        
        // Check the is_active column type
        const schemaQuery = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Companies' 
            AND COLUMN_NAME = 'is_active'
        `;
        
        const schemaResult = await executeQuery(schemaQuery);
        console.log('is_active column info:', schemaResult.recordset);
        
        // Check current values
        const dataQuery = `
            SELECT company_code, is_active, updated_date 
            FROM Companies 
            WHERE company_code = 'EDIT001'
        `;
        
        const dataResult = await executeQuery(dataQuery);
        console.log('Current EDIT001 data:', dataResult.recordset);
        
        // Try a simple update
        console.log('\nTesting simple update...');
        const updateQuery = `
            UPDATE Companies 
            SET is_active = 1, updated_date = GETDATE() 
            WHERE company_code = 'EDIT001'
        `;
        
        const updateResult = await executeQuery(updateQuery);
        console.log('Update result:', { rowsAffected: updateResult.rowsAffected });
        
        // Check result
        const checkResult = await executeQuery(dataQuery);
        console.log('After update:', checkResult.recordset);
        
    } catch (error) {
        console.error('Schema check error:', error.message);
    }
    
    process.exit(0);
}

// Wait for server connection
setTimeout(checkSchema, 1000);