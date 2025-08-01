// Path: /src/config/database.js
const sql = require('mssql');
const logger = require('../utils/logger');

// Detect database type - Force MSSQL if FORCE_MSSQL is set
const usingSQLite = process.env.FORCE_MSSQL === 'true' ? false : 
    (process.env.DB_TYPE === 'sqlite');
    
// Force MSSQL when environment is properly configured
const usingMSSQL = process.env.FORCE_MSSQL === 'true' || 
    (process.env.DB_TYPE === 'mssql' && process.env.DB_SERVER);

// Import appropriate database configuration
const sqliteConfig = usingSQLite ? require('./sqlite') : null;

// Database configuration - Fixed to use correct env variable names
const config = {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE || 'OrgStructureDB', 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        charset: 'utf8',
        useUTC: false
    }
};

// For Windows Authentication (optional)
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
    config.options.trustedConnection = true;
}

// Connection pool
let pool;
let connectionCount = 0;

// Connect to database
async function connectDatabase() {
    // Skip database connection if USE_DATABASE is false
    if (process.env.USE_DATABASE === 'false') {
        logger.info('Database connection skipped (USE_DATABASE=false)');
        return null;
    }
    
    // Use SQLite if configured and not forcing MSSQL
    if (usingSQLite && !usingMSSQL) {
        logger.info('Using SQLite database');
        return await sqliteConfig.connectDatabase();
    }
    
    try {
        connectionCount++;
        logger.info('Attempting to connect to MSSQL database...', {
            server: config.server,
            port: config.port,
            user: config.user,
            database: process.env.DB_DATABASE,
            connectionAttempt: connectionCount
        });
        
        pool = await sql.connect(config);
        
        // Switch to the target database after connection
        if (process.env.DB_DATABASE) {
            try {
                await pool.request().query(`USE [${process.env.DB_DATABASE}]`);
                logger.info(`Switched to database: ${process.env.DB_DATABASE}`);
            } catch (dbError) {
                logger.error(`Could not switch to database ${process.env.DB_DATABASE}:`, dbError);
                throw dbError; // Don't continue with wrong database
            }
        }
        
        logger.info('MSSQL database connection established successfully', {
            connectionId: connectionCount,
            poolConnected: !!pool.connected
        });
        return pool;
    } catch (error) {
        logger.error('Database connection failed:', {
            message: error.message,
            code: error.code,
            server: config.server,
            port: config.port,
            user: config.user
        });
        
        // Provide helpful error messages
        if (error.code === 'ENOTFOUND') {
            logger.error('Cannot reach database server. Check if server address is correct and accessible.');
        } else if (error.code === 'ECONNREFUSED') {
            logger.error('Connection refused. Check if SQL Server is running and port is correct.');
        } else if (error.code === 'ELOGIN') {
            logger.error('Login failed. Check username and password.');
        }
        
        throw error;
    }
}

// Get connection pool
function getPool() {
    // Skip if database is disabled
    if (process.env.USE_DATABASE === 'false') {
        return null;
    }
    
    if (!pool) {
        logger.error('Database pool is not available. Database connection may have failed during startup.');
        throw new Error('Database not connected. Call connectDatabase() first. Check if the database server is running and credentials are correct.');
    }
    return pool;
}

// Close database connection
async function closeDatabase() {
    try {
        // Use SQLite if configured
        if (usingSQLite) {
            return await sqliteConfig.closeDatabase();
        }
        
        if (pool) {
            await pool.close();
            logger.info('MSSQL database connection closed');
        }
    } catch (error) {
        logger.error('Error closing database connection:', error);
        throw error;
    }
}

// Execute query
async function executeQuery(query, inputs = {}, paramArray = null) {
    logger.info('executeQuery called', { 
        queryStart: query.substring(0, 50) + '...',
        hasPool: !!pool,
        inputKeys: Object.keys(inputs)
    });
    
    try {
        // Skip database operations if USE_DATABASE is false
        if (process.env.USE_DATABASE === 'false') {
            logger.debug('Skipping database query (USE_DATABASE=false)');
            return { recordset: [], rowsAffected: [0] };
        }
        
        // Use SQLite if configured and not forcing MSSQL
        if (usingSQLite && !usingMSSQL) {
            return await sqliteConfig.executeQuery(query, inputs);
        }
        
        // Check if pool is available - if not, attempt to reconnect
        if (!pool) {
            logger.warn('Database pool not available, attempting to reconnect...');
            try {
                await connectDatabase();
                if (!pool) {
                    throw new Error('Failed to establish database connection');
                }
            } catch (reconnectError) {
                logger.error('Database reconnection failed:', reconnectError);
                throw new Error('Database not connected. Database connection failed during startup.');
            }
        }
        
        // Log pool status
        logger.debug('Database pool status:', {
            poolConnected: !!pool.connected,
            poolConnectionId: connectionCount
        });
        
        // Ensure we're using the correct database before each query
        if (process.env.DB_DATABASE) {
            try {
                await pool.request().query(`USE [${process.env.DB_DATABASE}]`);
            } catch (dbError) {
                logger.error(`Could not switch to database ${process.env.DB_DATABASE}:`, dbError);
                // Don't throw here, as it might just be already using the correct database
            }
        }
        
        const request = pool.request();
        
        // Add inputs
        Object.keys(inputs).forEach(key => {
            request.input(key, inputs[key]);
        });
        
        const result = await request.query(query);
        return result;
    } catch (error) {
        logger.error('Query execution failed:', error);
        throw error;
    }
}

// Execute stored procedure
async function executeProcedure(procedureName, inputs = {}, outputs = {}) {
    try {
        // Skip database operations if USE_DATABASE is false
        if (process.env.USE_DATABASE === 'false') {
            logger.debug('Skipping stored procedure (USE_DATABASE=false)');
            return { recordset: [], rowsAffected: [0], output: {} };
        }
        
        const pool = getPool();
        const request = pool.request();
        
        // Add inputs
        Object.keys(inputs).forEach(key => {
            request.input(key, inputs[key]);
        });
        
        // Add outputs
        Object.keys(outputs).forEach(key => {
            request.output(key, outputs[key]);
        });
        
        const result = await request.execute(procedureName);
        return result;
    } catch (error) {
        logger.error('Stored procedure execution failed:', error);
        throw error;
    }
}

// Transaction helper
async function executeTransaction(callback) {
    // Skip database operations if USE_DATABASE is false
    if (process.env.USE_DATABASE === 'false') {
        logger.debug('Skipping transaction (USE_DATABASE=false)');
        // Create a mock transaction object for consistency
        const mockTransaction = {
            request: () => ({
                input: () => {},
                query: async () => ({ recordset: [], rowsAffected: [0] })
            })
        };
        return callback(mockTransaction);
    }
    
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
        const result = await callback(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        logger.error('Transaction failed:', error);
        throw error;
    }
}

module.exports = {
    sql,
    connectDatabase,
    getPool,
    closeDatabase,
    executeQuery,
    executeProcedure,
    executeTransaction
};