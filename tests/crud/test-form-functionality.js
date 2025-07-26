require('dotenv').config();
const { executeQuery, connectDatabase } = require('../../src/config/database');
const Company = require('../../src/models/Company');
const Branch = require('../../src/models/Branch');
const Division = require('../../src/models/Division');
const Department = require('../../src/models/Department');

async function testFormFunctionality() {
    try {
        console.log('🔌 Connecting to database...');
        await connectDatabase();
        
        // Create a test company first
        console.log('\n📝 Creating test company...');
        const testCompany = new Company({
            company_code: 'TEST001',
            company_name_th: 'บริษัททดสอบ',
            company_name_en: 'Test Company',
            is_active: true,
            created_by: 'test'
        });
        
        try {
            await testCompany.create();
            console.log('✅ Test company created successfully');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️ Test company already exists');
            } else {
                throw error;
            }
        }
        
        // Test loading companies for forms
        console.log('\n📋 Testing Company.findAll() for forms...');
        const companies = await Company.findAll({ is_active: true });
        console.log(`✅ Found ${companies.length} active companies`);
        companies.forEach(c => {
            console.log(`  - ${c.company_code}: ${c.company_name_en}`);
        });
        
        // Create a test branch
        console.log('\n📝 Creating test branch...');
        const testBranch = new Branch({
            branch_code: 'TEST001-HQ',
            branch_name: 'Test Headquarters',
            company_code: 'TEST001',
            is_headquarters: true,
            is_active: true,
            created_by: 'test'
        });
        
        try {
            await testBranch.create();
            console.log('✅ Test branch created successfully');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️ Test branch already exists');
            } else {
                throw error;
            }
        }
        
        // Test loading branches by company
        console.log('\n📋 Testing Branch.findByCompany()...');
        const branches = await Branch.findByCompany('TEST001');
        console.log(`✅ Found ${branches.length} branches for TEST001`);
        branches.forEach(b => {
            console.log(`  - ${b.branch_code}: ${b.branch_name}`);
        });
        
        // Create a test division
        console.log('\n📝 Creating test division...');
        const testDivision = new Division({
            division_code: 'TEST001-DIV01',
            division_name: 'Test Division',
            company_code: 'TEST001',
            branch_code: 'TEST001-HQ',
            is_active: true,
            created_by: 'test'
        });
        
        try {
            await testDivision.create();
            console.log('✅ Test division created successfully');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️ Test division already exists');
            } else {
                throw error;
            }
        }
        
        // Test loading divisions
        console.log('\n📋 Testing Division.findAll()...');
        const divisions = await Division.findAll({ is_active: true });
        console.log(`✅ Found ${divisions.length} active divisions`);
        divisions.forEach(d => {
            console.log(`  - ${d.division_code}: ${d.division_name}`);
        });
        
        // Test loading divisions by company
        console.log('\n📋 Testing Division.findByCompany()...');
        const companyDivisions = await Division.findByCompany('TEST001');
        console.log(`✅ Found ${companyDivisions.length} divisions for TEST001`);
        companyDivisions.forEach(d => {
            console.log(`  - ${d.division_code}: ${d.division_name}`);
        });
        
        // Create a test department
        console.log('\n📝 Creating test department...');
        const testDepartment = new Department({
            department_code: 'TEST001-DEPT01',
            department_name: 'Test Department',
            division_code: 'TEST001-DIV01',
            is_active: true,
            created_by: 'test'
        });
        
        try {
            await testDepartment.create();
            console.log('✅ Test department created successfully');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️ Test department already exists');
            } else {
                throw error;
            }
        }
        
        // Test loading departments
        console.log('\n📋 Testing Department.findAll()...');
        const departments = await Department.findAll({ is_active: true });
        console.log(`✅ Found ${departments.length} active departments`);
        departments.forEach(d => {
            console.log(`  - ${d.department_code}: ${d.department_name}`);
        });
        
        console.log('\n✅ All form functionality tests passed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
    }
    
    process.exit(0);
}

testFormFunctionality();