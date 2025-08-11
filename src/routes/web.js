const express = require('express');
const router = express.Router();

// Import middleware
const { requireAuth, optionalAuth, login, logout, showLoginPage, storeReturnTo } = require('../middleware/auth');

// Import controllers
const companyController = require('../controllers/companyController');
const dashboardController = require('../controllers/dashboardController');
const apiKeyController = require('../controllers/apiKeyController');

// Import route files
const companyRoutes = require('./companyRoutes');
const branchRoutes = require('./branchRoutes');
const divisionRoutes = require('./divisionRoutes');
const departmentRoutes = require('./departmentRoutes');
const apiKeyRoutes = require('./apiKeyRoutes');


// Store return URL before checking auth
router.use(storeReturnTo);

// Public routes (no auth required)
router.get('/login', showLoginPage);
router.post('/login', (req, res, next) => {
    console.log('POST /login route hit with body:', req.body);
    login(req, res, next);
});
router.get('/logout', logout);

// Health check route (public)
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});


// Apply auth middleware to all routes below this line
router.use(requireAuth);

// Middleware to set common variables for views
router.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.query = req.query;
    res.locals.user = req.session?.user || null;
    next();
});

// Dashboard route
router.get('/', dashboardController.showDashboard);

// Company routes
router.use('/companies', companyRoutes);

// Branch routes
router.use('/branches', branchRoutes);

// Division routes
router.use('/divisions', divisionRoutes);

// Department routes
router.use('/departments', departmentRoutes);

// API Key management routes
router.use('/api-keys', (req, res, next) => {
    console.log('=== API KEYS MAIN ROUTE ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('OriginalUrl:', req.originalUrl);
    console.log('User:', req.user || req.session?.user);
    next();
}, apiKeyRoutes);

// Documentation route
router.get('/docs', (req, res) => {
    res.render('docs/index', {
        title: 'API Documentation'
    });
});

// AJAX endpoints (after auth but accessible to authenticated users)
const Branch = require('../models/Branch');
const Division = require('../models/Division');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/ajax/companies/:companyCode/branches', asyncHandler(async (req, res) => {
    const branches = await Branch.findByCompany(req.params.companyCode);
    res.json({ success: true, data: branches });
}));

router.get('/ajax/companies/:companyCode/divisions', asyncHandler(async (req, res) => {
    const divisions = await Division.findByCompany(req.params.companyCode);
    res.json({ success: true, data: divisions });
}));

module.exports = router;