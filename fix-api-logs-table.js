#!/usr/bin/env node

// Script to fix API_Logs table schema
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'organization.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing API_Logs table schema...\n');

db.serialize(() => {
    // 1. Drop existing API_Logs table if it exists
    console.log('1. Dropping existing API_Logs table...');
    db.run("DROP TABLE IF EXISTS API_Logs", (err) => {
        if (err) {
            console.error('❌ Failed to drop API_Logs table:', err);
        } else {
            console.log('✅ API_Logs table dropped\n');
        }
        
        // 2. Create new API_Logs table with correct schema
        console.log('2. Creating new API_Logs table with correct schema...');
        db.run(`
            CREATE TABLE API_Logs (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_id TEXT,
                endpoint TEXT,
                method TEXT,
                request_body TEXT,
                response_status INTEGER,
                response_time_ms INTEGER,
                ip_address TEXT,
                user_agent TEXT,
                error_message TEXT,
                created_date DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Failed to create API_Logs table:', err);
            } else {
                console.log('✅ API_Logs table created with correct schema\n');
                
                // 3. Verify the table schema
                console.log('3. Verifying table schema...');
                db.all("PRAGMA table_info(API_Logs)", (err, rows) => {
                    if (err) {
                        console.error('❌ Failed to get table info:', err);
                    } else {
                        console.log('✅ API_Logs table columns:');
                        rows.forEach(row => {
                            console.log(`   - ${row.name} (${row.type})`);
                        });
                    }
                    
                    console.log('\n✅ Schema fix completed!');
                    db.close();
                });
            }
        });
    });
});