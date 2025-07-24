// Initialize SQLite Database
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { connectDatabase, executeQuery, closeDatabase } = require('../src/config/sqlite');

async function initializeDatabase() {
    console.log('🚀 Initializing SQLite database...\n');
    
    try {
        // Connect to database
        await connectDatabase();
        console.log('✅ Connected to SQLite database\n');
        
        // Read and execute schema
        const schemaPath = path.join(__dirname, 'sqlite-schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        // Split statements by semicolon
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        console.log('📄 Executing schema statements...');
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    await executeQuery(statement);
                    console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
                } catch (error) {
                    if (error.message.includes('already exists') || 
                        error.message.includes('UNIQUE constraint failed')) {
                        console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)`);
                    } else {
                        console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
                    }
                }
            }
        }
        
        // Verify tables were created
        console.log('\n🔍 Verifying database setup...');
        
        const tableCheckQuery = `
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `;
        
        const result = await executeQuery(tableCheckQuery);
        
        console.log('\n📊 Tables created:');
        result.recordset.forEach(row => {
            console.log(`   ✅ ${row.name}`);
        });
        
        // Count sample data
        const tables = ['Companies', 'Branches', 'Divisions', 'Departments'];
        console.log('\n📈 Sample data loaded:');
        
        for (const table of tables) {
            try {
                const countResult = await executeQuery(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`   - ${table}: ${countResult.recordset[0].count} records`);
            } catch (error) {
                console.log(`   - ${table}: Error counting records`);
            }
        }
        
        console.log('\n✅ SQLite database initialization completed successfully!\n');
        
    } catch (error) {
        console.error('\n❌ Database initialization failed:', error.message);
        process.exit(1);
    } finally {
        await closeDatabase();
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };