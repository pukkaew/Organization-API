require('dotenv').config();
const sql = require('mssql');

async function testMSSQLConnection() {
    console.log('Testing MSSQL Connection...\n');
    
    console.log('Environment Variables:');
    console.log('DB_SERVER:', process.env.DB_SERVER);
    console.log('DB_DATABASE:', process.env.DB_DATABASE);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_ENCRYPT:', process.env.DB_ENCRYPT);
    console.log('DB_TRUST_SERVER_CERTIFICATE:', process.env.DB_TRUST_SERVER_CERTIFICATE);
    console.log('');

    // Test with different connection configurations
    const configs = [
        {
            name: 'Basic Config',
            config: {
                server: process.env.DB_SERVER,
                port: parseInt(process.env.DB_PORT) || 1433,
                database: process.env.DB_DATABASE,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                options: {
                    encrypt: false,
                    trustServerCertificate: true,
                    enableArithAbort: true
                }
            }
        },
        {
            name: 'Without Database',
            config: {
                server: process.env.DB_SERVER,
                port: parseInt(process.env.DB_PORT) || 1433,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                options: {
                    encrypt: false,
                    trustServerCertificate: true,
                    enableArithAbort: true
                }
            }
        },
        {
            name: 'With Encryption',
            config: {
                server: process.env.DB_SERVER,
                port: parseInt(process.env.DB_PORT) || 1433,
                database: process.env.DB_DATABASE,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                options: {
                    encrypt: true,
                    trustServerCertificate: true,
                    enableArithAbort: true
                }
            }
        }
    ];

    for (const { name, config } of configs) {
        console.log(`Testing ${name}...`);
        
        try {
            const pool = await sql.connect(config);
            console.log(`✅ ${name}: Connection successful!`);
            
            // Test a simple query
            try {
                const result = await pool.request().query('SELECT @@VERSION as version');
                console.log(`✅ ${name}: Query successful!`);
                console.log('SQL Server Version:', result.recordset[0].version.split('\n')[0]);
                
                // Try to list databases
                try {
                    const dbResult = await pool.request().query('SELECT name FROM sys.databases WHERE name NOT IN (\'master\', \'tempdb\', \'model\', \'msdb\')');
                    console.log('Available Databases:', dbResult.recordset.map(r => r.name));
                } catch (dbError) {
                    console.log('Could not list databases:', dbError.message);
                }
                
            } catch (queryError) {
                console.log(`❌ ${name}: Query failed:`, queryError.message);
            }
            
            await pool.close();
            console.log(`✅ ${name}: Connection closed successfully\n`);
            
        } catch (error) {
            console.log(`❌ ${name}: Connection failed:`, error.message);
            console.log('Error Code:', error.code);
            console.log('');
        }
    }
}

testMSSQLConnection()
    .catch(error => {
        console.error('Test failed:', error);
    });