// Database initialization utility
const { getDatabase } = require('../config/database');
const logger = require('./logger');

async function initializeSQLiteTables() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create API_Logs table
            db.run(`
                CREATE TABLE IF NOT EXISTS API_Logs (
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
                    logger.error('Failed to create API_Logs table:', err);
                    reject(err);
                    return;
                }
                logger.info('API_Logs table created/verified');
            });
            
            // Create API_Keys table
            db.run(`
                CREATE TABLE IF NOT EXISTS API_Keys (
                    api_key_id TEXT PRIMARY KEY,
                    api_key_hash TEXT UNIQUE,
                    app_name TEXT NOT NULL,
                    permissions TEXT,
                    is_active INTEGER DEFAULT 1,
                    last_used_date DATETIME,
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_by TEXT,
                    updated_date DATETIME,
                    updated_by TEXT
                )
            `, (err) => {
                if (err) {
                    logger.error('Failed to create API_Keys table:', err);
                    reject(err);
                    return;
                }
                logger.info('API_Keys table created/verified');
                
                // Add default API key if none exists
                db.get("SELECT COUNT(*) as count FROM API_Keys", [], (err, row) => {
                    if (err) {
                        logger.error('Failed to check API_Keys:', err);
                    } else if (row.count === 0) {
                        // Add a default API key for testing
                        db.run(`
                            INSERT INTO API_Keys (api_key_id, api_key_hash, app_name, permissions, created_by)
                            VALUES ('default-key', 'default-hash', 'Default Application', 'read,write', 'system')
                        `, (err) => {
                            if (err) {
                                logger.error('Failed to insert default API key:', err);
                            } else {
                                logger.info('Default API key created');
                            }
                        });
                    }
                });
                
                resolve();
            });
        });
    });
}

module.exports = {
    initializeSQLiteTables
};