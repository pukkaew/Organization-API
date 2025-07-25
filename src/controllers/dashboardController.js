// Path: /src/controllers/dashboardController.js
const { asyncHandler } = require('../middleware/errorHandler');
const companyService = require('../services/companyService');
const organizationService = require('../services/organizationService');
const apiLogService = require('../services/apiLogService');
const logger = require('../utils/logger');

/**
 * Dashboard Controller
 * Handles dashboard views and statistics
 */

// Show dashboard
const index = asyncHandler(async (req, res) => {
    try {
        // Get organization statistics
        const stats = await organizationService.getOrganizationStats();
        
        // Get API usage statistics for today
        const apiStats = await apiLogService.getTodayStats();
        
        // Get recent activities
        const activities = await organizationService.getRecentActivities(10);
        
        // Render dashboard view
        res.render('dashboard/index', {
            title: 'Dashboard',
            activeMenu: 'dashboard',
            stats: stats,
            apiStats: apiStats,
            recentActivities: activities,
            user: req.session?.user || null
        });
    } catch (error) {
        logger.error('Dashboard error:', error);
        res.render('dashboard/index', {
            title: 'Dashboard',
            activeMenu: 'dashboard',
            stats: {
                companies: 0,
                branches: 0,
                divisions: 0,
                departments: 0,
                active_divisions: 0,
                headquarters_count: 0
            },
            apiStats: {
                totalCalls: 0,
                activeKeys: 0
            },
            recentActivities: [],
            user: req.session?.user || null
        });
    }
});

// Get chart data via AJAX
const getChartData = asyncHandler(async (req, res) => {
    const { type, period = '7days' } = req.query;
    
    let data;
    switch (type) {
        case 'organization':
            data = await organizationService.getOrganizationChartData();
            break;
        case 'api':
            data = await apiLogService.getUsageChartData(period);
            break;
        default:
            return res.status(400).json({ error: 'Invalid chart type' });
    }
    
    res.json({ success: true, data });
});

// Export stats as JSON/CSV
const exportStats = asyncHandler(async (req, res) => {
    const { format = 'json' } = req.query;
    const stats = await organizationService.getOrganizationStats();
    
    if (format === 'csv') {
        const csv = convertStatsToCSV(stats);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="organization-stats.csv"');
        res.send(csv);
    } else {
        res.json(stats);
    }
});

// Helper function to convert stats to CSV
function convertStatsToCSV(stats) {
    const rows = [
        ['Metric', 'Value'],
        ['Total Companies', stats.totalCompanies],
        ['Total Branches', stats.totalBranches],
        ['Total Divisions', stats.totalDivisions],
        ['Total Departments', stats.totalDepartments],
        ['Active Divisions', stats.active_divisions],
        ['Headquarters', stats.headquarters_count]
    ];
    
    return rows.map(row => row.join(',')).join('\n');
}

module.exports = {
    showDashboard: index,  // Map to expected function name
    index,
    getChartData,
    exportStats
};