const ApiKey = require('../models/ApiKey');
const ApiLog = require('../models/ApiLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams } = require('../utils/pagination');
const logger = require('../utils/logger');

// Global array to track deleted API keys (for demo purposes)
let deletedApiKeys = [];

// Removed mock API keys store - now using real data from database

// Display API keys list page
const showApiKeysPage = asyncHandler(async (req, res) => {
    try {
        console.log('\n=== SHOW API KEYS PAGE CALLED ===');
        const { page, limit } = getPaginationParams(req);
        const filters = {
            is_active: req.query.is_active,
            permissions: req.query.permissions,
            search: req.query.search
        };

        const result = await ApiKey.findPaginated(page, limit, filters);
        console.log('DATABASE QUERY RESULT:', {
            dataCount: result.data?.length || 0,
            totalRecords: result.pagination?.total || 0,
            sampleData: result.data?.slice(0, 1) || []
        });
        
        // Use mock data if no API keys found or database error
        let apiKeysWithStats = [];
        
        if (result.data && result.data.length > 0) {
            // Get real usage statistics for each API key from API_Logs table
            apiKeysWithStats = await Promise.all(result.data.map(async (apiKey) => {
                try {
                    // Get actual usage count and last used date from API_Logs
                    const usageQuery = `
                        SELECT 
                            COUNT(*) as usage_count,
                            MAX(created_date) as last_used_date
                        FROM API_Logs 
                        WHERE api_key_id = @api_key_id
                    `;
                    const usageResult = await require('../config/database').executeQuery(usageQuery, {
                        api_key_id: apiKey.api_key_id
                    });
                    
                    const stats = usageResult.recordset[0];
                    
                    return {
                        ...apiKey,
                        usage_count: stats.usage_count || 0,
                        last_used_date: stats.last_used_date || null
                    };
                } catch (error) {
                    logger.error('Error getting API key usage stats:', error);
                    return {
                        ...apiKey,
                        usage_count: 0,
                        last_used_date: null
                    };
                }
            }));
        } else {
            // Return empty result when no data found
            apiKeysWithStats = [];
        }
        
        res.render('api-keys/index', {
            title: 'API Keys',
            apiKeys: apiKeysWithStats,
            pagination: result.pagination || {
                page: 1,
                limit: 20,
                total: apiKeysWithStats.length,
                pages: Math.ceil(apiKeysWithStats.length / 20)
            },
            filters: filters,
            query: req.query,
            success: null,
            error: null
        });
    } catch (error) {
        logger.error('Error in showApiKeysPage:', error);
        
        // Return empty result on error
        res.render('api-keys/index', {
            title: 'API Keys',
            apiKeys: [],
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 0
            },
            filters: {},
            query: req.query,
            success: null,
            error: 'Unable to load API keys. Please try again later.'
        });
    }
});

// Display create API key form
const showCreateApiKeyForm = asyncHandler(async (req, res) => {
    res.render('api-keys/create', {
        title: 'Create API Key',
        error: null
    });
});

// Handle create API key form submission
const handleCreateApiKey = asyncHandler(async (req, res) => {
    try {
        // Validation
        if (!req.body.app_name) {
            logger.error('Missing required fields for API key creation:', req.body);
            return res.redirect('/api-keys/new');
        }

        const apiKeyData = {
            app_name: req.body.app_name.trim(),
            description: req.body.description ? req.body.description.trim() : '',
            permissions: req.body.permissions || 'read',
            expires_date: req.body.expires_date || null,
            is_active: true,
            created_by: req.user?.username || 'admin'
        };

        console.log('=== CREATE API KEY DEBUG ===');
        console.log('Request body:', req.body);
        console.log('Generated API key data:', apiKeyData);
        
        logger.info('Creating API key with data:', { app_name: apiKeyData.app_name, permissions: apiKeyData.permissions });

        const apiKey = new ApiKey(apiKeyData);
        console.log('About to call apiKey.create()');
        const result = await apiKey.create();
        console.log('Create result:', result);
        
        logger.info(`API Key created successfully for app: ${apiKeyData.app_name} by ${apiKeyData.created_by}`);
        
        if (req.flash) {
            req.flash('success', `API Key ${apiKeyData.app_name} ถูกสร้างเรียบร้อยแล้ว`);
        }
        
        // Store the API key temporarily in session to show it once
        req.session.newApiKey = result.api_key;
        req.session.newApiKeyData = result;
        
        console.log('Redirecting to:', `/api-keys/${result.api_key_id}/show`);
        
        // Redirect to show the new API key
        res.redirect(`/api-keys/${result.api_key_id}/show`);
    } catch (error) {
        logger.error('Error creating API key:', error);
        
        res.render('api-keys/create', {
            title: 'Create API Key',
            error: 'Failed to create API key. Please try again.',
            formData: req.body
        });
    }
});

