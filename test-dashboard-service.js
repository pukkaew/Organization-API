require('dotenv').config();
const { connectDatabase } = require('./src/config/database');
const organizationService = require('./src/services/organizationService');

async function testDashboardService() {
    console.log('🔍 Testing Dashboard Service...\n');
    
    try {
        // Connect database
        await connectDatabase();
        console.log('✅ Database connected\n');
        
        // Test organization stats
        console.log('📊 Testing getOrganizationStats...');
        try {
            const stats = await organizationService.getOrganizationStats();
            console.log('✅ Organization stats:', stats);
        } catch (error) {
            console.log('❌ Organization stats failed:', error.message);
        }
        
        // Test recent activities
        console.log('\n📋 Testing getRecentActivities...');
        try {
            const activities = await organizationService.getRecentActivities(5);
            console.log('✅ Recent activities:', activities?.length || 0, 'items');
        } catch (error) {
            console.log('❌ Recent activities failed:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Test setup error:', error.message);
    }
    
    console.log('\n🏁 Test completed');
    process.exit(0);
}

testDashboardService();