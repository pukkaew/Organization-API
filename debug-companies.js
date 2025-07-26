#!/usr/bin/env node

// Debug script to test companies list functionality
const { connectDatabase } = require('./src/config/database');
const Company = require('./src/models/Company');
require('./src/utils/logger'); // Initialize logger

(async () => {
    try {
        console.log('1. Connecting to database...');
        await connectDatabase();
        console.log('✅ Database connected');

        console.log('\n2. Testing Company.findPaginated with various parameters...');
        
        // Test with default parameters (same as web controller)
        console.log('\n   a) Default parameters (page=1, limit=20, no filters):');
        const result1 = await Company.findPaginated(1, 20, {});
        console.log(`   ✅ Success: ${result1.data.length} companies found`);

        // Test with filters (same as what might come from web request)
        console.log('\n   b) With undefined filters (similar to req.query):');
        const result2 = await Company.findPaginated(1, 20, {
            is_active: undefined,
            search: undefined
        });
        console.log(`   ✅ Success: ${result2.data.length} companies found`);

        // Test with string parameters (as they come from web requests)
        console.log('\n   c) With string parameters:');
        const result3 = await Company.findPaginated("1", "20", {
            is_active: undefined,
            search: undefined
        });
        console.log(`   ✅ Success: ${result3.data.length} companies found`);

        console.log('\n✅ All tests passed! The model works correctly.');
        console.log('\nThis means the issue is likely in:');
        console.log('- Request parameter parsing');
        console.log('- Middleware interference');
        console.log('- Session/authentication handling');
        console.log('- Database connection in web context');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
})();