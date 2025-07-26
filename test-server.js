#!/usr/bin/env node

// Test server to isolate the companies list issue
const express = require('express');
const { connectDatabase } = require('./src/config/database');
const Company = require('./src/models/Company');
const { getPaginationParams } = require('./src/utils/pagination');

const app = express();
const port = 3006;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route that mimics the companies list controller
app.get('/test-companies', async (req, res) => {
    try {
        console.log('Processing companies list request...');
        
        const { page, limit } = getPaginationParams(req);
        const filters = {
            is_active: req.query.is_active,
            search: req.query.search
        };

        console.log('Parameters:', { page, limit, filters });
        
        const result = await Company.findPaginated(page, limit, filters);
        
        console.log('Query successful:', result.data.length, 'companies found');
        
        res.json({
            success: true,
            companies: result.data,
            pagination: result.pagination
        });
        
    } catch (error) {
        console.error('Error in test route:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Initialize and start server
(async () => {
    try {
        console.log('Starting test server...');
        await connectDatabase();
        console.log('Database connected');
        
        app.listen(port, () => {
            console.log(`Test server running on http://localhost:${port}`);
            console.log('Test the companies endpoint: http://localhost:3005/test-companies');
        });
        
    } catch (error) {
        console.error('Failed to start test server:', error);
        process.exit(1);
    }
})();