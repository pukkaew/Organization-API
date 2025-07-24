// Script to add delete methods to all models
const fs = require('fs').promises;
const path = require('path');

async function addDeleteMethods() {
    console.log('🔧 Adding DELETE methods to all models...\n');

    const models = [
        {
            name: 'Department',
            file: 'src/models/Department.js',
            tableName: 'Departments',
            codeField: 'department_code'
        },
        {
            name: 'Division',
            file: 'src/models/Division.js',
            tableName: 'Divisions',
            codeField: 'division_code'
        },
        {
            name: 'Branch',
            file: 'src/models/Branch.js',
            tableName: 'Branches',
            codeField: 'branch_code'
        }
    ];

    for (const model of models) {
        console.log(`📝 Adding delete method to ${model.name}...`);
        
        try {
            const filePath = path.join(__dirname, model.file);
            let content = await fs.readFile(filePath, 'utf8');
            
            // Check if delete method already exists
            if (content.includes('async delete()')) {
                console.log(`   ⚠️  Delete method already exists in ${model.name}`);
                continue;
            }
            
            // Find the location to insert the delete method (after update method)
            const insertAfter = 'async update() {';
            const insertIndex = content.lastIndexOf(insertAfter);
            
            if (insertIndex === -1) {
                console.log(`   ❌ Could not find update method in ${model.name}`);
                continue;
            }
            
            // Find the end of the update method
            let braceCount = 0;
            let methodEndIndex = insertIndex;
            let foundStart = false;
            
            for (let i = insertIndex; i < content.length; i++) {
                const char = content[i];
                if (char === '{') {
                    braceCount++;
                    foundStart = true;
                } else if (char === '}') {
                    braceCount--;
                    if (foundStart && braceCount === 0) {
                        methodEndIndex = i + 1;
                        break;
                    }
                }
            }
            
            // Create the delete method
            const deleteMethod = `

    // Delete ${model.name.toLowerCase()}
    async delete() {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                const index = this.constructor.mock${model.name}s.findIndex(item => item.${model.codeField} === this.${model.codeField});
                if (index === -1) {
                    throw new Error('${model.name} not found');
                }
                this.constructor.mock${model.name}s.splice(index, 1);
                return { ${model.codeField}: this.${model.codeField} };
            }
            
            const query = \`
                DELETE FROM ${model.tableName}
                WHERE ${model.codeField} = @${model.codeField}
            \`;
            
            const result = await executeQuery(query, { ${model.codeField}: this.${model.codeField} });
            
            if (result.rowsAffected[0] === 0) {
                throw new Error('${model.name} not found');
            }
            
            return { ${model.codeField}: this.${model.codeField} };
        } catch (error) {
            logger.error('Error in ${model.name}.delete:', error);
            throw error;
        }
    }`;
            
            // Insert the delete method
            const newContent = content.slice(0, methodEndIndex) + deleteMethod + content.slice(methodEndIndex);
            
            // Write the updated content
            await fs.writeFile(filePath, newContent, 'utf8');
            console.log(`   ✅ Added delete method to ${model.name}`);
            
        } catch (error) {
            console.log(`   ❌ Error updating ${model.name}: ${error.message}`);
        }
    }
    
    console.log('\n🎉 Finished adding delete methods to models!');
}

// Run the script
addDeleteMethods();