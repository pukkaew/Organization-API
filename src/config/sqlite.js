// Path: /src/config/sqlite.js
const Database = require('sqlite3').Database;
const path = require('path');
const logger = require('../utils/logger');

// Database file path
const dbPath = path.join(process.cwd(), 'database', 'organization.sqlite');

let db = null;

// Connect to SQLite database
async function connectDatabase() {
    try {
        return new Promise((resolve, reject) => {
            db = new Database(dbPath, async (err) => {
                if (err) {
                    logger.error('SQLite connection failed:', err);
                    reject(err);
                } else {
                    logger.info('SQLite database connection established successfully');
                    
                    // Initialize missing tables
                    try {
                        await initializeTables();
                        resolve(db);
                    } catch (initError) {
                        logger.error('Table initialization failed:', initError);
                        reject(initError);
                    }
                }
            });
        });
    } catch (error) {
        logger.error('SQLite database connection failed:', error);
        throw error;
    }
}

// Initialize missing tables
async function initializeTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create API_Logs table with proper schema
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
            
            // Create API_Keys table with proper schema
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
                
                // Check if we need to add a default API key
                db.get("SELECT COUNT(*) as count FROM API_Keys", [], (err, row) => {
                    if (!err && row && row.count === 0) {
                        db.run(`
                            INSERT INTO API_Keys (api_key_id, api_key_hash, app_name, permissions, created_by)
                            VALUES ('default-key', 'default-hash', 'Default Application', 'read,write', 'system')
                        `, (insertErr) => {
                            if (!insertErr) {
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

// Get database connection
function getDatabase() {
    if (!db) {
        throw new Error('SQLite database not connected. Call connectDatabase() first.');
    }
    return db;
}

// Execute query with SQLite
async function executeQuery(query, inputs = {}) {
    try {
        return new Promise((resolve, reject) => {
            const database = getDatabase();
            
            // Convert MSSQL parameter syntax (@param) to SQLite parameter syntax (?)
            let sqliteQuery = query;
            const paramValues = [];
            const paramOrder = [];
            
            // Convert SQL Server specific syntax to SQLite first
            sqliteQuery = sqliteQuery.replace(/OFFSET\s+@(\w+)\s+ROWS\s+FETCH\s+NEXT\s+@(\w+)\s+ROWS\s+ONLY/gi, 'LIMIT @$2 OFFSET @$1');
            
            // Extract parameter names in order they appear in the query
            const paramMatches = sqliteQuery.match(/@\w+/g) || [];
            paramMatches.forEach(match => {
                const paramName = match.substring(1); // Remove @
                if (!paramOrder.includes(paramName) && inputs.hasOwnProperty(paramName)) {
                    paramOrder.push(paramName);
                }
            });
            
            // Replace named parameters with positional parameters in correct order
            paramOrder.forEach(key => {
                const regex = new RegExp(`@${key}\\b`, 'g');
                sqliteQuery = sqliteQuery.replace(regex, '?');
                paramValues.push(inputs[key]);
            });
            
            // Replace GETDATE() with datetime('now')
            sqliteQuery = sqliteQuery.replace(/GETDATE\(\)/gi, "datetime('now')");
            
            logger.debug('Executing SQLite query:', { 
                originalQuery: query, 
                sqliteQuery: sqliteQuery, 
                originalParams: inputs,
                paramOrder: paramOrder,
                paramValues: paramValues 
            });
            
            if (query.toLowerCase().trim().startsWith('select')) {
                database.all(sqliteQuery, paramValues, (err, rows) => {
                    if (err) {
                        logger.error('SQLite query failed:', err);
                        reject(err);
                    } else {
                        resolve({
                            recordset: rows || [],
                            rowsAffected: [rows ? rows.length : 0]
                        });
                    }
                });
            } else {
                database.run(sqliteQuery, paramValues, function(err) {
                    if (err) {
                        logger.error('SQLite query failed:', err);
                        reject(err);
                    } else {
                        resolve({
                            recordset: [],
                            rowsAffected: [this.changes || 0]
                        });
                    }
                });
            }
        });
    } catch (error) {
        logger.error('SQLite query execution failed:', error);
        throw error;
    }
}

// Close database connection
async function closeDatabase() {
    try {
        if (db) {
            return new Promise((resolve, reject) => {
                db.close((err) => {
                    if (err) {
                        logger.error('Error closing SQLite database:', err);
                        reject(err);
                    } else {
                        logger.info('SQLite database connection closed');
                        resolve();
                    }
                });
            });
        }
    } catch (error) {
        logger.error('Error closing SQLite database connection:', error);
        throw error;
    }
}

module.exports = {
    connectDatabase,
    getDatabase,
    closeDatabase,
    executeQuery
};