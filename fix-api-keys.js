// Fix API Keys in Database - Create properly hashed API keys
require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function fixAPIKeys() {
    console.log('🔧 Fixing API Keys in Database...\n');
    
    const config = {
        server: process.env.DB_SERVER,
        port: parseInt(process.env.DB_PORT) || 1433,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        }
    };
    
    try {
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server Test Database\n');
        
        // Clear existing API keys
        console.log('🗑️ Clearing existing API keys...');
        await pool.request().query('DELETE FROM API_Keys');
        console.log('   ✅ Existing API keys cleared\n');
        
        // Generate new API keys
        console.log('🔑 Creating new properly hashed API keys...\n');
        
        // Function to generate API key
        function generateApiKey() {
            const buffer = crypto.randomBytes(32);
            return buffer.toString('base64').replace(/[/+=]/g, '');
        }
        
        // Function to hash API key
        async function hashApiKey(apiKey) {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(apiKey, salt);
        }
        
        // Create development API key with read_write permissions
        const devApiKey = generateApiKey();
        const devApiKeyHash = await hashApiKey(devApiKey);
        
        await pool.request()
            .input('apiKey', sql.VarChar(64), devApiKey)
            .input('apiKeyHash', sql.VarChar(255), devApiKeyHash)
            .input('appName', sql.NVarChar(100), 'Development API Key')
            .input('description', sql.NVarChar(500), 'API key for development and testing with full read/write access')
            .input('permissions', sql.VarChar(100), 'read_write')
            .input('isActive', sql.Bit, 1)
            .input('createdBy', sql.VarChar(50), 'system')
            .query(`
                INSERT INTO API_Keys (api_key, api_key_hash, app_name, description, permissions, is_active, created_date, created_by)
                VALUES (@apiKey, @apiKeyHash, @appName, @description, @permissions, @isActive, GETDATE(), @createdBy)
            `);
        
        console.log('✅ Development API Key created:');
        console.log(`   Key: ${devApiKey}`);
        console.log(`   App: Development API Key`);
        console.log(`   Permissions: read_write`);
        console.log();
        
        // Create read-only API key
        const readOnlyApiKey = generateApiKey();
        const readOnlyApiKeyHash = await hashApiKey(readOnlyApiKey);
        
        await pool.request()
            .input('apiKey', sql.VarChar(64), readOnlyApiKey)
            .input('apiKeyHash', sql.VarChar(255), readOnlyApiKeyHash)
            .input('appName', sql.NVarChar(100), 'Read Only API Key')
            .input('description', sql.NVarChar(500), 'API key with read-only access for reporting and data retrieval')
            .input('permissions', sql.VarChar(100), 'read')
            .input('isActive', sql.Bit, 1)
            .input('createdBy', sql.VarChar(50), 'system')
            .query(`
                INSERT INTO API_Keys (api_key, api_key_hash, app_name, description, permissions, is_active, created_date, created_by)
                VALUES (@apiKey, @apiKeyHash, @appName, @description, @permissions, @isActive, GETDATE(), @createdBy)
            `);
        
        console.log('✅ Read-Only API Key created:');
        console.log(`   Key: ${readOnlyApiKey}`);
        console.log(`   App: Read Only API Key`);
        console.log(`   Permissions: read`);
        console.log();
        
        // Create test API key
        const testApiKey = generateApiKey();
        const testApiKeyHash = await hashApiKey(testApiKey);
        
        await pool.request()
            .input('apiKey', sql.VarChar(64), testApiKey)
            .input('apiKeyHash', sql.VarChar(255), testApiKeyHash)
            .input('appName', sql.NVarChar(100), 'Test API Key')
            .input('description', sql.NVarChar(500), 'API key for automated testing and CI/CD processes')
            .input('permissions', sql.VarChar(100), 'read_write')
            .input('isActive', sql.Bit, 1)
            .input('createdBy', sql.VarChar(50), 'system')
            .query(`
                INSERT INTO API_Keys (api_key, api_key_hash, app_name, description, permissions, is_active, created_date, created_by)
                VALUES (@apiKey, @apiKeyHash, @appName, @description, @permissions, @isActive, GETDATE(), @createdBy)
            `);
        
        console.log('✅ Test API Key created:');
        console.log(`   Key: ${testApiKey}`);
        console.log(`   App: Test API Key`);
        console.log(`   Permissions: read_write`);
        console.log();
        
        // Verify created API keys
        console.log('🔍 Verifying created API keys...');
        const verification = await pool.request().query(`
            SELECT 
                api_key_id,
                LEFT(api_key, 10) + '...' as api_key_preview,
                app_name,
                permissions,
                is_active,
                created_date
            FROM API_Keys
            WHERE is_active = 1
            ORDER BY created_date DESC
        `);
        
        console.log('\n📋 Created API Keys:');
        verification.recordset.forEach((key, index) => {
            console.log(`   ${index + 1}. ${key.app_name}`);
            console.log(`      ID: ${key.api_key_id}`);
            console.log(`      Key Preview: ${key.api_key_preview}`);
            console.log(`      Permissions: ${key.permissions}`);
            console.log(`      Created: ${key.created_date}`);
            console.log();
        });
        
        // Test authentication with the new key
        console.log('🧪 Testing API key authentication...');
        
        // Function to verify API key (same as in ApiKey model)
        async function verifyApiKey(apiKey, hash) {
            return await bcrypt.compare(apiKey, hash);
        }
        
        // Get the dev API key hash and test it
        const testAuth = await pool.request()
            .input('devKey', sql.VarChar(64), devApiKey)
            .query(`
                SELECT api_key_hash, app_name, permissions
                FROM API_Keys
                WHERE api_key = @devKey AND is_active = 1
            `);
        
        if (testAuth.recordset.length > 0) {
            const storedHash = testAuth.recordset[0].api_key_hash;
            const isValid = await verifyApiKey(devApiKey, storedHash);
            
            if (isValid) {
                console.log('   ✅ API key authentication test PASSED');
                console.log(`   ✅ Key: ${devApiKey.substring(0, 10)}...`);
                console.log(`   ✅ App: ${testAuth.recordset[0].app_name}`);
                console.log(`   ✅ Permissions: ${testAuth.recordset[0].permissions}`);
            } else {
                console.log('   ❌ API key authentication test FAILED');
            }
        }
        
        await pool.close();
        
        console.log('\n🎉 API Keys have been fixed successfully!');
        console.log('\n📝 Save these API keys for testing:');
        console.log(`   Development Key: ${devApiKey}`);
        console.log(`   Read-Only Key: ${readOnlyApiKey}`);
        console.log(`   Test Key: ${testApiKey}`);
        console.log('\n💡 Use the Development Key for full CRUD testing!\n');
        
    } catch (error) {
        console.error('❌ Failed to fix API keys:', error.message);
        console.error('Full error:', error);
    }
}

// Run the fix
fixAPIKeys();