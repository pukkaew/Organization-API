// SQLite Database Configuration
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

let db = null;

// Database connection
const connectDatabase = async () => {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, '../../database/organization.sqlite');
        
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                logger.error('SQLite connection error:', err);
                reject(err);
            } else {
                logger.info('Connected to SQLite database');
                // Enable foreign keys
                db.run('PRAGMA foreign_keys = ON');
                resolve();
            }
        });
    });
};

// Execute query
const executeQuery = async (query, params = {}, paramArray = null) => {
    return new Promise((resolve, reject) => {
        // Convert @param to ? format for SQLite
        let sqliteQuery = query;
        let finalParams = paramArray || [];
        
        if (!paramArray) {
            // Replace @param with ? and collect params
            const paramRegex = /@(\w+)/g;
            let match;
            while ((match = paramRegex.exec(query)) !== null) {
                const paramName = match[1];
                if (params[paramName] !== undefined) {
                    finalParams.push(params[paramName]);
                }
            }
            sqliteQuery = query.replace(/@\w+/g, '?');
        } else {
            // Use provided parameter array
            finalParams = paramArray;
        }
        
        // Convert SQL Server syntax to SQLite
        sqliteQuery = sqliteQuery
            .replace(/GETDATE\(\)/g, "datetime('now')")
            .replace(/IDENTITY\(1,1\)/g, 'AUTOINCREMENT')
            .replace(/\[(\w+)\]/g, '$1')  // Remove brackets
            .replace(/VARCHAR\((\d+)\)/g, 'TEXT')
            .replace(/NVARCHAR\((\d+)\)/g, 'TEXT')
            .replace(/BIT/g, 'INTEGER')
            .replace(/DATETIME/g, 'TEXT');
            
        // Handle pagination syntax conversion and parameter reordering
        if (sqliteQuery.includes('OFFSET') && sqliteQuery.includes('FETCH NEXT')) {
            sqliteQuery = sqliteQuery.replace(/OFFSET\s+\?\s+ROWS\s+FETCH\s+NEXT\s+\?\s+ROWS\s+ONLY/gi, 'LIMIT ? OFFSET ?');
            // Swap parameters for SQLite: [offset, limit] -> [limit, offset]
            if (finalParams.length >= 2) {
                const temp = finalParams[finalParams.length - 2];
                finalParams[finalParams.length - 2] = finalParams[finalParams.length - 1];
                finalParams[finalParams.length - 1] = temp;
            }
        }
        
        if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sqliteQuery, finalParams, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ recordset: rows });
                }
            });
        } else {
            db.run(sqliteQuery, finalParams, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ 
                        rowsAffected: [this.changes],
                        lastInsertRowid: this.lastID
                    });
                }
            });
        }
    });
};

// Execute transaction
const executeTransaction = async (callback) => {
    return new Promise(async (resolve, reject) => {
        db.serialize(async () => {
            db.run('BEGIN TRANSACTION');
            
            try {
                const result = await callback();
                db.run('COMMIT', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            } catch (error) {
                db.run('ROLLBACK', (rollbackErr) => {
                    reject(error);
                });
            }
        });
    });
};

// Close database connection
const closeDatabase = async () => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    logger.info('SQLite database connection closed');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
};

module.exports = {
    connectDatabase,
    executeQuery,
    executeTransaction,
    closeDatabase
};