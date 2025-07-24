const { executeQuery, connectDatabase } = require('./src/config/database');

async function testDB() {
    try {
        console.log('Connecting to database...');
        await connectDatabase();
        
        console.log('Checking existing test companies...');
        const result = await executeQuery('SELECT COUNT(*) as count FROM Companies WHERE company_code LIKE \'CRUDTEST%\'', {});
        console.log('Test companies found:', result.recordset[0].count);
        
        console.log('Creating test company directly...');
        const testResult = await executeQuery(`
            INSERT INTO Companies (company_code, company_name_th, company_name_en, tax_id, is_active, created_by)
            VALUES (@company_code, @company_name_th, @company_name_en, @tax_id, @is_active, @created_by)
        `, {
            company_code: 'DIRECTTEST123',
            company_name_th: 'ทดสอบโดยตรง',
            company_name_en: 'Direct Test',
            tax_id: '1234567890123',
            is_active: true,
            created_by: 'test'
        });
        console.log('Direct insert result:', testResult.rowsAffected);
        
        console.log('Checking if record was inserted...');
        const checkResult = await executeQuery('SELECT * FROM Companies WHERE company_code = @code', { code: 'DIRECTTEST123' });
        console.log('Found record:', checkResult.recordset.length > 0 ? 'YES' : 'NO');
        
        if (checkResult.recordset.length > 0) {
            console.log('Record data:', checkResult.recordset[0]);
        }
        
    } catch (error) {
        console.error('Database test failed:', error);
    }
}

testDB();