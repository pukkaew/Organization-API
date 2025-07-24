// Initialize SQL Server Test Database with Sample Data
require('dotenv').config();
const sql = require('mssql');

async function initializeSQLServerData() {
    console.log('🚀 Initializing SQL Server Test Database with Sample Data...\n');
    
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
        console.log('🔌 Connecting to SQL Server...');
        const pool = await sql.connect(config);
        console.log('✅ Connected successfully!\n');
        
        // Check current data
        console.log('📊 Checking current data...');
        const companies = await pool.request().query('SELECT COUNT(*) as count FROM Companies');
        console.log(`   Companies: ${companies.recordset[0].count} records`);
        
        if (companies.recordset[0].count === 0) {
            console.log('\n📝 Inserting sample data...');
            
            // Insert Companies
            console.log('   Inserting companies...');
            await pool.request().query(`
                INSERT INTO Companies (company_code, company_name_th, company_name_en, tax_id, is_active, created_by, created_date) VALUES
                ('RUXCHAI', N'บริษัท รักษ์ชายธุรกิจ จำกัด', 'Ruxchai Business Company Limited', '0105561234567', 1, 'admin', GETDATE()),
                ('COLD001', N'บริษัท รักษ์ชาย โคลสโตเรจ จำกัด', 'Ruxchai Cold Storage Company Limited', '0105567890123', 1, 'admin', GETDATE()),
                ('LOGISTICS', N'บริษัท รักษ์ชาย โลจิสติกส์ จำกัด', 'Ruxchai Logistics Company Limited', '0105512345678', 0, 'admin', GETDATE())
            `);
            console.log('   ✅ Companies inserted');
            
            // Insert Branches
            console.log('   Inserting branches...');
            await pool.request().query(`
                INSERT INTO Branches (branch_code, branch_name, company_code, is_headquarters, is_active, created_by, created_date) VALUES
                ('RUXCHAI-HQ', N'สำนักงานใหญ่', 'RUXCHAI', 1, 1, 'admin', GETDATE()),
                ('RUXCHAI-BKK', N'สาขากรุงเทพ', 'RUXCHAI', 0, 1, 'admin', GETDATE()),
                ('COLD001-HQ', N'สำนักงานใหญ่', 'COLD001', 1, 1, 'admin', GETDATE())
            `);
            console.log('   ✅ Branches inserted');
            
            // Insert Divisions
            console.log('   Inserting divisions...');
            await pool.request().query(`
                INSERT INTO Divisions (division_code, division_name, company_code, branch_code, is_active, created_by, created_date) VALUES
                ('RUXCHAI-DIV01', N'ฝ่ายขาย', 'RUXCHAI', 'RUXCHAI-HQ', 1, 'admin', GETDATE()),
                ('RUXCHAI-DIV02', N'ฝ่ายการเงิน', 'RUXCHAI', 'RUXCHAI-HQ', 1, 'admin', GETDATE()),
                ('COLD001-DIV01', N'ฝ่ายโลจิสติกส์', 'COLD001', 'COLD001-HQ', 1, 'admin', GETDATE())
            `);
            console.log('   ✅ Divisions inserted');
            
            // Insert Departments
            console.log('   Inserting departments...');
            await pool.request().query(`
                INSERT INTO Departments (department_code, department_name, division_code, is_active, created_by, created_date) VALUES
                ('RUXCHAI-DEPT01', N'แผนกขายในประเทศ', 'RUXCHAI-DIV01', 1, 'admin', GETDATE()),
                ('RUXCHAI-DEPT02', N'แผนกขายต่างประเทศ', 'RUXCHAI-DIV01', 1, 'admin', GETDATE()),
                ('RUXCHAI-DEPT03', N'แผนกบัญชี', 'RUXCHAI-DIV02', 1, 'admin', GETDATE()),
                ('COLD001-DEPT01', N'แผนกขนส่ง', 'COLD001-DIV01', 1, 'admin', GETDATE())
            `);
            console.log('   ✅ Departments inserted');
            
            // Insert API Keys
            console.log('   Inserting API keys...');
            await pool.request().query(`
                INSERT INTO API_Keys (api_key, api_key_hash, app_name, permissions, is_active, created_by, created_date) VALUES
                ('test-api-key-12345', 'hash123', 'Development Key', 'read,write', 1, 'admin', GETDATE()),
                ('read-only-key-67890', 'hash456', 'Read Only Key', 'read', 1, 'admin', GETDATE())
            `);
            console.log('   ✅ API Keys inserted');
            
        } else {
            console.log('   ⚠️  Data already exists, skipping insert');
        }
        
        // Verify data
        console.log('\n🔍 Verifying inserted data...');
        
        const finalCounts = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM Companies WHERE is_active = 1) as companies,
                (SELECT COUNT(*) FROM Branches WHERE is_active = 1) as branches,
                (SELECT COUNT(*) FROM Divisions WHERE is_active = 1) as divisions,
                (SELECT COUNT(*) FROM Departments WHERE is_active = 1) as departments,
                (SELECT COUNT(*) FROM API_Keys WHERE is_active = 1) as api_keys
        `);
        
        const counts = finalCounts.recordset[0];
        console.log(`   ✅ Companies: ${counts.companies}`);
        console.log(`   ✅ Branches: ${counts.branches}`);
        console.log(`   ✅ Divisions: ${counts.divisions}`);
        console.log(`   ✅ Departments: ${counts.departments}`);
        console.log(`   ✅ API Keys: ${counts.api_keys}`);
        
        // Test hierarchy query
        console.log('\n🌳 Testing organizational hierarchy...');
        const hierarchy = await pool.request().query(`
            SELECT 
                c.company_name_th as company,
                b.branch_name as branch,
                d.division_name as division,
                dept.department_name as department
            FROM Companies c
            LEFT JOIN Branches b ON c.company_code = b.company_code AND b.is_active = 1
            LEFT JOIN Divisions d ON b.branch_code = d.branch_code AND d.is_active = 1
            LEFT JOIN Departments dept ON d.division_code = dept.division_code AND dept.is_active = 1
            WHERE c.is_active = 1
            ORDER BY c.company_name_th, b.branch_name, d.division_name, dept.department_name
        `);
        
        let currentCompany = '';
        let currentBranch = '';
        let currentDivision = '';
        
        hierarchy.recordset.forEach(row => {
            if (row.company !== currentCompany) {
                console.log(`   🏢 ${row.company}`);
                currentCompany = row.company;
                currentBranch = '';
                currentDivision = '';
            }
            
            if (row.branch && row.branch !== currentBranch) {
                console.log(`      🏪 ${row.branch}`);
                currentBranch = row.branch;
                currentDivision = '';
            }
            
            if (row.division && row.division !== currentDivision) {
                console.log(`         🏗️ ${row.division}`);
                currentDivision = row.division;
            }
            
            if (row.department) {
                console.log(`            🏛️ ${row.department}`);
            }
        });
        
        await pool.close();
        console.log('\n✅ SQL Server Test Database initialization completed successfully!\n');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run initialization
initializeSQLServerData();