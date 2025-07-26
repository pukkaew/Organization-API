#!/usr/bin/env node

// Test API logging functionality
const { connectDatabase } = require('./src/config/database');
const apiLogService = require('./src/services/apiLogService');

async function testApiLogging() {
    console.log('🧪 Testing API Logging Functionality');
    console.log('=====================================\n');
    
    try {
        // Connect to database
        console.log('1. Connecting to database...');
        await connectDatabase();
        console.log('✅ Database connected\n');
        
        // Test getTodayStats
        console.log('2. Testing getTodayStats()...');
        try {
            const stats = await apiLogService.getTodayStats();
            console.log('✅ getTodayStats() successful:', stats);
        } catch (error) {
            console.log('❌ getTodayStats() failed:', error.message);
        }
        
        // Test getUsageChartData
        console.log('\n3. Testing getUsageChartData()...');
        try {
            const chartData = await apiLogService.getUsageChartData('7days');
            console.log('✅ getUsageChartData() successful:', chartData.length, 'records');
        } catch (error) {
            console.log('❌ getUsageChartData() failed:', error.message);
        }
        
        // Test logRequest
        console.log('\n4. Testing logRequest()...');
        try {
            await apiLogService.logRequest({
                api_key_id: 'default-key',
                endpoint: '/api/test',
                method: 'GET',
                request_body: null,
                response_status: 200,
                response_time_ms: 50,
                ip_address: '127.0.0.1',
                user_agent: 'Test Agent',
                error_message: null
            });
            console.log('✅ logRequest() successful');
        } catch (error) {
            console.log('❌ logRequest() failed:', error.message);
        }
        
        // Test getTodayStats again after adding a log
        console.log('\n5. Testing getTodayStats() after adding log...');
        try {
            const stats = await apiLogService.getTodayStats();
            console.log('✅ getTodayStats() successful:', stats);
        } catch (error) {
            console.log('❌ getTodayStats() failed:', error.message);
        }
        
        console.log('\n✅ All API logging tests completed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
    
    process.exit(0);
}

testApiLogging();