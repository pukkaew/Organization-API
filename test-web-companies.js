require('dotenv').config();
const Company = require('./src/models/Company');
const { connectDatabase } = require('./src/config/database');

async function testCompaniesWeb() {
    console.log('🔍 Testing Companies web functionality...\n');
    
    try {
        // Connect to database
        await connectDatabase();
        console.log('✅ Database connected\n');
        
        // Test Company.findPaginated directly
        console.log('═══ TESTING Company.findPaginated() ═══');
        
        try {
            const result = await Company.findPaginated(1, 20, {});
            console.log('✅ Company.findPaginated successful:');
            console.log(`   Data: ${result.data.length} records`);
            console.log(`   Pagination:`, result.pagination);
            
            if (result.data.length > 0) {
                console.log('\n   📋 Companies found:');
                result.data.forEach((company, index) => {
                    console.log(`   ${index + 1}. ${company.company_code} - ${company.company_name_th}`);
                });
            }
        } catch (error) {
            console.log('❌ Company.findPaginated failed:', error.message);
            console.log('   Stack:', error.stack);
        }
        
        // Test Company.getStatistics
        console.log('\n═══ TESTING Company.getStatistics() ═══');
        
        try {
            const stats = await Company.getStatistics();
            console.log('✅ Company.getStatistics successful:', stats);
        } catch (error) {
            console.log('❌ Company.getStatistics failed:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Critical error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        console.log('\n🏁 Test completed');
        process.exit(0);
    }
}

testCompaniesWeb();