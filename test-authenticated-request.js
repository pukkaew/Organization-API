require('dotenv').config();
const express = require('express');
const session = require('express-session');
const Company = require('./src/models/Company');
const { connectDatabase } = require('./src/config/database');
const companyController = require('./src/controllers/companyController');

async function testController() {
    console.log('🔍 Testing Company Controller Directly...\n');
    
    try {
        // Connect database first
        await connectDatabase();
        console.log('✅ Database connected for test\n');
        
        // Create mock request and response objects
        const req = {
            query: {},
            user: { username: 'test' },
            session: { user: { username: 'test' } }
        };
        
        const res = {
            render: (view, data) => {
                console.log('✅ Controller render called with:', view);
                console.log('📊 Data passed to view:', {
                    companies: data.companies?.length || 'undefined',
                    pagination: data.pagination || 'undefined',
                    error: data.error || 'none'
                });
                
                if (data.companies && data.companies.length > 0) {
                    console.log('🎉 COMPANIES FOUND:', data.companies.map(c => 
                        `${c.company_code} - ${c.company_name_th}`
                    ));
                }
            },
            status: (code) => ({
                json: (data) => {
                    console.log('❌ Error response:', code, data);
                },
                render: (view, data) => {
                    console.log('❌ Error render:', code, view, data);
                }
            })
        };
        
        console.log('🎯 Calling companyController.showCompaniesPage...');
        
        try {
            await companyController.showCompaniesPage(req, res);
            console.log('✅ Controller call completed successfully');
        } catch (error) {
            console.log('❌ Controller error:', error.message);
            console.log('🔍 Stack:', error.stack);
        }
        
    } catch (error) {
        console.error('❌ Test setup error:', error.message);
        console.error('🔍 Stack:', error.stack);
    }
    
    console.log('\n🏁 Test completed');
    process.exit(0);
}

testController();