const sql = require('mssql');
const logger = require('./src/utils/logger');

// MSSQL Configuration
const config = {
    server: process.env.DB_SERVER || '45.136.253.81',
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE || 'OrgStructureDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '@Rc9988!Sql',
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

async function clearAllData() {
    let pool;
    
    try {
        console.log('🗑️ เริ่มเคลียร์ข้อมูลทั้งหมดใน MSSQL...');
        console.log(`📡 เชื่อมต่อ: ${config.server}:${config.port}/${config.database}`);
        
        // Connect to MSSQL
        pool = await sql.connect(config);
        console.log('✅ เชื่อมต่อ MSSQL สำเร็จ');
        
        // Use the target database
        await pool.request().query(`USE [${config.database}]`);
        console.log(`✅ ใช้ฐานข้อมูล: ${config.database}`);
        
        // Clear all tables in correct order (respecting foreign key constraints)
        const clearQueries = [
            'DELETE FROM Departments',
            'DELETE FROM Divisions', 
            'DELETE FROM Branches',
            'DELETE FROM Companies',
            'DELETE FROM API_Keys',
            'DELETE FROM API_Logs'
        ];
        
        for (const query of clearQueries) {
            try {
                const result = await pool.request().query(query);
                const tableName = query.replace('DELETE FROM ', '');
                console.log(`✅ ลบ ${tableName} แล้ว (${result.rowsAffected[0]} rows)`);
            } catch (error) {
                const tableName = query.replace('DELETE FROM ', '');
                console.log(`⚠️ ตาราง ${tableName}: ${error.message}`);
            }
        }
        
        console.log('\n🎉 เคลียร์ข้อมูล MSSQL เสร็จแล้ว! ระบบพร้อมทดสอบใหม่');
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔌 ปิดการเชื่อมต่อ MSSQL แล้ว');
        }
    }
}

// Run the clear function
clearAllData()
    .then(() => {
        console.log('✨ เสร็จสิ้นการเคลียร์ข้อมูล');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 เกิดข้อผิดพลาดในการเคลียร์ข้อมูล:', error);
        process.exit(1);
    });