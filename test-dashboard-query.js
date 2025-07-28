require('dotenv').config();
const { connectDatabase, executeQuery } = require('./src/config/database');

async function testDashboardQuery() {
    console.log('🔍 Testing Dashboard Organization Stats Query...\n');
    
    try {
        await connectDatabase();
        console.log('✅ Connected to database');
        
        // Test the exact query from organizationService
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM Companies WHERE is_active = 1) as totalCompanies,
                (SELECT COUNT(*) FROM Branches WHERE is_active = 1) as totalBranches,
                (SELECT COUNT(*) FROM Divisions WHERE is_active = 1) as totalDivisions,
                (SELECT COUNT(*) FROM Departments WHERE is_active = 1) as totalDepartments,
                (SELECT COUNT(*) FROM Divisions WHERE is_active = 1) as active_divisions,
                (SELECT COUNT(*) FROM Branches WHERE is_headquarters = 1 AND is_active = 1) as headquarters_count
        `;
        
        console.log('🧪 Testing organization stats query...');
        console.log('Query:', query);
        
        const result = await executeQuery(query);
        
        console.log('\n✅ Query successful!');
        console.log('Result:', result.recordset[0]);
        
        // Test individual queries to isolate the issue
        console.log('\n🔍 Testing individual table queries...');
        
        const tables = ['Companies', 'Branches', 'Divisions', 'Departments'];
        
        for (const table of tables) {
            try {
                console.log(`\n--- Testing ${table} ---`);
                
                // Test basic count
                const basicCount = await executeQuery(`SELECT COUNT(*) as total FROM ${table}`);
                console.log(`✅ Total ${table}: ${basicCount.recordset[0].total}`);
                
                // Test with is_active filter
                const activeCount = await executeQuery(`SELECT COUNT(*) as active FROM ${table} WHERE is_active = 1`);
                console.log(`✅ Active ${table}: ${activeCount.recordset[0].active}`);
                
                // Test subquery format
                const subqueryCount = await executeQuery(`SELECT (SELECT COUNT(*) FROM ${table} WHERE is_active = 1) as count`);
                console.log(`✅ Subquery ${table}: ${subqueryCount.recordset[0].count}`);
                
            } catch (error) {
                console.log(`❌ ${table} failed: ${error.message}`);
            }
        }
        
        // Test Branches headquarters query
        console.log('\n--- Testing Branches Headquarters ---');
        try {
            const hqCount = await executeQuery(`
                SELECT COUNT(*) as hq_count 
                FROM Branches 
                WHERE is_headquarters = 1 AND is_active = 1
            `);
            console.log(`✅ Headquarters count: ${hqCount.recordset[0].hq_count}`);
        } catch (error) {
            console.log(`❌ Headquarters query failed: ${error.message}`);
        }
        
        // Test the exact organizationService function
        console.log('\n--- Testing OrganizationService ---');
        try {
            const OrganizationService = require('./src/services/organizationService');
            const stats = await OrganizationService.getOrganizationStats();
            console.log('✅ OrganizationService.getOrganizationStats():');
            console.log(stats);
        } catch (error) {
            console.log('❌ OrganizationService failed:', error.message);
            console.log('Stack:', error.stack);
        }
        
    } catch (error) {
        console.error('❌ Critical error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testDashboardQuery();