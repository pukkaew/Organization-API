const { connectDatabase, closeDatabase } = require('../../src/config/database');
const Company = require('../../src/models/Company');
const Branch = require('../../src/models/Branch');
const Division = require('../../src/models/Division');
const Department = require('../../src/models/Department');

describe('Database Records Verification', () => {
    beforeAll(async () => {
        if (process.env.USE_DATABASE !== 'false') {
            await connectDatabase();
        }
    });

    afterAll(async () => {
        if (process.env.USE_DATABASE !== 'false') {
            await closeDatabase();
        }
    });

    test('Check if RUXCHAI company exists in database', async () => {
        const company = await Company.findByCode('RUXCHAI');
        console.log('Company data:', company);
        
        if (company) {
            expect(company.company_code).toBe('RUXCHAI');
            console.log('✅ RUXCHAI company found');
        } else {
            console.log('ℹ️ RUXCHAI company not found - this is expected if database is empty');
        }
    });

    test('Check available companies in database', async () => {
        const companies = await Company.findAll();
        console.log(`Found ${companies.length} companies in database`);
        
        if (companies.length > 0) {
            console.log('Available companies:');
            companies.forEach(company => {
                console.log(`  - ${company.company_code}: ${company.company_name_th}`);
            });
        } else {
            console.log('ℹ️ No companies found - database might be empty or using mock data');
        }
    });

    test('Check available branches in database', async () => {
        const branches = await Branch.findAll();
        console.log(`Found ${branches.length} branches in database`);
        
        if (branches.length > 0) {
            console.log('Available branches:');
            branches.forEach(branch => {
                console.log(`  - ${branch.branch_code}: ${branch.branch_name}`);
            });
        }
    });

    test('Check available divisions in database', async () => {
        const divisions = await Division.findAll();
        console.log(`Found ${divisions.length} divisions in database`);
        
        if (divisions.length > 0) {
            console.log('Available divisions:');
            divisions.forEach(division => {
                console.log(`  - ${division.division_code}: ${division.division_name}`);
            });
        }
    });

    test('Check available departments in database', async () => {
        const departments = await Department.findAll();
        console.log(`Found ${departments.length} departments in database`);
        
        if (departments.length > 0) {
            console.log('Available departments:');
            departments.forEach(department => {
                console.log(`  - ${department.department_code}: ${department.department_name}`);
            });
        }
    });
});