// =============================================
// Check Database Data - Node.js
// Organization Structure Management System  
// =============================================

// Load environment variables
require('dotenv').config();

const { executeQuery, connectDatabase, closeDatabase } = require('../../src/config/database');

async function checkDatabaseData() {
    try {
        console.log('🔍 Checking database data...');
        
        // Connect to database
        await connectDatabase();
        console.log('✅ Database connected');
        
        // Check all tables data
        const tables = [
            { name: 'Companies', query: 'SELECT * FROM [dbo].[Companies]' },
            { name: 'Branches', query: 'SELECT * FROM [dbo].[Branches]' },
            { name: 'Divisions', query: 'SELECT * FROM [dbo].[Divisions]' },
            { name: 'Departments', query: 'SELECT * FROM [dbo].[Departments]' },
            { name: 'API_Keys', query: 'SELECT api_key_id, app_name, description, permissions, is_active, created_date FROM [dbo].[API_Keys]' }
        ];
        
        for (const table of tables) {
            try {
                const result = await executeQuery(table.query);
                console.log(`\n📊 ${table.name} (${result.recordset.length} records):`);
                console.log('========================================');
                
                if (result.recordset.length > 0) {
                    result.recordset.forEach((record, index) => {
                        console.log(`${index + 1}.`, JSON.stringify(record, null, 2));
                    });
                } else {
                    console.log('  No records found');
                }
            } catch (error) {
                console.log(`  ❌ Error checking ${table.name}:`, error.message);
            }
        }
        
        // Test organization structure relationships
        console.log('\n🏗️  Organization Structure Test:');
        console.log('========================================');
        
        try {
            const structureQuery = `
                SELECT 
                    c.company_code,
                    c.company_name_th,
                    b.branch_code,
                    b.branch_name,
                    b.is_headquarters,
                    d.division_code,
                    d.division_name,
                    dp.department_code,
                    dp.department_name
                FROM [dbo].[Companies] c
                LEFT JOIN [dbo].[Branches] b ON c.company_code = b.company_code
                LEFT JOIN [dbo].[Divisions] d ON c.company_code = d.company_code 
                    AND (b.branch_code IS NULL OR b.branch_code = d.branch_code)
                LEFT JOIN [dbo].[Departments] dp ON d.division_code = dp.division_code
                WHERE c.company_code = 'TEST001'
                ORDER BY c.company_code, b.branch_code, d.division_code, dp.department_code
            `;
            
            const result = await executeQuery(structureQuery);
            if (result.recordset.length > 0) {
                console.log('✅ Organization structure for TEST001:');
                result.recordset.forEach(record => {
                    console.log(`  Company: ${record.company_code} (${record.company_name_th})`);
                    if (record.branch_code) {
                        console.log(`    └─ Branch: ${record.branch_code} (${record.branch_name}) ${record.is_headquarters ? '[HQ]' : ''}`);
                    }
                    if (record.division_code) {
                        console.log(`      └─ Division: ${record.division_code} (${record.division_name})`);
                    }
                    if (record.department_code) {
                        console.log(`        └─ Department: ${record.department_code} (${record.department_name})`);
                    }
                });
            } else {
                console.log('❌ No organization structure found for TEST001');
            }
        } catch (error) {
            console.log('❌ Error checking organization structure:', error.message);
        }
        
        console.log('\n🎉 Database data check completed!');
        
    } catch (error) {
        console.error('❌ Error during check:', error);
        throw error;
    } finally {
        // Close database connection
        try {
            await closeDatabase();
            console.log('✅ Database connection closed');
        } catch (error) {
            console.error('⚠️  Error closing database:', error);
        }
    }
}

// Run check if called directly
if (require.main === module) {
    checkDatabaseData()
        .then(() => {
            console.log('\n🏁 Check process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Check process failed:', error);
            process.exit(1);
        });
}

module.exports = { checkDatabaseData };