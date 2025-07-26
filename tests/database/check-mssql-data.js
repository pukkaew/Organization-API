require('dotenv').config();
const { connectDatabase, executeQuery } = require('../../src/config/database');

async function checkMSSQLData() {
    try {
        console.log('🔌 Connecting to MSSQL...');
        await connectDatabase();
        
        console.log('\\n📊 CHECKING COMPANIES IN MSSQL:');
        const companies = await executeQuery(`
            SELECT company_code, company_name_th, company_name_en, 
                   tax_id, is_active, created_date, created_by
            FROM Companies 
            ORDER BY created_date DESC
        `);
        
        if (companies.recordset.length > 0) {
            companies.recordset.forEach((company, index) => {
                console.log(`${index + 1}. ${company.company_code}:`);
                console.log(`   TH: ${company.company_name_th}`);
                console.log(`   EN: ${company.company_name_en}`);
                console.log(`   Tax ID: ${company.tax_id}`);
                console.log(`   Status: ${company.is_active ? 'Active' : 'Inactive'}`);
                console.log(`   Created: ${company.created_date} by ${company.created_by}`);
                console.log('');
            });
        } else {
            console.log('  No companies found');
        }
        
        console.log('🏪 CHECKING BRANCHES IN MSSQL:');
        const branches = await executeQuery(`
            SELECT branch_code, branch_name, company_code, 
                   is_headquarters, is_active, created_date, created_by
            FROM Branches 
            ORDER BY created_date DESC
        `);
        
        if (branches.recordset.length > 0) {
            branches.recordset.forEach((branch, index) => {
                console.log(`${index + 1}. ${branch.branch_code}:`);
                console.log(`   Name: ${branch.branch_name}`);
                console.log(`   Company: ${branch.company_code}`);
                console.log(`   HQ: ${branch.is_headquarters ? 'Yes' : 'No'}`);
                console.log(`   Status: ${branch.is_active ? 'Active' : 'Inactive'}`);
                console.log(`   Created: ${branch.created_date} by ${branch.created_by}`);
                console.log('');
            });
        } else {
            console.log('  No branches found');
        }
        
        console.log('🏗️ CHECKING DIVISIONS IN MSSQL:');
        const divisions = await executeQuery(`
            SELECT division_code, division_name, company_code, branch_code,
                   is_active, created_date, created_by
            FROM Divisions 
            ORDER BY created_date DESC
        `);
        
        if (divisions.recordset.length > 0) {
            divisions.recordset.forEach((division, index) => {
                console.log(`${index + 1}. ${division.division_code}:`);
                console.log(`   Name: ${division.division_name}`);
                console.log(`   Company: ${division.company_code}`);
                console.log(`   Branch: ${division.branch_code || 'N/A'}`);
                console.log(`   Status: ${division.is_active ? 'Active' : 'Inactive'}`);
                console.log(`   Created: ${division.created_date} by ${division.created_by}`);
                console.log('');
            });
        } else {
            console.log('  No divisions found');
        }
        
        console.log('👥 CHECKING DEPARTMENTS IN MSSQL:');
        const departments = await executeQuery(`
            SELECT department_code, department_name, division_code,
                   is_active, created_date, created_by
            FROM Departments 
            ORDER BY created_date DESC
        `);
        
        if (departments.recordset.length > 0) {
            departments.recordset.forEach((department, index) => {
                console.log(`${index + 1}. ${department.department_code}:`);
                console.log(`   Name: ${department.department_name}`);
                console.log(`   Division: ${department.division_code}`);
                console.log(`   Status: ${department.is_active ? 'Active' : 'Inactive'}`);
                console.log(`   Created: ${department.created_date} by ${department.created_by}`);
                console.log('');
            });
        } else {
            console.log('  No departments found');
        }
        
        // Summary
        console.log('📈 SUMMARY:');
        console.log(`Companies: ${companies.recordset.length}`);
        console.log(`Branches: ${branches.recordset.length}`);
        console.log(`Divisions: ${divisions.recordset.length}`);
        console.log(`Departments: ${departments.recordset.length}`);
        
    } catch (error) {
        console.error('❌ Error checking MSSQL data:', error.message);
    }
}

checkMSSQLData();