// Update API Keys with proper hashes
require('dotenv').config();
const { connectDatabase, executeQuery, closeDatabase } = require('./src/config/sqlite');

async function updateApiKeys() {
    try {
        await connectDatabase();
        console.log('Connected to database');
        
        // Update API keys with proper hashes
        await executeQuery(`
            UPDATE API_Keys 
            SET api_key_hash = ? 
            WHERE api_key = ?
        `, {}, ['$2a$10$LUtbyb94wcaPZwr4RoaTbu/l5Zi7ODqd3IFsakDzxODnNe60KjETK', 'test-api-key-12345']);
        
        await executeQuery(`
            UPDATE API_Keys 
            SET api_key_hash = ? 
            WHERE api_key = ?
        `, {}, ['$2a$10$W80ssxl.Aj1zycKi0Y5qlOblaLwJFLP1ZBiKA0rhCMRJO31EKgxC2', 'read-only-key-67890']);
        
        console.log('API keys updated successfully');
        
        // Verify
        const result = await executeQuery('SELECT api_key, api_key_hash FROM API_Keys');
        console.log('Current API keys:', result.recordset);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await closeDatabase();
    }
}

updateApiKeys();