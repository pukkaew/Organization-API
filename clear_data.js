const Database = require('sqlite3').Database;
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'organization.sqlite');
const db = new Database(dbPath);

console.log('🗑️ เริ่มเคลียร์ข้อมูลทั้งหมด...');

db.serialize(() => {
    // ลบข้อมูลทั้งหมด
    db.run('DELETE FROM Departments', (err) => {
        if (err) console.error('Departments:', err);
        else console.log('✅ ลบ Departments แล้ว');
    });
    
    db.run('DELETE FROM Divisions', (err) => {
        if (err) console.error('Divisions:', err);
        else console.log('✅ ลบ Divisions แล้ว');
    });
    
    db.run('DELETE FROM Branches', (err) => {
        if (err) console.error('Branches:', err);
        else console.log('✅ ลบ Branches แล้ว');
    });
    
    db.run('DELETE FROM Companies', (err) => {
        if (err) console.error('Companies:', err);
        else console.log('✅ ลบ Companies แล้ว');
    });
    
    db.run('DELETE FROM API_Keys', (err) => {
        if (err) console.error('API_Keys:', err);
        else console.log('✅ ลบ API Keys ทั้งหมดแล้ว');
    });
    
    db.run('DELETE FROM API_Logs', (err) => {
        if (err) console.error('API_Logs:', err);
        else console.log('✅ ลบ API Logs แล้ว');
        
        console.log('\n🎉 เคลียร์ข้อมูลเสร็จแล้ว! ระบบพร้อมทดสอบใหม่');
        db.close();
    });
});