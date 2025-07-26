require('dotenv').config();
const { executeQuery, connectDatabase } = require('../../src/config/database');

async function listExistingRecords() {
    try {
        console.log('Connecting to database...');
        await connectDatabase();
        
        // List companies
        console.log('\n📊 EXISTING COMPANIES:');
        const companies = await executeQuery('SELECT company_code, company_name_en, is_active FROM Companies ORDER BY company_code', {});
        companies.recordset.forEach(company => {
            console.log(`- ${company.company_code}: ${company.company_name_en} (${company.is_active ? 'Active' : 'Inactive'})`);
        });
        
        // List branches
        console.log('\n🏪 EXISTING BRANCHES:');
        const branches = await executeQuery('SELECT branch_code, branch_name, company_code, is_active FROM Branches ORDER BY company_code, branch_code', {});
        branches.recordset.forEach(branch => {
            console.log(`- ${branch.branch_code}: ${branch.branch_name} (${branch.company_code}) (${branch.is_active ? 'Active' : 'Inactive'})`);
        });
        
        // List divisions
        console.log('\n🏗️ EXISTING DIVISIONS:');
        const divisions = await executeQuery('SELECT division_code, division_name, company_code, is_active FROM Divisions ORDER BY company_code, division_code', {});
        divisions.recordset.forEach(division => {
            console.log(`- ${division.division_code}: ${division.division_name} (${division.company_code}) (${division.is_active ? 'Active' : 'Inactive'})`);
        });
        
        // List departments
        console.log('\n👥 EXISTING DEPARTMENTS:');
        const departments = await executeQuery('SELECT department_code, department_name, division_code, is_active FROM Departments ORDER BY division_code, department_code', {});
        departments.recordset.forEach(department => {
            console.log(`- ${department.department_code}: ${department.department_name} (${department.division_code}) (${department.is_active ? 'Active' : 'Inactive'})`);
        });
        
    } catch (error) {
        console.error('Database query failed:', error.message);
    }
}

listExistingRecords();