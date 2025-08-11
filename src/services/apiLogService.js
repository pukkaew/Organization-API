// Path: /src/services/apiLogService.js
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

class ApiLogService {
    /**
     * Get today's API usage statistics
     */
    static async getTodayStats() {
        // Use mock data if USE_DATABASE is false
        if (process.env.USE_DATABASE === 'false') {
            const ApiKey = require('../models/ApiKey');
            const allActiveKeys = ApiKey.mockApiKeys.filter(key => key.is_active);
            
            // Only count keys with usage history (exclude newly created keys)
            // Simulate that only older keys have usage data
            const keysWithUsage = allActiveKeys.filter(key => {
                // Consider keys as "used" only if they were created more than 1 hour ago
                // or if they have specific conditions that indicate actual usage
                const createdDate = new Date(key.created_date);
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                return createdDate < oneHourAgo;
            });
            
            // If no keys meet the usage criteria, use a fixed number for demo
            const usedKeysCount = keysWithUsage.length > 0 ? keysWithUsage.length : Math.max(0, allActiveKeys.length - 1);
            
            // Generate realistic mock statistics
            const totalCalls = usedKeysCount > 0 ? Math.floor(Math.random() * 5000) + 8000 : 0;
            const todayCalls = usedKeysCount > 0 ? Math.floor(Math.random() * 500) + 200 : 0;
            
            return {
                todayCalls: todayCalls,
                uniqueKeys: usedKeysCount,
                avgResponseTime: usedKeysCount > 0 ? Math.floor(Math.random() * 200) + 100 : 0,
                errorCount: usedKeysCount > 0 ? Math.floor(Math.random() * 20) + 5 : 0,
                totalCalls: totalCalls,
                activeKeys: usedKeysCount
            };
        }
        
        const cacheKey = 'api:stats:today';
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            // Use SQLite-compatible query if using SQLite
            const isSQLite = process.env.DB_TYPE === 'sqlite';
            const query = isSQLite ? `
                SELECT 
                    COUNT(*) as todayCalls,
                    COUNT(DISTINCT api_key_id) as uniqueKeys,
                    AVG(response_time_ms) as avgResponseTime,
                    SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as errorCount
                FROM API_Logs
                WHERE date(created_date) = date('now')
            ` : `
                SELECT 
                    COUNT(*) as todayCalls,
                    COUNT(DISTINCT api_key_id) as uniqueKeys,
                    AVG(response_time_ms) as avgResponseTime,
                    SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as errorCount
                FROM API_Logs
                WHERE CAST(created_date AS DATE) = CAST(GETDATE() AS DATE)
            `;
            
            const result = await executeQuery(query);
            const stats = result.recordset[0] || {
                todayCalls: 0,
                uniqueKeys: 0,
                avgResponseTime: 0,
                errorCount: 0
            };

            await cache.set(cacheKey, stats, 300); // Cache for 5 minutes
            return stats;
        } catch (error) {
            logger.error('Error getting today API stats:', error);
            return {
                todayCalls: 0,
                uniqueKeys: 0,
                avgResponseTime: 0,
                errorCount: 0
            };
        }
    }

    /**
     * Get API usage chart data
     */
    static async getUsageChartData(period = '7days') {
        try {
            const isSQLite = process.env.DB_TYPE === 'sqlite';
            let query;
            const inputs = {};
            
            // Determine days based on period
            let days = 7;
            switch (period) {
            case '7days': days = 7; break;
            case '30days': days = 30; break;
            case '90days': days = 90; break;
            default: throw new Error('Invalid period');
            }

            if (isSQLite) {
                // Use parameterized query
                const dateFilter = new Date();
                dateFilter.setDate(dateFilter.getDate() - days);
                query = `
                    SELECT 
                        date(created_date) as date,
                        COUNT(*) as calls,
                        SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as errors
                    FROM API_Logs
                    WHERE created_date >= @dateFilter
                    GROUP BY date(created_date)
                    ORDER BY date
                `;
                inputs.dateFilter = dateFilter.toISOString();
            } else {
                query = `
                    SELECT 
                        CAST(created_date AS DATE) as date,
                        COUNT(*) as calls,
                        SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as errors
                    FROM API_Logs
                    WHERE created_date >= DATEADD(day, @days, GETDATE())
                    GROUP BY CAST(created_date AS DATE)
                    ORDER BY date
                `;
                inputs.days = -days;
            }

            const result = await executeQuery(query, inputs);
            return result.recordset;
        } catch (error) {
            logger.error('Error getting API usage chart data:', error);
            return [];
        }
    }

    /**
     * Log API request
     */
    static async logRequest(requestData) {
        try {
            const query = `
                INSERT INTO API_Logs (
                    api_key_id, endpoint, method, request_body,
                    response_status, response_time_ms, ip_address,
                    user_agent, error_message
                ) VALUES (
                    @api_key_id, @endpoint, @method, @request_body,
                    @response_status, @response_time_ms, @ip_address,
                    @user_agent, @error_message
                )
            `;

            await executeQuery(query, requestData);
        } catch (error) {
            logger.error('Error logging API request:', error);
        }
    }

    /**
     * Get API usage by endpoint
     */
    static async getUsageByEndpoint(days = 7) {
        try {
            const query = `
                SELECT 
                    endpoint,
                    method,
                    COUNT(*) as count,
                    AVG(response_time_ms) as avg_response_time,
                    SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success_count,
                    SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as error_count
                FROM API_Logs
                WHERE created_date >= DATEADD(day, @days, GETDATE())
                GROUP BY endpoint, method
                ORDER BY count DESC
            `;

            const result = await executeQuery(query, { days: -days });
            return result.recordset;
        } catch (error) {
            logger.error('Error getting usage by endpoint:', error);
            return [];
        }
    }

    /**
     * Get API key statistics
     */
    static async getApiKeyStats(apiKeyId) {
        try {
            const query = `
                SELECT 
                    ak.app_name,
                    ak.permissions,
                    COUNT(al.log_id) as total_requests,
                    AVG(al.response_time_ms) as avg_response_time,
                    SUM(CASE WHEN al.response_status >= 200 AND al.response_status < 300 THEN 1 ELSE 0 END) as success_count,
                    SUM(CASE WHEN al.response_status >= 400 THEN 1 ELSE 0 END) as error_count,
                    MAX(al.created_date) as last_used
                FROM API_Keys ak
                LEFT JOIN API_Logs al ON ak.api_key_id = al.api_key_id
                WHERE ak.api_key_id = @api_key_id
                GROUP BY ak.app_name, ak.permissions
            `;

            const result = await executeQuery(query, { api_key_id: apiKeyId });
            return result.recordset[0];
        } catch (error) {
            logger.error('Error getting API key stats:', error);
            return null;
        }
    }

    /**
     * Clean old logs
     */
    static async cleanOldLogs(daysToKeep = 90) {
        try {
            const query = `
                DELETE FROM API_Logs 
                WHERE created_date < DATEADD(day, @days, GETDATE())
            `;

            const result = await executeQuery(query, { days: -daysToKeep });
            logger.info(`Cleaned ${result.rowsAffected[0]} old API logs`);
            return result.rowsAffected[0];
        } catch (error) {
            logger.error('Error cleaning old logs:', error);
            return 0;
        }
    }
}

module.exports = ApiLogService;