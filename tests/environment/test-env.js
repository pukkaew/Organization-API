// Load environment variables first
require('dotenv').config();

console.log('Environment variables:');
console.log('DB_TYPE:', process.env.DB_TYPE);
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
console.log('USE_DATABASE:', process.env.USE_DATABASE);

const { executeQuery, connectDatabase } = require('./src/config/database');

async function testDB() {
    try {
        console.log('\nConnecting to database...');
        await connectDatabase();
        
        console.log('Checking existing companies...');
        const result = await executeQuery('SELECT COUNT(*) as count FROM Companies', {});
        console.log('Total companies:', result.recordset[0].count);
        
    } catch (error) {
        console.error('Database test failed:', error.message);
    }
}

testDB();