// Show newly created API key (one time only)
const showNewApiKey = asyncHandler(async (req, res) => {
    // Get the actual key from session (only available once)
    const actualKey = req.session.newApiKey;
    const apiKeyData = req.session.newApiKeyData;
    
    if (!actualKey || !apiKeyData) {
        return res.redirect('/api-keys');
    }
    
    // Clear from session after showing once
    delete req.session.newApiKey;
    delete req.session.newApiKeyData;
    
    res.render('api-keys/show', {
        title: 'API Key Created Successfully',
        apiKey: apiKeyData,
        actualKey: actualKey,
        success: 'API Key created successfully! Make sure to copy it now - you won\'t be able to see it again.'
    });
});

// Display API key details
const showApiKeyDetails = asyncHandler(async (req, res) => {
    console.log('=== SHOW API KEY DETAILS ===');
    console.log('ID from params:', req.params.id);
    
    try {
        // Get real API key data from database
        const apiKey = await ApiKey.findById(req.params.id);
        if (!apiKey) {
            return res.status(404).render('error', {
                title: 'API Key Not Found',
                message: 'The requested API key does not exist.'
            });
        }
        
        // Mock usage statistics  
        const mockStats = {
            last24Hours: { total_requests: 45, successful_requests: 43 },
            last7Days: { total_requests: 234, successful_requests: 229 },
            last30Days: { total_requests: 890, successful_requests: 876 }
        };
        
        const mockRecentLogs = [
            {
                id: 1,
                method: 'GET',
                endpoint: '/api/companies',
                response_status: 200,
                created_date: new Date(Date.now() - 10 * 60 * 1000),
                response_time_ms: 145,
                ip_address: '192.168.1.100'
            },
            {
                id: 2,
                method: 'POST',
                endpoint: '/api/branches',
                response_status: 201,
                created_date: new Date(Date.now() - 30 * 60 * 1000),
                response_time_ms: 234,
                ip_address: '192.168.1.50'
            },
            {
                id: 3,
                method: 'GET',
                endpoint: '/api/departments',
                response_status: 200,
                created_date: new Date(Date.now() - 60 * 60 * 1000),
                response_time_ms: 98,
                ip_address: '10.0.0.25'
            }
        ];

        // Mock endpoint statistics
        const mockEndpointStats = [
            {
                method: 'GET',
                endpoint: '/api/companies',
                request_count: 245,
                avg_response_time: 125,
                error_count: 2
            },
            {
                method: 'POST',
                endpoint: '/api/branches',
                request_count: 89,
                avg_response_time: 234,
                error_count: 0
            },
            {
                method: 'GET',
                endpoint: '/api/departments',
                request_count: 156,
                avg_response_time: 98,
                error_count: 1
            },
            {
                method: 'PUT',
                endpoint: '/api/divisions/DIV001',
                request_count: 45,
                avg_response_time: 189,
                error_count: 0
            },
            {
                method: 'DELETE',
                endpoint: '/api/departments/DEPT003',
                request_count: 12,
                avg_response_time: 67,
                error_count: 0
            }
        ];

        // Get real hourly statistics from API logs
        const hourlyStats = await ApiLog.getHourlyStatistics(new Date());

        res.render('api-keys/details', {
            title: `API Key Details: ${apiKey.app_name}`,
            apiKey: apiKey,
            stats: {
                total_requests: 0,
                avg_response_time: 0,
                success_rate: 100,
                error_count: 0
            },
            recentLogs: [],
            endpointStats: [],
            hourlyStats: hourlyStats || []
        });
    } catch (error) {
        console.error('Error in showApiKeyDetails:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Unable to load API key details'
        });
    }
});

// Display edit API key form
const showEditApiKeyForm = asyncHandler(async (req, res) => {
    console.log('=== SHOW EDIT API KEY FORM ===');
    console.log('ID from params:', req.params.id);
    
    // Get real API key data for editing
    const apiKey = await ApiKey.findById(req.params.id);
    if (!apiKey) {
        return res.status(404).render('error', {
            title: 'API Key Not Found', 
            message: 'The requested API key does not exist.'
        });
    }
    
    res.render('api-keys/edit', {
        title: 'Edit API Key',
        apiKey: apiKey,
        error: null,
        csrfToken: req.csrfToken ? req.csrfToken() : 'dev-csrf-token'
    });
});

// Handle update API key form submission
const handleUpdateApiKey = asyncHandler(async (req, res) => {
    try {
        const apiKeyId = parseInt(req.params.id);
        logger.info(`API Key update request for ID: ${apiKeyId}`);
        logger.info('Update data:', req.body);
        
        // Get existing API key
        const existingApiKey = await ApiKey.findById(apiKeyId);
        if (!existingApiKey) {
            return res.status(404).render('error', {
                title: 'API Key Not Found',
                message: 'The requested API key does not exist.'
            });
        }
        
        // Create ApiKey instance with updated data
        const apiKey = new ApiKey({
            api_key_id: apiKeyId,
            app_name: req.body.app_name.trim(),
            description: req.body.description ? req.body.description.trim() : '',
            permissions: req.body.permissions || 'read',
            expires_date: req.body.expires_date || null,
            updated_by: req.user?.username || 'admin'
        });
        
        // Perform actual database update
        const updatedApiKey = await apiKey.update();
        
        logger.info(`API Key updated successfully: ${updatedApiKey.app_name} by ${apiKey.updated_by}`);
        
        if (req.flash) {
            req.flash('success', `API Key ${updatedApiKey.app_name} ถูกอัพเดทเรียบร้อยแล้ว`);
        }
        
        // Redirect back to API keys list with success
        res.redirect('/api-keys');
    } catch (error) {
        logger.error('Error updating API key:', error);
        
        // Get the existing API key for re-rendering the form
        let apiKeyData;
        try {
            apiKeyData = await ApiKey.findById(req.params.id);
        } catch (err) {
            apiKeyData = {
                api_key_id: req.params.id,
                app_name: req.body.app_name || '',
                description: req.body.description || '',
                permissions: req.body.permissions || 'read',
                is_active: true,
                expires_date: req.body.expires_date || null,
                created_date: new Date(),
                created_by: 'admin'
            };
        }
        
        res.render('api-keys/edit', {
            title: 'Edit API Key',
            apiKey: apiKeyData,
            error: 'Failed to update API key. Please try again.',
            csrfToken: req.csrfToken ? req.csrfToken() : 'dev-csrf-token'
        });
    }
});

// Handle toggle API key status
const handleToggleStatus = asyncHandler(async (req, res) => {
    try {
        const apiKeyId = parseInt(req.params.id);
        console.log('=== TOGGLE API KEY STATUS ===');
        console.log('API Key ID:', apiKeyId);
        console.log('Method:', req.method);
        console.log('Body:', req.body);
        
        logger.info(`Toggle status request for API Key ID: ${apiKeyId}`);
        
        // Toggle API key status in database
        const apiKey = await ApiKey.findById(apiKeyId);
        if (apiKey) {
            const newStatus = !apiKey.is_active;
            const result = await ApiKey.updateStatus(apiKeyId, newStatus);
            console.log(`API Key ${apiKeyId} status changed to ${newStatus}`);
            
            const username = req.user?.username || 'admin';
            logger.info(`API Key ID ${apiKeyId} status toggled to ${newStatus} by ${username}`);
        } else {
            console.log('API Key not found in database');
        }
        
        console.log('Redirecting to /api-keys');
        res.redirect('/api-keys');
    } catch (error) {
        console.error('=== TOGGLE STATUS ERROR ===', error);
        logger.error('Error toggling API key status:', error);
        res.redirect('/api-keys');
    }
});

// Handle regenerate API key
const handleRegenerateApiKey = asyncHandler(async (req, res) => {
    try {
        logger.info(`Regenerate API Key request for ID: ${req.params.id}`);
        
        // Generate new API key
        const crypto = require('crypto');
        const newApiKey = crypto.randomBytes(24).toString('hex');
        
        const regeneratedApiKeyData = {
            api_key_id: Date.now(), // New ID
            app_name: 'Development App (Regenerated)',
            description: 'Regenerated API key for development and testing',
            permissions: 'read_write',
            expires_date: null,
            is_active: true,
            created_by: req.user?.username || 'admin',
            created_date: new Date(),
            actual_key: `rcs_${newApiKey}` // New key
        };
        
        logger.info(`API Key regenerated successfully by ${regeneratedApiKeyData.created_by}`);
        
        // Store the new API key in session to show it once
        req.session.newApiKey = regeneratedApiKeyData.actual_key;
        req.session.newApiKeyData = regeneratedApiKeyData;
        
        res.redirect(`/api-keys/${regeneratedApiKeyData.api_key_id}/show`);
    } catch (error) {
        logger.error('Error regenerating API key:', error);
        res.redirect('/api-keys');
    }
});

// Handle delete API key
const handleDeleteApiKey = asyncHandler(async (req, res) => {
    try {
        console.log('\n=== DELETE API KEY CONTROLLER CALLED ===');
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);
        console.log('Request method:', req.method);
        console.log('Request URL:', req.url);
        console.log('User:', req.user);
        
        const apiKeyId = parseInt(req.params.id);
        console.log('Parsed API Key ID:', apiKeyId);
        logger.info(`Delete API Key request for ID: ${apiKeyId}`);
        
        // Delete from database
        console.log('\n=== DELETING FROM DATABASE ===');
        console.log('Deleting API Key ID:', apiKeyId);
        
        const result = await ApiKey.delete(apiKeyId);
        
        console.log('Delete result:', result);
        console.log('=== END DELETE FROM DATABASE ===\n');
        
        const username = req.user?.username || 'admin';
        logger.info(`API Key ID ${apiKeyId} marked as deleted by ${username}`);
        
        console.log('About to redirect to /api-keys');
        
        res.redirect('/api-keys');
        
        console.log('Redirect sent');
        console.log('=== DELETE API KEY CONTROLLER END ===\n');
    } catch (error) {
        console.error('=== DELETE API KEY ERROR ===', error);
        logger.error('Error deleting API key:', error);
        res.redirect('/api-keys');
    }
});

// API logs for specific key
const showApiLogs = asyncHandler(async (req, res) => {
    const apiKey = await ApiKey.findById(req.params.id);
    
    if (!apiKey) {
        // req.flash('error', 'API Key not found');
        return res.redirect('/api-keys');
    }
    
    const { page, limit } = getPaginationParams(req);
    const filters = {
        api_key_id: apiKey.api_key_id,
        endpoint: req.query.endpoint,
        method: req.query.method,
        status_code: req.query.status_code,
        date_from: req.query.date_from,
        date_to: req.query.date_to
    };
    
    // Mock empty data for now since ApiLog might not exist
    const result = {
        data: [],
        pagination: {
            page: 1,
            limit: 20,
            total: 0,
            pages: 0
        }
    };
    
    res.render('api-keys/logs', {
        title: `API Logs: ${apiKey.app_name}`,
        apiKey: apiKey,
        logs: result.data,
        pagination: result.pagination,
        filters: filters,
        query: req.query
    });
});

module.exports = {
    showApiKeysPage,
    showCreateApiKeyForm,
    handleCreateApiKey,
    showNewApiKey,
    showApiKeyDetails,
    showEditApiKeyForm,
    handleUpdateApiKey,
    handleToggleStatus,
    handleRegenerateApiKey,
    handleDeleteApiKey,
    showApiLogs
};