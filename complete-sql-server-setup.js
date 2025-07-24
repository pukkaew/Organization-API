// Complete SQL Server Test Database Setup
require('dotenv').config();
const sql = require('mssql');

async function completeSQLServerSetup() {
    console.log('🚀 Completing SQL Server Test Database Setup...\n');
    
    const config = {
        server: process.env.DB_SERVER,
        port: parseInt(process.env.DB_PORT) || 1433,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        },
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        }
    };
    
    try {
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server Test Database\n');
        
        // Add remaining API keys with correct permissions
        console.log('🔑 Adding API Keys with correct permissions...');
        
        try {
            await pool.request().query(`
                INSERT INTO API_Keys (api_key, api_key_hash, app_name, description, permissions, is_active, created_by, created_date) VALUES
                ('dev-key-12345', 'hash_dev_123', 'Development API Key', 'Key for development testing', 'read_write', 1, 'admin', GETDATE()),
                ('readonly-key-67890', 'hash_readonly_456', 'Read Only API Key', 'Key for read-only operations', 'read', 1, 'admin', GETDATE())
            `);
            console.log('   ✅ API Keys added successfully');
        } catch (error) {
            if (!error.message.includes('PRIMARY KEY constraint')) {
                console.log(`   ⚠️  API Keys error: ${error.message}`);
            } else {
                console.log('   ✅ API Keys already exist');
            }
        }
        
        // Final verification of all data
        console.log('\n📊 Final Database Verification...\n');
        
        const summary = await pool.request().query(`
            SELECT 
                'Companies' as table_name,
                COUNT(*) as total_records,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_records
            FROM Companies
            UNION ALL
            SELECT 
                'Branches' as table_name,
                COUNT(*) as total_records,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_records
            FROM Branches
            UNION ALL
            SELECT 
                'Divisions' as table_name,
                COUNT(*) as total_records,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_records
            FROM Divisions
            UNION ALL
            SELECT 
                'Departments' as table_name,
                COUNT(*) as total_records,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_records
            FROM Departments
            UNION ALL
            SELECT 
                'API_Keys' as table_name,
                COUNT(*) as total_records,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_records
            FROM API_Keys
        `);
        
        console.log('📈 Data Summary:');
        summary.recordset.forEach(row => {
            console.log(`   ${row.table_name}: ${row.active_records}/${row.total_records} active records`);
        });
        console.log();
        
        // Test API functionality
        console.log('🧪 Testing API-ready queries...\n');
        
        // Test companies endpoint query
        console.log('1. Companies with pagination simulation:');
        const companiesPage = await pool.request().query(`
            SELECT TOP 10 
                company_code,
                company_name_th,
                company_name_en,
                tax_id,
                is_active,
                created_date,
                created_by
            FROM Companies 
            WHERE is_active = 1
            ORDER BY company_name_th
        `);
        console.log(`   ✅ ${companiesPage.recordset.length} companies retrieved`);
        
        // Test branches by company
        console.log('2. Branches by company:');
        const branchesByCompany = await pool.request().query(`
            SELECT 
                b.branch_code,
                b.branch_name,
                b.company_code,
                b.is_headquarters,
                c.company_name_th
            FROM Branches b
            JOIN Companies c ON b.company_code = c.company_code
            WHERE b.company_code = 'RUXCHAI' AND b.is_active = 1
        `);
        console.log(`   ✅ ${branchesByCompany.recordset.length} branches for RUXCHAI`);
        
        // Test departments with full hierarchy
        console.log('3. Departments with hierarchy:');
        const departmentsWithHierarchy = await pool.request().query(`
            SELECT 
                dept.department_code,
                dept.department_name,
                div.division_code,
                div.division_name,
                b.branch_code,
                b.branch_name,
                c.company_code,
                c.company_name_th
            FROM Departments dept
            JOIN Divisions div ON dept.division_code = div.division_code
            JOIN Branches b ON div.branch_code = b.branch_code
            JOIN Companies c ON div.company_code = c.company_code
            WHERE dept.is_active = 1 AND div.is_active = 1 AND b.is_active = 1 AND c.is_active = 1
            ORDER BY c.company_name_th, b.branch_name, div.division_name, dept.department_name
        `);
        console.log(`   ✅ ${departmentsWithHierarchy.recordset.length} departments with full hierarchy`);
        
        // Test API keys
        console.log('4. API Keys validation:');
        const apiKeys = await pool.request().query(`
            SELECT api_key, app_name, permissions, is_active, created_date
            FROM API_Keys
            WHERE is_active = 1
        `);
        console.log(`   ✅ ${apiKeys.recordset.length} active API keys`);
        apiKeys.recordset.forEach(key => {
            console.log(`      - ${key.app_name}: ${key.permissions}`);
        });
        
        console.log('\n✅ SQL Server Test Database is ready for API testing!\n');
        
        // Connection test summary
        console.log('🔧 Connection Details for API:');
        console.log(`   Server: ${config.server}:${config.port}`);
        console.log(`   Database: ${config.database}`);
        console.log(`   Type: SQL Server 2019`);
        console.log(`   Status: ✅ Ready`);
        console.log();
        
        await pool.close();
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    }
}

// Run the setup
completeSQLServerSetup();