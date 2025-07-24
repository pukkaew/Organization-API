// =============================================
// Clean Test Data Script - Node.js
// Organization Structure Management System  
// =============================================

// Load environment variables
require('dotenv').config();

const { executeQuery, connectDatabase, closeDatabase } = require('../../src/config/database');
const fs = require('fs');
const path = require('path');

async function cleanTestData() {
    try {
        console.log('🧹 Starting test data cleanup...');
        
        // Connect to database
        await connectDatabase();
        console.log('✅ Database connected');
        
        // Execute cleanup statements directly
        const cleanupQueries = [
            'DELETE FROM [dbo].[API_Logs]',
            'DELETE FROM [dbo].[API_Keys]', 
            'DELETE FROM [dbo].[Departments]',
            'DELETE FROM [dbo].[Divisions]',
            'DELETE FROM [dbo].[Branches]',
            'DELETE FROM [dbo].[Companies]'
        ];
        
        console.log(`📋 Executing ${cleanupQueries.length} cleanup statements`);
        
        // Execute each cleanup statement
        for (let i = 0; i < cleanupQueries.length; i++) {
            const query = cleanupQueries[i];
            try {
                const result = await executeQuery(query);
                console.log(`✅ ${query} - Deleted ${result.rowsAffected[0]} records`);
            } catch (error) {
                console.log(`⚠️  ${query} failed:`, error.message);
            }
        }
        
        // Reset identity columns
        const resetQueries = [
            'DBCC CHECKIDENT (\'[dbo].[API_Keys]\', RESEED, 0)',
            'DBCC CHECKIDENT (\'[dbo].[API_Logs]\', RESEED, 0)'
        ];
        
        console.log(`🔄 Resetting identity columns...`);
        for (const query of resetQueries) {
            try {
                await executeQuery(query);
                console.log(`✅ ${query} executed successfully`);
            } catch (error) {
                console.log(`⚠️  ${query} failed:`, error.message);
            }
        }
        
        // Verify cleanup by checking record counts
        console.log('\n📊 Verifying cleanup...');
        
        const tables = ['Companies', 'Branches', 'Divisions', 'Departments', 'API_Keys', 'API_Logs'];
        let totalRecords = 0;
        
        for (const table of tables) {
            try {
                const result = await executeQuery(`SELECT COUNT(*) as count FROM [dbo].[${table}]`);
                const count = result.recordset[0].count;
                totalRecords += count;
                console.log(`  ${table}: ${count} records`);
            } catch (error) {
                console.log(`  ${table}: Error checking - ${error.message}`);
            }
        }
        
        console.log(`\n📈 Total remaining records: ${totalRecords}`);
        
        if (totalRecords === 0) {
            console.log('🎉 SUCCESS: All test data has been cleaned successfully!');
        } else {
            console.log('⚠️  WARNING: Some data may still remain in the database.');
        }
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        // Close database connection
        try {
            await closeDatabase();
            console.log('✅ Database connection closed');
        } catch (error) {
            console.error('⚠️  Error closing database:', error);
        }
    }
}

// Run cleanup if called directly
if (require.main === module) {
    cleanTestData()
        .then(() => {
            console.log('\n🏁 Cleanup process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Cleanup process failed:', error);
            process.exit(1);
        });
}

module.exports = { cleanTestData };