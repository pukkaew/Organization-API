require('dotenv').config();
const { connectDatabase, executeQuery } = require('./src/config/database');

async function testCompanyQuery() {
    console.log('🔍 Testing Company.findPaginated Query...\n');
    
    try {
        await connectDatabase();
        console.log('✅ Connected to database');
        
        // Test 1: Count query (from Company.findPaginated)
        console.log('\n═══ 1. TESTING COUNT QUERY ═══');
        const countQuery = `
            SELECT COUNT(*) as total
            FROM Companies
            WHERE 1=1
        `;
        
        console.log('Query:', countQuery);
        
        try {
            const countResult = await executeQuery(countQuery, {});
            console.log('✅ Count query successful:', countResult.recordset[0]);
        } catch (error) {
            console.log('❌ Count query failed:', error.message);
            
            // Try with different table cases
            console.log('\n🔄 Trying with lowercase table name...');
            try {
                const lowerCountResult = await executeQuery(countQuery.replace('Companies', 'companies'), {});
                console.log('✅ Lowercase count query successful:', lowerCountResult.recordset[0]);
            } catch (lowerError) {
                console.log('❌ Lowercase count query also failed:', lowerError.message);
            }
        }
        
        // Test 2: Data query (from Company.findPaginated)
        console.log('\n═══ 2. TESTING DATA QUERY ═══');
        const dataQuery = `
            SELECT company_code, company_name_th, company_name_en, 
                   tax_id, is_active, created_date, created_by, 
                   updated_date, updated_by
            FROM Companies
            WHERE 1=1
            ORDER BY company_code OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY
        `;
        
        console.log('Query:', dataQuery);
        
        try {
            const dataResult = await executeQuery(dataQuery, { limit: 20, offset: 0 });
            console.log('✅ Data query successful:', `${dataResult.recordset.length} records`);
            if (dataResult.recordset.length > 0) {
                console.log('First record:', dataResult.recordset[0]);
            }
        } catch (error) {
            console.log('❌ Data query failed:', error.message);
        }
        
        // Test 3: Simple SELECT to verify table access
        console.log('\n═══ 3. TESTING SIMPLE SELECT ═══');
        const simpleQuery = 'SELECT TOP 1 * FROM Companies';
        
        try {
            const simpleResult = await executeQuery(simpleQuery);
            console.log('✅ Simple query successful:', simpleResult.recordset[0]);
        } catch (error) {
            console.log('❌ Simple query failed:', error.message);
        }
        
        // Test 4: Check current connection and database
        console.log('\n═══ 4. CONNECTION VERIFICATION ═══');
        
        try {
            const dbInfo = await executeQuery(`
                SELECT 
                    DB_NAME() as current_database,
                    @@SERVERNAME as server_name,
                    SYSTEM_USER as current_user
            `);
            
            const info = dbInfo.recordset[0];
            console.log('✅ Connection info:');
            console.log(`   Database: ${info.current_database}`);
            console.log(`   Server: ${info.server_name}`);
            console.log(`   User: ${info.current_user}`);
        } catch (error) {
            console.log('❌ Connection info failed:', error.message);
        }
        
        // Test 5: Check table existence with INFORMATION_SCHEMA
        console.log('\n═══ 5. TABLE EXISTENCE CHECK ═══');
        
        try {
            const tableCheck = await executeQuery(`
                SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME LIKE '%ompan%'
                ORDER BY TABLE_NAME
            `);
            
            console.log('✅ Tables matching "ompan":');
            tableCheck.recordset.forEach(table => {
                console.log(`   - ${table.TABLE_SCHEMA}.${table.TABLE_NAME} (${table.TABLE_TYPE})`);
            });
            
            if (tableCheck.recordset.length === 0) {
                console.log('   No tables found matching pattern');
            }
        } catch (error) {
            console.log('❌ Table check failed:', error.message);
        }
        
        // Test 6: Try Company model directly
        console.log('\n═══ 6. TESTING COMPANY MODEL ═══');
        
        try {
            const Company = require('./src/models/Company');
            console.log('🧪 Testing Company.findPaginated...');
            
            const result = await Company.findPaginated(1, 5, {});
            console.log('✅ Company.findPaginated successful:');
            console.log(`   Data: ${result.data.length} records`);
            console.log(`   Pagination:`, result.pagination);
            
            if (result.data.length > 0) {
                console.log('   First company:', {
                    code: result.data[0].company_code,
                    name_th: result.data[0].company_name_th,
                    name_en: result.data[0].company_name_en
                });
            }
        } catch (error) {
            console.log('❌ Company.findPaginated failed:', error.message);
            console.log('   Stack:', error.stack);
        }
        
    } catch (error) {
        console.error('❌ Critical error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testCompanyQuery();