require('dotenv').config();

async function testServerDirect() {
    console.log('🔍 Testing Server Direct Access...\n');
    
    try {
        // Test 1: Import and test dashboard controller directly
        console.log('═══ 1. DIRECT CONTROLLER TEST ═══');
        
        const dashboardController = require('./src/controllers/dashboardController');
        console.log('✅ Dashboard controller loaded');
        
        // Mock request and response
        const mockReq = {
            session: { user: { username: 'admin' } }
        };
        
        const mockRes = {
            render: (template, data) => {
                console.log(`📄 Render called: ${template}`);
                console.log(`📊 Data passed:`, JSON.stringify(data, null, 2));
            }
        };
        
        console.log('🧪 Testing dashboard index function...');
        
        try {
            await dashboardController.index(mockReq, mockRes);
            console.log('✅ Dashboard controller executed successfully');
        } catch (error) {
            console.log('❌ Dashboard controller failed:', error.message);
            console.log('Stack:', error.stack);
        }
        
        // Test 2: Test organization service directly
        console.log('\n═══ 2. ORGANIZATION SERVICE TEST ═══');
        
        const OrganizationService = require('./src/services/organizationService');
        
        try {
            const stats = await OrganizationService.getOrganizationStats();
            console.log('✅ Organization stats:', stats);
        } catch (error) {
            console.log('❌ Organization service failed:', error.message);
            console.log('Stack:', error.stack);
        }
        
        // Test 3: Test API log service
        console.log('\n═══ 3. API LOG SERVICE TEST ═══');
        
        const apiLogService = require('./src/services/apiLogService');
        
        try {
            const apiStats = await apiLogService.getTodayStats();
            console.log('✅ API stats:', apiStats);
        } catch (error) {
            console.log('❌ API log service failed:', error.message);
            console.log('Stack:', error.stack);
        }
        
        // Test 4: Test recent activities
        console.log('\n═══ 4. RECENT ACTIVITIES TEST ═══');
        
        try {
            const activities = await OrganizationService.getRecentActivities(10);
            console.log('✅ Recent activities:', activities);
        } catch (error) {
            console.log('❌ Recent activities failed:', error.message);
            console.log('Stack:', error.stack);
        }
        
        // Test 5: Start minimal server
        console.log('\n═══ 5. MINIMAL SERVER TEST ═══');
        
        const express = require('express');
        const app = express();
        
        app.get('/test-dashboard', async (req, res) => {
            try {
                const OrganizationService = require('./src/services/organizationService');
                const stats = await OrganizationService.getOrganizationStats();
                
                res.json({
                    success: true,
                    stats: stats,
                    message: 'Dashboard data loaded successfully'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    stack: error.stack
                });
            }
        });
        
        const testServer = app.listen(3009, () => {
            console.log('✅ Test server started on port 3009');
            console.log('🔗 Test URL: http://localhost:3009/test-dashboard');
        });
        
        // Test the endpoint
        setTimeout(async () => {
            try {
                const axios = require('axios');
                const response = await axios.get('http://localhost:3009/test-dashboard');
                console.log('✅ Test endpoint response:', response.data);
            } catch (error) {
                console.log('❌ Test endpoint failed:', error.message);
            } finally {
                testServer.close();
                process.exit(0);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Critical error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testServerDirect();