// Debug database connection state
require('dotenv').config();
const { getPool } = require('./src/config/database');

async function debugDatabaseState() {
    try {
        console.log('🔍 Debugging database connection state...');
        
        const pool = getPool();
        console.log('Pool state:', {
            connected: pool?.connected,
            connecting: pool?.connecting,
            healthy: pool?.healthy
        });
        
        console.log('Environment variables:');
        console.log('- FORCE_MSSQL:', process.env.FORCE_MSSQL);
        console.log('- DB_TYPE:', process.env.DB_TYPE);
        console.log('- DB_SERVER:', process.env.DB_SERVER);
        console.log('- DB_DATABASE:', process.env.DB_DATABASE);
        console.log('- USE_DATABASE:', process.env.USE_DATABASE);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugDatabaseState();