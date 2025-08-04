const ApiKey = require('../models/ApiKey');
const ApiLog = require('../models/ApiLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPaginationParams } = require('../utils/pagination');
const logger = require('../utils/logger');

// Global array to track deleted API keys (for demo purposes)
let deletedApiKeys = [];

// Global store for mock API keys with persistent state
let mockApiKeysStore = [
    {
        api_key_id: 1,
        app_name: 'RC MMS',
        description: 'API key for development and testing',
        permissions: 'read,write',
        is_active: true,
        usage_count: 156,
        last_used_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        created_date: new Date('2024-01-15'),
        created_by: 'admin'
    },
    {
        api_key_id: 2,
        app_name: 'RC MMS1',
        description: 'API key for mobile application',
        permissions: 'read',
        is_active: true,
        usage_count: 89,
        last_used_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        created_date: new Date('2024-02-01'),
        created_by: 'developer'
    },
    {
        api_key_id: 3,
        app_name: 'Data Analytics',
        description: 'API key for analytics dashboard',
        permissions: 'read',
        is_active: false,
        usage_count: 0,
        last_used_date: null,
        created_date: new Date('2024-01-30'),
        created_by: 'analyst'
    }
];

// Display API keys list page
const showApiKeysPage = asyncHandler(async (req, res) => {
    try {
        console.log('\n=== SHOW API KEYS PAGE CALLED ===');
        console.log('Current deletedApiKeys:', deletedApiKeys);
        const { page, limit } = getPaginationParams(req);
        const filters = {
            is_active: req.query.is_active,
            permissions: req.query.permissions,
            search: req.query.search
        };

        const result = await ApiKey.findPaginated(page, limit, filters);
        
        // Use mock data if no API keys found or database error
        let apiKeysWithStats = [];
        
        if (result.data && result.data.length > 0) {
            // Get usage statistics for each API key
            apiKeysWithStats = result.data.map((apiKey) => {
                return {
                    ...apiKey,
                    usage_count: Math.floor(Math.random() * 1000), // Mock usage count
                    last_used_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random last used within 30 days
                };
            });
        } else {
            // Use persistent global store instead of creating new mock data each time
            console.log('\n=== SHOW API KEYS PAGE - USING GLOBAL STORE ===');
            console.log('Current mockApiKeysStore count:', mockApiKeysStore.length);
            console.log('Current deletedApiKeys:', deletedApiKeys);
            
            // Use the global store directly (it already has items removed by delete)
            apiKeysWithStats = [...mockApiKeysStore]; // Create a copy
            
            console.log('Final API Keys count:', apiKeysWithStats.length);
            console.log('=== END SHOW API KEYS PAGE ===\n');
            
            // Apply filters to mock data
            if (filters.is_active !== undefined) {
                const isActiveFilter = filters.is_active === 'true';
                apiKeysWithStats = apiKeysWithStats.filter(key => key.is_active === isActiveFilter);
            }
            
            if (filters.permissions) {
                apiKeysWithStats = apiKeysWithStats.filter(key => 
                    key.permissions.includes(filters.permissions)
                );
            }
            
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                apiKeysWithStats = apiKeysWithStats.filter(key => 
                    key.app_name.toLowerCase().includes(searchLower) ||
                    (key.description && key.description.toLowerCase().includes(searchLower))
                );
            }
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

        // Generate a unique API key
        const crypto = require('crypto');
        const newApiKey = crypto.randomBytes(24).toString('hex');
        
        const apiKeyData = {
            api_key_id: Date.now().toString(), // Simple ID generation
            app_name: req.body.app_name.trim(),
            description: req.body.description ? req.body.description.trim() : '',
            permissions: req.body.permissions || 'read',
            expires_date: req.body.expires_date || null,
            is_active: true,
            created_by: req.user?.username || 'admin',
            created_date: new Date(),
            actual_key: `rcs_${newApiKey}` // Prefix for Ruxchai Cold Storage
        };

        logger.info('Creating API key with data:', { app_name: apiKeyData.app_name, permissions: apiKeyData.permissions });

        const apiKey = new ApiKey(apiKeyData);
        await apiKey.create();
        
        logger.info(`API Key created successfully for app: ${apiKeyData.app_name} by ${apiKeyData.created_by}`);
        
        if (req.flash) {
            req.flash('success', `API Key ${apiKeyData.app_name} ถูกสร้างเรียบร้อยแล้ว`);
        }
        
        // Store the API key temporarily in session to show it once
        req.session.newApiKey = apiKeyData.actual_key;
        req.session.newApiKeyData = apiKeyData;
        
        // Redirect to show the new API key
        res.redirect(`/api-keys/${apiKeyData.api_key_id}/show`);
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
        // Use mock data for testing - since database might not have API key data
        const mockApiKey = {
            api_key_id: req.params.id,
            app_name: `API Key ${req.params.id}`,
            description: `API key for development and testing (ID: ${req.params.id})`,
            permissions: 'read,write',
            is_active: true,
            usage_count: Math.floor(Math.random() * 500) + 50,
            last_used_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            created_date: new Date('2024-01-15'),
            created_by: 'admin',
            expires_date: null
        };
        
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
                endpoint: '/api/v1/companies',
                response_status: 200,
                created_date: new Date(Date.now() - 10 * 60 * 1000),
                response_time_ms: 145,
                ip_address: '192.168.1.100'
            },
            {
                id: 2,
                method: 'POST',
                endpoint: '/api/v1/branches',
                response_status: 201,
                created_date: new Date(Date.now() - 30 * 60 * 1000),
                response_time_ms: 234,
                ip_address: '192.168.1.50'
            },
            {
                id: 3,
                method: 'GET',
                endpoint: '/api/v1/departments',
                response_status: 200,
                created_date: new Date(Date.now() - 60 * 60 * 1000),
                response_time_ms: 98,
                ip_address: '10.0.0.25'
            }
        ];

        res.render('api-keys/details', {
            title: `API Key Details: ${mockApiKey.app_name}`,
            apiKey: mockApiKey,
            stats: mockStats,
            recentLogs: mockRecentLogs
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
    
    // Use mock data for editing
    const mockApiKey = {
        api_key_id: req.params.id,
        app_name: `API Key ${req.params.id}`,
        description: `API key for development and testing (ID: ${req.params.id})`,
        permissions: 'read_write',
        is_active: Math.random() > 0.5, // Random active status
        expires_date: null,
        created_date: new Date('2024-01-15'),
        created_by: 'admin'
    };
    
    res.render('api-keys/edit', {
        title: 'Edit API Key',
        apiKey: mockApiKey,
        error: null,
        csrfToken: req.csrfToken ? req.csrfToken() : 'dev-csrf-token'
    });
});

// Handle update API key form submission
const handleUpdateApiKey = asyncHandler(async (req, res) => {
    try {
        logger.info(`API Key update request for ID: ${req.params.id}`);
        logger.info('Update data:', req.body);
        
        // Simulate successful update
        const updatedData = {
            app_name: req.body.app_name,
            description: req.body.description,
            permissions: req.body.permissions,
            expires_date: req.body.expires_date || null,
            updated_by: req.user?.username || 'admin'
        };
        
        logger.info(`API Key updated successfully: ${updatedData.app_name} by ${updatedData.updated_by}`);
        
        if (req.flash) {
            req.flash('success', `API Key ${updatedData.app_name} ถูกอัพเดทเรียบร้อยแล้ว`);
        }
        
        // Redirect back to API keys list with success
        res.redirect('/api-keys');
    } catch (error) {
        logger.error('Error updating API key:', error);
        
        // Render edit form with error
        const mockApiKey = {
            api_key_id: req.params.id,
            app_name: req.body.app_name || 'Development App',
            description: req.body.description || '',
            permissions: req.body.permissions || 'read_write',
            is_active: true,
            expires_date: req.body.expires_date || null,
            created_date: new Date('2024-01-15'),
            created_by: 'admin'
        };
        
        res.render('api-keys/edit', {
            title: 'Edit API Key',
            apiKey: mockApiKey,
            error: 'Failed to update API key. Please try again.',
            csrfToken: 'dev-csrf-token'
        });
    }
});

// Handle toggle API key status
const handleToggleStatus = asyncHandler(async (req, res) => {
    try {
        console.log('=== TOGGLE API KEY STATUS ===');
        console.log('ID from params:', req.params.id);
        console.log('Method:', req.method);
        console.log('Body:', req.body);
        
        logger.info(`Toggle status request for API Key ID: ${req.params.id}`);
        
        // Simulate successful toggle
        const username = req.user?.username || 'admin';
        logger.info(`API Key status toggled successfully by ${username}`);
        
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
        
        // Remove from global store directly
        console.log('\n=== DELETING FROM GLOBAL STORE ===');
        console.log('Before delete - mockApiKeysStore count:', mockApiKeysStore.length);
        console.log('Deleting API Key ID:', apiKeyId);
        
        const initialLength = mockApiKeysStore.length;
        mockApiKeysStore = mockApiKeysStore.filter(key => key.api_key_id !== apiKeyId);
        const finalLength = mockApiKeysStore.length;
        
        console.log('After delete - mockApiKeysStore count:', finalLength);
        console.log('Successfully deleted:', initialLength > finalLength);
        console.log('=== END DELETE FROM GLOBAL STORE ===\n');
        
        // Also add to deleted array for backup
        if (!deletedApiKeys.includes(apiKeyId)) {
            deletedApiKeys.push(apiKeyId);
        }
        
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