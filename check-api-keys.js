const { connectDatabase, executeQuery } = require('./src/config/sqlite');

async function checkApiKeys() {
    try {
        await connectDatabase();
        const result = await executeQuery('SELECT api_key, app_name, is_active FROM API_Keys WHERE is_active = 1');
        console.log('Active API Keys:');
        console.log('Result type:', typeof result);
        console.log('Result:', result);
        
        if (result && result.recordset) {
            result.recordset.forEach(key => {
                console.log(`- Key: ${key.api_key}, App: ${key.app_name}, Active: ${key.is_active}`);
            });
        } else if (Array.isArray(result)) {
            result.forEach(key => {
                console.log(`- Key: ${key.api_key}, App: ${key.app_name}, Active: ${key.is_active}`);
            });
        } else {
            console.log('No results or unknown format');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkApiKeys();