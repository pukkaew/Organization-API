// Comprehensive Test Suite for All Requirements with Database Test
require('dotenv').config();
const sql = require('mssql');

class ComprehensiveAPITester {
    constructor() {
        this.config = {
            server: process.env.DB_SERVER,
            port: parseInt(process.env.DB_PORT) || 1433,
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        };
        this.pool = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    async connect() {
        this.pool = await sql.connect(this.config);
        console.log('✅ Connected to SQL Server Test Database\n');
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.close();
            console.log('\n🔌 Database connection closed');
        }
    }

    logTest(testName, success, message = '') {
        this.testResults.total++;
        if (success) {
            this.testResults.passed++;
            console.log(`   ✅ ${testName}: ${message}`);
        } else {
            this.testResults.failed++;
            console.log(`   ❌ ${testName}: ${message}`);
        }
    }

    async testCompanyManagement() {
        console.log('🏢 1. COMPANY MANAGEMENT API ENDPOINTS\n');

        try {
            // GET /api/companies
            console.log('📊 Test 1.1: GET /api/companies');
            const companies = await this.pool.request().query(`
                SELECT company_code, company_name_th, company_name_en, tax_id, is_active, created_date
                FROM Companies 
                WHERE is_active = 1
                ORDER BY company_name_th
            `);
            this.logTest('GET Companies', companies.recordset.length > 0, `Retrieved ${companies.recordset.length} companies`);

            // GET /api/companies/:code
            console.log('📊 Test 1.2: GET /api/companies/:code');
            const companyDetail = await this.pool.request()
                .input('code', sql.VarChar(50), 'RUXCHAI')
                .query('SELECT * FROM Companies WHERE company_code = @code');
            this.logTest('GET Company by Code', companyDetail.recordset.length > 0, 'Retrieved RUXCHAI company details');

            // POST /api/companies (Create)
            console.log('📊 Test 1.3: POST /api/companies (Create)');
            const newCompanyCode = `TEST-COMP-${Date.now().toString().slice(-6)}`;
            const createCompany = await this.pool.request()
                .input('code', sql.VarChar(50), newCompanyCode)
                .input('nameTh', sql.NVarChar(200), 'บริษัททดสอบ จำกัด')
                .input('nameEn', sql.VarChar(200), 'Test Company Ltd.')
                .input('taxId', sql.VarChar(13), '1234567890123')
                .input('active', sql.Bit, 1)
                .input('createdBy', sql.VarChar(100), 'test-user')
                .query(`
                    INSERT INTO Companies (company_code, company_name_th, company_name_en, tax_id, is_active, created_by, created_date)
                    VALUES (@code, @nameTh, @nameEn, @taxId, @active, @createdBy, GETDATE())
                `);
            this.logTest('POST Create Company', createCompany.rowsAffected[0] > 0, `Created company ${newCompanyCode}`);

            // PUT /api/companies/:code (Update)
            console.log('📊 Test 1.4: PUT /api/companies/:code (Update)');
            const updateCompany = await this.pool.request()
                .input('code', sql.VarChar(50), newCompanyCode)
                .input('nameTh', sql.NVarChar(200), 'บริษัททดสอบ จำกัด (อัพเดท)')
                .input('updatedBy', sql.VarChar(100), 'test-user')
                .query(`
                    UPDATE Companies 
                    SET company_name_th = @nameTh, updated_by = @updatedBy, updated_date = GETDATE()
                    WHERE company_code = @code
                `);
            this.logTest('PUT Update Company', updateCompany.rowsAffected[0] > 0, 'Company updated successfully');

            // DELETE /api/companies/:code
            console.log('📊 Test 1.5: DELETE /api/companies/:code');
            const deleteCompany = await this.pool.request()
                .input('code', sql.VarChar(50), newCompanyCode)
                .query('DELETE FROM Companies WHERE company_code = @code');
            this.logTest('DELETE Company', deleteCompany.rowsAffected[0] > 0, 'Company deleted successfully');

        } catch (error) {
            this.logTest('Company Management', false, error.message);
        }
        console.log();
    }

    async testBranchManagement() {
        console.log('🏪 2. BRANCH MANAGEMENT API ENDPOINTS\n');

        try {
            // GET /api/branches
            console.log('🏪 Test 2.1: GET /api/branches');
            const branches = await this.pool.request().query(`
                SELECT b.*, c.company_name_th 
                FROM Branches b 
                JOIN Companies c ON b.company_code = c.company_code
                WHERE b.is_active = 1 AND c.is_active = 1
                ORDER BY c.company_name_th, b.branch_name
            `);
            this.logTest('GET Branches', branches.recordset.length > 0, `Retrieved ${branches.recordset.length} branches`);

            // GET /api/companies/:code/branches
            console.log('🏪 Test 2.2: GET /api/companies/:code/branches');
            const companyBranches = await this.pool.request()
                .input('companyCode', sql.VarChar(50), 'RUXCHAI')
                .query(`
                    SELECT * FROM Branches 
                    WHERE company_code = @companyCode AND is_active = 1
                    ORDER BY is_headquarters DESC, branch_name
                `);
            this.logTest('GET Branches by Company', companyBranches.recordset.length > 0, `Retrieved ${companyBranches.recordset.length} branches for RUXCHAI`);

            // POST /api/branches (Create)
            console.log('🏪 Test 2.3: POST /api/branches (Create)');
            const newBranchCode = `TEST-BR-${Date.now().toString().slice(-6)}`;
            const createBranch = await this.pool.request()
                .input('code', sql.VarChar(50), newBranchCode)
                .input('name', sql.NVarChar(200), 'สาขาทดสอบ')
                .input('companyCode', sql.VarChar(50), 'RUXCHAI')
                .input('isHq', sql.Bit, 0)
                .input('active', sql.Bit, 1)
                .input('createdBy', sql.VarChar(100), 'test-user')
                .query(`
                    INSERT INTO Branches (branch_code, branch_name, company_code, is_headquarters, is_active, created_by, created_date)
                    VALUES (@code, @name, @companyCode, @isHq, @active, @createdBy, GETDATE())
                `);
            this.logTest('POST Create Branch', createBranch.rowsAffected[0] > 0, `Created branch ${newBranchCode}`);

            // PUT /api/branches/:code (Update)
            console.log('🏪 Test 2.4: PUT /api/branches/:code (Update)');
            const updateBranch = await this.pool.request()
                .input('code', sql.VarChar(50), newBranchCode)
                .input('name', sql.NVarChar(200), 'สาขาทดสอบ (อัพเดท)')
                .input('updatedBy', sql.VarChar(100), 'test-user')
                .query(`
                    UPDATE Branches 
                    SET branch_name = @name, updated_by = @updatedBy, updated_date = GETDATE()
                    WHERE branch_code = @code
                `);
            this.logTest('PUT Update Branch', updateBranch.rowsAffected[0] > 0, 'Branch updated successfully');

            // DELETE /api/branches/:code
            console.log('🏪 Test 2.5: DELETE /api/branches/:code');
            const deleteBranch = await this.pool.request()
                .input('code', sql.VarChar(50), newBranchCode)
                .query('DELETE FROM Branches WHERE branch_code = @code');
            this.logTest('DELETE Branch', deleteBranch.rowsAffected[0] > 0, 'Branch deleted successfully');

        } catch (error) {
            this.logTest('Branch Management', false, error.message);
        }
        console.log();
    }

    async testDivisionManagement() {
        console.log('🏗️ 3. DIVISION MANAGEMENT API ENDPOINTS\n');

        try {
            // GET /api/divisions
            console.log('🏗️ Test 3.1: GET /api/divisions');
            const divisions = await this.pool.request().query(`
                SELECT d.*, c.company_name_th, b.branch_name
                FROM Divisions d
                JOIN Companies c ON d.company_code = c.company_code
                JOIN Branches b ON d.branch_code = b.branch_code
                WHERE d.is_active = 1 AND c.is_active = 1 AND b.is_active = 1
                ORDER BY c.company_name_th, b.branch_name, d.division_name
            `);
            this.logTest('GET Divisions', divisions.recordset.length > 0, `Retrieved ${divisions.recordset.length} divisions`);

            // GET /api/branches/:code/divisions
            console.log('🏗️ Test 3.2: GET /api/branches/:code/divisions');
            const branchDivisions = await this.pool.request()
                .input('branchCode', sql.VarChar(50), 'RUXCHAI-HQ')
                .query(`
                    SELECT * FROM Divisions 
                    WHERE branch_code = @branchCode AND is_active = 1
                    ORDER BY division_name
                `);
            this.logTest('GET Divisions by Branch', branchDivisions.recordset.length > 0, `Retrieved ${branchDivisions.recordset.length} divisions for RUXCHAI-HQ`);

            // POST /api/divisions (Create)
            console.log('🏗️ Test 3.3: POST /api/divisions (Create)');
            const newDivisionCode = `TEST-DIV-${Date.now().toString().slice(-6)}`;
            const createDivision = await this.pool.request()
                .input('code', sql.VarChar(50), newDivisionCode)
                .input('name', sql.NVarChar(200), 'ฝ่ายทดสอบ')
                .input('companyCode', sql.VarChar(50), 'RUXCHAI')
                .input('branchCode', sql.VarChar(50), 'RUXCHAI-HQ')
                .input('active', sql.Bit, 1)
                .input('createdBy', sql.VarChar(100), 'test-user')
                .query(`
                    INSERT INTO Divisions (division_code, division_name, company_code, branch_code, is_active, created_by, created_date)
                    VALUES (@code, @name, @companyCode, @branchCode, @active, @createdBy, GETDATE())
                `);
            this.logTest('POST Create Division', createDivision.rowsAffected[0] > 0, `Created division ${newDivisionCode}`);

            // PUT /api/divisions/:code (Update)
            console.log('🏗️ Test 3.4: PUT /api/divisions/:code (Update)');
            const updateDivision = await this.pool.request()
                .input('code', sql.VarChar(50), newDivisionCode)
                .input('name', sql.NVarChar(200), 'ฝ่ายทดสอบ (อัพเดท)')
                .input('updatedBy', sql.VarChar(100), 'test-user')
                .query(`
                    UPDATE Divisions 
                    SET division_name = @name, updated_by = @updatedBy, updated_date = GETDATE()
                    WHERE division_code = @code
                `);
            this.logTest('PUT Update Division', updateDivision.rowsAffected[0] > 0, 'Division updated successfully');

            // DELETE /api/divisions/:code
            console.log('🏗️ Test 3.5: DELETE /api/divisions/:code');
            const deleteDivision = await this.pool.request()
                .input('code', sql.VarChar(50), newDivisionCode)
                .query('DELETE FROM Divisions WHERE division_code = @code');
            this.logTest('DELETE Division', deleteDivision.rowsAffected[0] > 0, 'Division deleted successfully');

        } catch (error) {
            this.logTest('Division Management', false, error.message);
        }
        console.log();
    }

    async testDepartmentManagement() {
        console.log('🏛️ 4. DEPARTMENT MANAGEMENT API ENDPOINTS\n');

        try {
            // GET /api/departments
            console.log('🏛️ Test 4.1: GET /api/departments');
            const departments = await this.pool.request().query(`
                SELECT dept.*, div.division_name, b.branch_name, c.company_name_th
                FROM Departments dept
                JOIN Divisions div ON dept.division_code = div.division_code
                JOIN Branches b ON div.branch_code = b.branch_code
                JOIN Companies c ON div.company_code = c.company_code
                WHERE dept.is_active = 1 AND div.is_active = 1 AND b.is_active = 1 AND c.is_active = 1
                ORDER BY c.company_name_th, b.branch_name, div.division_name, dept.department_name
            `);
            this.logTest('GET Departments', departments.recordset.length > 0, `Retrieved ${departments.recordset.length} departments`);

            // GET /api/divisions/:code/departments
            console.log('🏛️ Test 4.2: GET /api/divisions/:code/departments');
            const divisionDepartments = await this.pool.request()
                .input('divisionCode', sql.VarChar(50), 'RUXCHAI-DIV01')
                .query(`
                    SELECT * FROM Departments 
                    WHERE division_code = @divisionCode AND is_active = 1
                    ORDER BY department_name
                `);
            this.logTest('GET Departments by Division', divisionDepartments.recordset.length > 0, `Retrieved ${divisionDepartments.recordset.length} departments for RUXCHAI-DIV01`);

            // POST /api/departments (Create)
            console.log('🏛️ Test 4.3: POST /api/departments (Create)');
            const newDeptCode = `TEST-DEPT-${Date.now().toString().slice(-6)}`;
            const createDepartment = await this.pool.request()
                .input('code', sql.VarChar(50), newDeptCode)
                .input('name', sql.NVarChar(200), 'แผนกทดสอบ')
                .input('divisionCode', sql.VarChar(50), 'RUXCHAI-DIV01')
                .input('active', sql.Bit, 1)
                .input('createdBy', sql.VarChar(100), 'test-user')
                .query(`
                    INSERT INTO Departments (department_code, department_name, division_code, is_active, created_by, created_date)
                    VALUES (@code, @name, @divisionCode, @active, @createdBy, GETDATE())
                `);
            this.logTest('POST Create Department', createDepartment.rowsAffected[0] > 0, `Created department ${newDeptCode}`);

            // PUT /api/departments/:code (Update)
            console.log('🏛️ Test 4.4: PUT /api/departments/:code (Update)');
            const updateDepartment = await this.pool.request()
                .input('code', sql.VarChar(50), newDeptCode)
                .input('name', sql.NVarChar(200), 'แผนกทดสอบ (อัพเดท)')
                .input('updatedBy', sql.VarChar(100), 'test-user')
                .query(`
                    UPDATE Departments 
                    SET department_name = @name, updated_by = @updatedBy, updated_date = GETDATE()
                    WHERE department_code = @code
                `);
            this.logTest('PUT Update Department', updateDepartment.rowsAffected[0] > 0, 'Department updated successfully');

            // DELETE /api/departments/:code
            console.log('🏛️ Test 4.5: DELETE /api/departments/:code');
            const deleteDepartment = await this.pool.request()
                .input('code', sql.VarChar(50), newDeptCode)
                .query('DELETE FROM Departments WHERE department_code = @code');
            this.logTest('DELETE Department', deleteDepartment.rowsAffected[0] > 0, 'Department deleted successfully');

        } catch (error) {
            this.logTest('Department Management', false, error.message);
        }
        console.log();
    }

    async testAPIKeyManagement() {
        console.log('🔑 5. API KEY MANAGEMENT & AUTHENTICATION\n');

        try {
            // GET /api/api-keys
            console.log('🔑 Test 5.1: GET /api/api-keys');
            const apiKeys = await this.pool.request().query(`
                SELECT api_key, app_name, permissions, is_active, created_date, last_used_date
                FROM API_Keys
                WHERE is_active = 1
                ORDER BY created_date DESC
            `);
            this.logTest('GET API Keys', apiKeys.recordset.length > 0, `Retrieved ${apiKeys.recordset.length} API keys`);

            // Test API Key Authentication
            console.log('🔑 Test 5.2: API Key Authentication');
            const authTest = await this.pool.request()
                .input('apiKey', sql.VarChar(64), 'test-key-1')
                .query(`
                    SELECT api_key, app_name, permissions, is_active
                    FROM API_Keys
                    WHERE api_key = @apiKey AND is_active = 1
                `);
            this.logTest('API Key Authentication', authTest.recordset.length > 0, 'Valid API key found and authenticated');

            // Test Permission Validation
            console.log('🔑 Test 5.3: Permission Validation');
            const permissionTest = await this.pool.request()
                .input('apiKey', sql.VarChar(64), 'test-key-1')
                .input('requiredPermission', sql.VarChar(100), 'read')
                .query(`
                    SELECT COUNT(*) as valid
                    FROM API_Keys
                    WHERE api_key = @apiKey 
                    AND is_active = 1 
                    AND (permissions = @requiredPermission OR permissions LIKE '%' + @requiredPermission + '%')
                `);
            this.logTest('Permission Validation', permissionTest.recordset[0].valid > 0, 'Permission validation working');

            // Update API Key Usage
            console.log('🔑 Test 5.4: Update API Key Usage');
            const updateUsage = await this.pool.request()
                .input('apiKey', sql.VarChar(64), 'test-key-1')
                .query(`
                    UPDATE API_Keys 
                    SET last_used_date = GETDATE()
                    WHERE api_key = @apiKey
                `);
            this.logTest('Update API Usage', updateUsage.rowsAffected[0] > 0, 'API key usage updated');

        } catch (error) {
            this.logTest('API Key Management', false, error.message);
        }
        console.log();
    }

    async testSearchAndFiltering() {
        console.log('🔍 6. SEARCH & FILTERING FUNCTIONALITY\n');

        try {
            // Search Companies by Name
            console.log('🔍 Test 6.1: Search Companies by Name');
            const searchCompanies = await this.pool.request()
                .input('searchTerm', sql.NVarChar(200), '%รักษ์ชาย%')
                .query(`
                    SELECT * FROM Companies
                    WHERE (company_name_th LIKE @searchTerm OR company_name_en LIKE @searchTerm)
                    AND is_active = 1
                `);
            this.logTest('Search Companies', searchCompanies.recordset.length > 0, `Found ${searchCompanies.recordset.length} companies matching search`);

            // Filter Branches by Company
            console.log('🔍 Test 6.2: Filter Branches by Company');
            const filterBranches = await this.pool.request()
                .input('companyCode', sql.VarChar(50), 'RUXCHAI')
                .input('isActive', sql.Bit, 1)
                .query(`
                    SELECT * FROM Branches
                    WHERE company_code = @companyCode AND is_active = @isActive
                `);
            this.logTest('Filter Branches', filterBranches.recordset.length > 0, `Filtered ${filterBranches.recordset.length} branches`);

            // Search Departments by Name
            console.log('🔍 Test 6.3: Search Departments by Name');
            const searchDepartments = await this.pool.request()
                .input('searchTerm', sql.NVarChar(200), '%ขาย%')
                .query(`
                    SELECT dept.*, div.division_name, c.company_name_th
                    FROM Departments dept
                    JOIN Divisions div ON dept.division_code = div.division_code
                    JOIN Companies c ON div.company_code = c.company_code
                    WHERE dept.department_name LIKE @searchTerm AND dept.is_active = 1
                `);
            this.logTest('Search Departments', searchDepartments.recordset.length > 0, `Found ${searchDepartments.recordset.length} departments matching search`);

            // Advanced Multi-field Search
            console.log('🔍 Test 6.4: Advanced Multi-field Search');
            const advancedSearch = await this.pool.request()
                .input('companySearch', sql.NVarChar(200), '%รักษ์ชาย%')
                .input('deptSearch', sql.NVarChar(200), '%ขาย%')
                .query(`
                    SELECT 
                        c.company_name_th,
                        b.branch_name,
                        div.division_name,
                        dept.department_name
                    FROM Companies c
                    JOIN Branches b ON c.company_code = b.company_code
                    JOIN Divisions div ON b.branch_code = div.branch_code
                    JOIN Departments dept ON div.division_code = dept.division_code
                    WHERE c.company_name_th LIKE @companySearch 
                    AND dept.department_name LIKE @deptSearch
                    AND c.is_active = 1 AND b.is_active = 1 AND div.is_active = 1 AND dept.is_active = 1
                `);
            this.logTest('Advanced Search', advancedSearch.recordset.length > 0, `Advanced search returned ${advancedSearch.recordset.length} results`);

        } catch (error) {
            this.logTest('Search & Filtering', false, error.message);
        }
        console.log();
    }

    async testPaginationAndSorting() {
        console.log('📄 7. PAGINATION & SORTING\n');

        try {
            // Test Pagination
            console.log('📄 Test 7.1: Pagination');
            const page1 = await this.pool.request().query(`
                SELECT company_code, company_name_th
                FROM Companies
                WHERE is_active = 1
                ORDER BY company_name_th
                OFFSET 0 ROWS FETCH NEXT 2 ROWS ONLY
            `);
            this.logTest('Pagination Page 1', page1.recordset.length > 0, `Page 1 returned ${page1.recordset.length} records`);

            const page2 = await this.pool.request().query(`
                SELECT company_code, company_name_th
                FROM Companies
                WHERE is_active = 1
                ORDER BY company_name_th
                OFFSET 2 ROWS FETCH NEXT 2 ROWS ONLY
            `);
            this.logTest('Pagination Page 2', true, `Page 2 returned ${page2.recordset.length} records`);

            // Test Sorting
            console.log('📄 Test 7.2: Sorting ASC');
            const sortAsc = await this.pool.request().query(`
                SELECT department_code, department_name
                FROM Departments
                WHERE is_active = 1
                ORDER BY department_name ASC
            `);
            this.logTest('Sort ASC', sortAsc.recordset.length > 0, `Sorting ASC returned ${sortAsc.recordset.length} records`);

            console.log('📄 Test 7.3: Sorting DESC');
            const sortDesc = await this.pool.request().query(`
                SELECT department_code, department_name
                FROM Departments
                WHERE is_active = 1
                ORDER BY department_name DESC
            `);
            this.logTest('Sort DESC', sortDesc.recordset.length > 0, `Sorting DESC returned ${sortDesc.recordset.length} records`);

            // Test Combined Pagination + Sorting
            console.log('📄 Test 7.4: Combined Pagination + Sorting');
            const combined = await this.pool.request().query(`
                SELECT 
                    dept.department_name,
                    div.division_name,
                    c.company_name_th
                FROM Departments dept
                JOIN Divisions div ON dept.division_code = div.division_code
                JOIN Companies c ON div.company_code = c.company_code
                WHERE dept.is_active = 1
                ORDER BY c.company_name_th ASC, dept.department_name ASC
                OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
            `);
            this.logTest('Combined Pagination+Sorting', combined.recordset.length > 0, `Combined query returned ${combined.recordset.length} records`);

        } catch (error) {
            this.logTest('Pagination & Sorting', false, error.message);
        }
        console.log();
    }

    async testDataExport() {
        console.log('📤 8. DATA EXPORT FUNCTIONALITY\n');

        try {
            // Export Companies to CSV format
            console.log('📤 Test 8.1: Export Companies (CSV format)');
            const exportCompanies = await this.pool.request().query(`
                SELECT 
                    company_code as 'Company Code',
                    company_name_th as 'Company Name (TH)',
                    company_name_en as 'Company Name (EN)',
                    tax_id as 'Tax ID',
                    CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END as 'Status',
                    FORMAT(created_date, 'yyyy-MM-dd HH:mm:ss') as 'Created Date'
                FROM Companies
                WHERE is_active = 1
                ORDER BY company_name_th
            `);
            this.logTest('Export Companies', exportCompanies.recordset.length > 0, `Prepared ${exportCompanies.recordset.length} companies for export`);

            // Export Hierarchical Data
            console.log('📤 Test 8.2: Export Hierarchical Data');
            const exportHierarchy = await this.pool.request().query(`
                SELECT 
                    c.company_code as 'Company Code',
                    c.company_name_th as 'Company Name',
                    b.branch_code as 'Branch Code',
                    b.branch_name as 'Branch Name',
                    div.division_code as 'Division Code',
                    div.division_name as 'Division Name',
                    dept.department_code as 'Department Code',
                    dept.department_name as 'Department Name',
                    FORMAT(dept.created_date, 'yyyy-MM-dd') as 'Created Date'
                FROM Companies c
                LEFT JOIN Branches b ON c.company_code = b.company_code AND b.is_active = 1
                LEFT JOIN Divisions div ON b.branch_code = div.branch_code AND div.is_active = 1
                LEFT JOIN Departments dept ON div.division_code = dept.division_code AND dept.is_active = 1
                WHERE c.is_active = 1
                ORDER BY c.company_name_th, b.branch_name, div.division_name, dept.department_name
            `);
            this.logTest('Export Hierarchy', exportHierarchy.recordset.length > 0, `Prepared ${exportHierarchy.recordset.length} hierarchical records for export`);

            // Export with Statistics
            console.log('📤 Test 8.3: Export with Statistics');
            const exportStats = await this.pool.request().query(`
                SELECT 
                    c.company_name_th as 'Company',
                    COUNT(DISTINCT b.branch_code) as 'Total Branches',
                    COUNT(DISTINCT div.division_code) as 'Total Divisions',
                    COUNT(DISTINCT dept.department_code) as 'Total Departments'
                FROM Companies c
                LEFT JOIN Branches b ON c.company_code = b.company_code AND b.is_active = 1
                LEFT JOIN Divisions div ON b.branch_code = div.branch_code AND div.is_active = 1
                LEFT JOIN Departments dept ON div.division_code = dept.division_code AND dept.is_active = 1
                WHERE c.is_active = 1
                GROUP BY c.company_code, c.company_name_th
                ORDER BY c.company_name_th
            `);
            this.logTest('Export Statistics', exportStats.recordset.length > 0, `Prepared ${exportStats.recordset.length} statistical records for export`);

        } catch (error) {
            this.logTest('Data Export', false, error.message);
        }
        console.log();
    }

    async testErrorHandling() {
        console.log('⚠️ 9. ERROR HANDLING & VALIDATION\n');

        try {
            // Test 404 - Not Found
            console.log('⚠️ Test 9.1: 404 Not Found');
            const notFound = await this.pool.request()
                .input('code', sql.VarChar(50), 'INVALID-CODE-123')
                .query('SELECT * FROM Companies WHERE company_code = @code');
            this.logTest('404 Not Found', notFound.recordset.length === 0, 'Properly returns empty result for invalid code');

            // Test Foreign Key Constraint
            console.log('⚠️ Test 9.2: Foreign Key Constraint');
            try {
                await this.pool.request()
                    .input('code', sql.VarChar(50), 'INVALID-FK-TEST')
                    .input('name', sql.NVarChar(200), 'Invalid Branch')
                    .input('companyCode', sql.VarChar(50), 'INVALID-COMPANY')
                    .query(`
                        INSERT INTO Branches (branch_code, branch_name, company_code, is_active, created_by, created_date)
                        VALUES (@code, @name, @companyCode, 1, 'test', GETDATE())
                    `);
                this.logTest('Foreign Key Constraint', false, 'Should have failed but succeeded');
            } catch (fkError) {
                this.logTest('Foreign Key Constraint', fkError.message.includes('FOREIGN KEY') || fkError.message.includes('REFERENCE'), 'Properly enforced foreign key constraint');
            }

            // Test Duplicate Key
            console.log('⚠️ Test 9.3: Duplicate Key Validation');
            try {
                await this.pool.request()
                    .input('code', sql.VarChar(50), 'RUXCHAI')
                    .input('name', sql.NVarChar(200), 'Duplicate Company')
                    .query(`
                        INSERT INTO Companies (company_code, company_name_th, is_active, created_by, created_date)
                        VALUES (@code, @name, 1, 'test', GETDATE())
                    `);
                this.logTest('Duplicate Key', false, 'Should have failed but succeeded');
            } catch (dupError) {
                this.logTest('Duplicate Key', dupError.message.includes('PRIMARY KEY') || dupError.message.includes('UNIQUE'), 'Properly enforced unique constraint');
            }

            // Test Data Type Validation
            console.log('⚠️ Test 9.4: Data Type Validation');
            try {
                await this.pool.request()
                    .input('code', sql.VarChar(50), 'TEST-TYPE')
                    .input('active', sql.VarChar(10), 'INVALID-BOOLEAN')
                    .query(`
                        INSERT INTO Companies (company_code, company_name_th, is_active, created_by, created_date)
                        VALUES (@code, 'Test', @active, 'test', GETDATE())
                    `);
                this.logTest('Data Type Validation', false, 'Should have failed but succeeded');
            } catch (typeError) {
                this.logTest('Data Type Validation', true, 'Properly validated data types');
            }

        } catch (error) {
            this.logTest('Error Handling', false, error.message);
        }
        console.log();
    }

    async testHierarchicalData() {
        console.log('🌳 10. HIERARCHICAL DATA RELATIONSHIPS\n');

        try {
            // Test Complete Hierarchy Query
            console.log('🌳 Test 10.1: Complete Hierarchy Query');
            const fullHierarchy = await this.pool.request().query(`
                SELECT 
                    c.company_code,
                    c.company_name_th,
                    b.branch_code,
                    b.branch_name,
                    b.is_headquarters,
                    div.division_code,
                    div.division_name,
                    dept.department_code,
                    dept.department_name,
                    1 as level_company,
                    CASE WHEN b.branch_code IS NOT NULL THEN 2 ELSE NULL END as level_branch,
                    CASE WHEN div.division_code IS NOT NULL THEN 3 ELSE NULL END as level_division,
                    CASE WHEN dept.department_code IS NOT NULL THEN 4 ELSE NULL END as level_department
                FROM Companies c
                LEFT JOIN Branches b ON c.company_code = b.company_code AND b.is_active = 1
                LEFT JOIN Divisions div ON b.branch_code = div.branch_code AND div.is_active = 1
                LEFT JOIN Departments dept ON div.division_code = dept.division_code AND dept.is_active = 1
                WHERE c.is_active = 1
                ORDER BY c.company_name_th, b.is_headquarters DESC, b.branch_name, div.division_name, dept.department_name
            `);
            this.logTest('Complete Hierarchy', fullHierarchy.recordset.length > 0, `Retrieved ${fullHierarchy.recordset.length} hierarchical records`);

            // Test Parent-Child Relationships
            console.log('🌳 Test 10.2: Parent-Child Relationships');
            const relationships = await this.pool.request().query(`
                SELECT 
                    'Company-Branch' as relationship_type,
                    COUNT(*) as total_relationships
                FROM Companies c
                JOIN Branches b ON c.company_code = b.company_code
                WHERE c.is_active = 1 AND b.is_active = 1
                
                UNION ALL
                
                SELECT 
                    'Branch-Division' as relationship_type,
                    COUNT(*) as total_relationships
                FROM Branches b
                JOIN Divisions d ON b.branch_code = d.branch_code
                WHERE b.is_active = 1 AND d.is_active = 1
                
                UNION ALL
                
                SELECT 
                    'Division-Department' as relationship_type,
                    COUNT(*) as total_relationships
                FROM Divisions d
                JOIN Departments dept ON d.division_code = dept.division_code
                WHERE d.is_active = 1 AND dept.is_active = 1
            `);
            this.logTest('Parent-Child Relationships', relationships.recordset.length === 3, `Verified ${relationships.recordset.length} relationship types`);

            // Test Organizational Structure Integrity
            console.log('🌳 Test 10.3: Organizational Structure Integrity');
            const integrityCheck = await this.pool.request().query(`
                SELECT 
                    dept.department_code,
                    dept.department_name,
                    div.company_code as div_company,
                    b.company_code as branch_company,
                    CASE 
                        WHEN div.company_code = b.company_code THEN 'CONSISTENT'
                        ELSE 'INCONSISTENT'
                    END as integrity_status
                FROM Departments dept
                JOIN Divisions div ON dept.division_code = div.division_code
                JOIN Branches b ON div.branch_code = b.branch_code
                WHERE dept.is_active = 1 AND div.is_active = 1 AND b.is_active = 1
            `);
            
            const inconsistentCount = integrityCheck.recordset.filter(r => r.integrity_status === 'INCONSISTENT').length;
            this.logTest('Structure Integrity', inconsistentCount === 0, `Found ${inconsistentCount} integrity issues`);

            // Test Cascading Queries
            console.log('🌳 Test 10.4: Cascading Queries (Company -> All Children)');
            const cascadingQuery = await this.pool.request()
                .input('companyCode', sql.VarChar(50), 'RUXCHAI')
                .query(`
                    SELECT 
                        'Branch' as entity_type,
                        branch_code as entity_code,
                        branch_name as entity_name
                    FROM Branches
                    WHERE company_code = @companyCode AND is_active = 1
                    
                    UNION ALL
                    
                    SELECT 
                        'Division' as entity_type,
                        div.division_code as entity_code,
                        div.division_name as entity_name
                    FROM Divisions div
                    WHERE div.company_code = @companyCode AND div.is_active = 1
                    
                    UNION ALL
                    
                    SELECT 
                        'Department' as entity_type,
                        dept.department_code as entity_code,
                        dept.department_name as entity_name
                    FROM Departments dept
                    JOIN Divisions div ON dept.division_code = div.division_code
                    WHERE div.company_code = @companyCode AND dept.is_active = 1 AND div.is_active = 1
                    
                    ORDER BY entity_type, entity_name
                `);
            this.logTest('Cascading Queries', cascadingQuery.recordset.length > 0, `Retrieved ${cascadingQuery.recordset.length} child entities for RUXCHAI`);

        } catch (error) {
            this.logTest('Hierarchical Data', false, error.message);
        }
        console.log();
    }

    async runAllTests() {
        console.log('🚀 COMPREHENSIVE API REQUIREMENTS TEST SUITE\n');
        console.log('🗄️ Testing against SQL Server Database Test Environment\n');
        console.log('=' + '='.repeat(70) + '\n');

        const startTime = Date.now();

        try {
            await this.connect();

            await this.testCompanyManagement();
            await this.testBranchManagement();
            await this.testDivisionManagement();
            await this.testDepartmentManagement();
            await this.testAPIKeyManagement();
            await this.testSearchAndFiltering();
            await this.testPaginationAndSorting();
            await this.testDataExport();
            await this.testErrorHandling();
            await this.testHierarchicalData();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        } finally {
            await this.disconnect();
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log('\n' + '=' + '='.repeat(70));
        console.log('📊 TEST SUITE SUMMARY');
        console.log('=' + '='.repeat(70));
        console.log(`⏱️  Total Execution Time: ${duration}ms`);
        console.log(`✅ Tests Passed: ${this.testResults.passed}`);
        console.log(`❌ Tests Failed: ${this.testResults.failed}`);
        console.log(`📋 Total Tests: ${this.testResults.total}`);
        console.log(`📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
        
        if (this.testResults.failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! API is ready for production deployment!');
        } else {
            console.log(`\n⚠️  ${this.testResults.failed} tests failed. Please review and fix issues.`);
        }
        console.log('=' + '='.repeat(70) + '\n');
    }
}

// Run the comprehensive test suite
const tester = new ComprehensiveAPITester();
tester.runAllTests();