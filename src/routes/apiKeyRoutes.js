// Path: /src/routes/apiKeyRoutes.js
const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');

// Debug middleware for all routes
router.use((req, res, next) => {
    console.log('=== API KEY ROUTE DEBUG ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Path:', req.path);
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('================================');
    next();
});

// Display all API keys
router.get('/', apiKeyController.showApiKeysPage);

// Display create form
router.get('/new', apiKeyController.showCreateApiKeyForm);

// Create API key
router.post('/', apiKeyController.handleCreateApiKey);

// Show newly created API key (one time only) - MUST be before /:id
router.get('/:id/show', apiKeyController.showNewApiKey);

// Display edit form - MUST be before /:id
router.get('/:id/edit', apiKeyController.showEditApiKeyForm);

// API logs for specific key - MUST be before /:id
router.get('/:id/logs', apiKeyController.showApiLogs);

// Update API key
router.put('/:id', apiKeyController.handleUpdateApiKey);
router.post('/:id/update', apiKeyController.handleUpdateApiKey);

// Toggle status
router.post('/:id/toggle-status', apiKeyController.handleToggleStatus);

// Regenerate API key
router.post('/:id/regenerate', apiKeyController.handleRegenerateApiKey);

// Delete API key - handle both GET and POST for testing
router.get('/:id/delete', (req, res, next) => {
    console.log('=== DELETE API KEY GET ROUTE HIT ===');
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    next();
}, apiKeyController.handleDeleteApiKey);

router.post('/:id/delete', (req, res, next) => {
    console.log('=== DELETE API KEY POST ROUTE HIT ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    next();
}, apiKeyController.handleDeleteApiKey);

// TEST: Simple response for debugging
router.get('/:id/test', (req, res) => {
    res.json({
        success: true,
        message: 'Test route working',
        id: req.params.id,
        timestamp: new Date().toISOString()
    });
});

// Show API key details - MUST be LAST among /:id routes
router.get('/:id', apiKeyController.showApiKeyDetails);

module.exports = router;