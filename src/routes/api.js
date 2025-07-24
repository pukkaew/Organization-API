const express = require('express');
const router = express.Router();

// Import middleware
const { apiAuth, logApiResponse } = require('../middleware/apiAuth');
const { validate, validatePagination } = require('../middleware/validation');

// Import validators
const companyValidator = require('../validators/companyValidator');
const branchValidator = require('../validators/branchValidator');
const divisionValidator = require('../validators/divisionValidator');
const departmentValidator = require('../validators/departmentValidator');

// Import controllers
const companyController = require('../controllers/companyController');
const apiController = require('../controllers/apiController');

// Import services
const OrganizationService = require('../services/organizationService');

// Import models for direct API access
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const Division = require('../models/Division');
const Department = require('../models/Department');

// Response utilities
const { sendSuccess, sendPaginated, created, updated, deleted, notFound } = require('../utils/response');
const { getPaginationParams } = require('../utils/pagination');
const { asyncHandler } = require('../middleware/errorHandler');

// API Version
const API_VERSION = '/v1';

// Apply API authentication to all routes
router.use(apiAuth(['read']));

// Log all API responses
router.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
        logApiResponse(req, res);
        originalJson.call(this, data);
    };
    next();
});

// ===== COMPANIES ROUTES =====
router.get(`${API_VERSION}/companies`, 
    companyValidator.searchCompaniesRules(),
    validate,
    validatePagination,
    companyController.getAllCompanies
);

router.get(`${API_VERSION}/companies/:code`, 
    companyValidator.getCompanyByCodeRules(),
    validate,
    companyController.getCompanyByCode
);

router.post(`${API_VERSION}/companies`,
    apiAuth(['write']),
    companyValidator.createCompanyRules(),
    validate,
    companyController.createCompany
);

router.put(`${API_VERSION}/companies/:code`,
    apiAuth(['write']),
    companyValidator.updateCompanyRules(),
    validate,
    companyController.updateCompany
);

router.patch(`${API_VERSION}/companies/:code/status`,
    apiAuth(['write']),
    companyValidator.updateCompanyStatusRules(),
    validate,
    companyController.updateCompanyStatus
);

// ===== BRANCHES ROUTES =====
router.get(`${API_VERSION}/branches`,
    branchValidator.searchBranchesRules(),
    validate,
    validatePagination,
    asyncHandler(async (req, res) => {
        const { page, limit } = getPaginationParams(req);
        const filters = {
            company_code: req.query.company_code,
            is_active: req.query.is_active,
            is_headquarters: req.query.is_headquarters,
            search: req.query.search
        };

        const result = await Branch.findPaginated(page, limit, filters);
        sendPaginated(res, result.data, result.pagination, 'Branches retrieved successfully');
    })
);

router.get(`${API_VERSION}/branches/:code`,
    branchValidator.getBranchByCodeRules(),
    validate,
    asyncHandler(async (req, res) => {
        const branch = await Branch.findByCode(req.params.code);
        if (!branch) {
            return notFound(res, 'Branch not found');
        }
        sendSuccess(res, branch, 'Branch retrieved successfully');
    })
);

router.get(`${API_VERSION}/companies/:code/branches`,
    branchValidator.getBranchesByCompanyRules(),
    validate,
    asyncHandler(async (req, res) => {
        const branches = await Branch.findByCompany(req.params.code);
        sendSuccess(res, branches, 'Company branches retrieved successfully');
    })
);

router.post(`${API_VERSION}/branches`,
    apiAuth(['write']),
    branchValidator.createBranchRules(),
    validate,
    asyncHandler(async (req, res) => {
        const branchData = {
            branch_code: req.body.branch_code,
            branch_name: req.body.branch_name,
            company_code: req.body.company_code,
            is_headquarters: req.body.is_headquarters || false,
            is_active: req.body.is_active !== undefined ? req.body.is_active : true,
            created_by: req.apiAuth.appName
        };

        const branch = new Branch(branchData);
        const result = await branch.create();
        created(res, result, 'Branch created successfully');
    })
);

router.put(`${API_VERSION}/branches/:code`,
    apiAuth(['write']),
    branchValidator.updateBranchRules(),
    validate,
    asyncHandler(async (req, res) => {
        const branch = await Branch.findByCode(req.params.code);
        if (!branch) {
            return notFound(res, 'Branch not found');
        }

        if (req.body.branch_name !== undefined) {
            branch.branch_name = req.body.branch_name;
        }
        if (req.body.is_headquarters !== undefined) {
            branch.is_headquarters = req.body.is_headquarters;
        }
        
        branch.updated_by = req.apiAuth.appName;
        const result = await branch.update();
        updated(res, result, 'Branch updated successfully');
    })
);

router.patch(`${API_VERSION}/branches/:code/status`,
    apiAuth(['write']),
    branchValidator.updateBranchStatusRules(),
    validate,
    asyncHandler(async (req, res) => {
        const result = await Branch.updateStatus(
            req.params.code, 
            req.body.is_active, 
            req.apiAuth.appName
        );
        updated(res, result, `Branch ${req.body.is_active ? 'activated' : 'deactivated'} successfully`);
    })
);

// ===== DIVISIONS ROUTES =====
router.get(`${API_VERSION}/divisions`,
    divisionValidator.searchDivisionsRules(),
    validate,
    validatePagination,
    asyncHandler(async (req, res) => {
        const { page, limit } = getPaginationParams(req);
        const filters = {
            company_code: req.query.company_code,
            branch_code: req.query.branch_code,
            is_active: req.query.is_active,
            search: req.query.search
        };

        const result = await Division.findPaginated(page, limit, filters);
        sendPaginated(res, result.data, result.pagination, 'Divisions retrieved successfully');
    })
);

router.get(`${API_VERSION}/divisions/:code`,
    divisionValidator.getDivisionByCodeRules(),
    validate,
    asyncHandler(async (req, res) => {
        const division = await Division.findByCode(req.params.code);
        if (!division) {
            return notFound(res, 'Division not found');
        }
        sendSuccess(res, division, 'Division retrieved successfully');
    })
);

router.get(`${API_VERSION}/companies/:code/divisions`,
    divisionValidator.getDivisionsByCompanyRules(),
    validate,
    asyncHandler(async (req, res) => {
        const divisions = await Division.findByCompany(req.params.code);
        sendSuccess(res, divisions, 'Company divisions retrieved successfully');
    })
);

router.get(`${API_VERSION}/branches/:code/divisions`,
    divisionValidator.getDivisionsByBranchRules(),
    validate,
    asyncHandler(async (req, res) => {
        const divisions = await Division.findByBranch(req.params.code);
        sendSuccess(res, divisions, 'Branch divisions retrieved successfully');
    })
);

router.post(`${API_VERSION}/divisions`,
    apiAuth(['write']),
    divisionValidator.createDivisionRules(),
    validate,
    asyncHandler(async (req, res) => {
        const divisionData = {
            division_code: req.body.division_code,
            division_name: req.body.division_name,
            company_code: req.body.company_code,
            branch_code: req.body.branch_code || null,
            is_active: req.body.is_active !== undefined ? req.body.is_active : true,
            created_by: req.apiAuth.appName
        };

        const division = new Division(divisionData);
        const result = await division.create();
        created(res, result, 'Division created successfully');
    })
);

router.put(`${API_VERSION}/divisions/:code`,
    apiAuth(['write']),
    divisionValidator.updateDivisionRules(),
    validate,
    asyncHandler(async (req, res) => {
        const division = await Division.findByCode(req.params.code);
        if (!division) {
            return notFound(res, 'Division not found');
        }

        if (req.body.division_name !== undefined) {
            division.division_name = req.body.division_name;
        }
        if (req.body.branch_code !== undefined) {
            division.branch_code = req.body.branch_code;
        }
        
        division.updated_by = req.apiAuth.appName;
        const result = await division.update();
        updated(res, result, 'Division updated successfully');
    })
);

router.patch(`${API_VERSION}/divisions/:code/status`,
    apiAuth(['write']),
    divisionValidator.updateDivisionStatusRules(),
    validate,
    asyncHandler(async (req, res) => {
        const result = await Division.updateStatus(
            req.params.code, 
            req.body.is_active, 
            req.apiAuth.appName
        );
        updated(res, result, `Division ${req.body.is_active ? 'activated' : 'deactivated'} successfully`);
    })
);

router.patch(`${API_VERSION}/divisions/:code/move`,
    apiAuth(['write']),
    divisionValidator.moveDivisionRules(),
    validate,
    asyncHandler(async (req, res) => {
        const result = await Division.moveToBranch(
            req.params.code,
            req.body.branch_code,
            req.apiAuth.appName
        );
        updated(res, result, 'Division moved successfully');
    })
);

// ===== DEPARTMENTS ROUTES =====
router.get(`${API_VERSION}/departments`,
    departmentValidator.searchDepartmentsRules(),
    validate,
    validatePagination,
    asyncHandler(async (req, res) => {
        const { page, limit } = getPaginationParams(req);
        const filters = {
            division_code: req.query.division_code,
            company_code: req.query.company_code,
            branch_code: req.query.branch_code,
            is_active: req.query.is_active,
            search: req.query.search
        };

        const result = await Department.findPaginated(page, limit, filters);
        sendPaginated(res, result.data, result.pagination, 'Departments retrieved successfully');
    })
);

router.get(`${API_VERSION}/departments/:code`,
    departmentValidator.getDepartmentByCodeRules(),
    validate,
    asyncHandler(async (req, res) => {
        const department = await Department.findByCode(req.params.code);
        if (!department) {
            return notFound(res, 'Department not found');
        }
        sendSuccess(res, department, 'Department retrieved successfully');
    })
);

router.get(`${API_VERSION}/divisions/:code/departments`,
    departmentValidator.getDepartmentsByDivisionRules(),
    validate,
    asyncHandler(async (req, res) => {
        const departments = await Department.findByDivision(req.params.code);
        sendSuccess(res, departments, 'Division departments retrieved successfully');
    })
);

router.post(`${API_VERSION}/departments`,
    apiAuth(['write']),
    departmentValidator.createDepartmentRules(),
    validate,
    asyncHandler(async (req, res) => {
        const departmentData = {
            department_code: req.body.department_code,
            department_name: req.body.department_name,
            division_code: req.body.division_code,
            is_active: req.body.is_active !== undefined ? req.body.is_active : true,
            created_by: req.apiAuth.appName
        };

        const department = new Department(departmentData);
        const result = await department.create();
        created(res, result, 'Department created successfully');
    })
);

router.put(`${API_VERSION}/departments/:code`,
    apiAuth(['write']),
    departmentValidator.updateDepartmentRules(),
    validate,
    asyncHandler(async (req, res) => {
        const department = await Department.findByCode(req.params.code);
        if (!department) {
            return notFound(res, 'Department not found');
        }

        if (req.body.department_name !== undefined) {
            department.department_name = req.body.department_name;
        }
        
        department.updated_by = req.apiAuth.appName;
        const result = await department.update();
        updated(res, result, 'Department updated successfully');
    })
);

router.patch(`${API_VERSION}/departments/:code/status`,
    apiAuth(['write']),
    departmentValidator.updateDepartmentStatusRules(),
    validate,
    asyncHandler(async (req, res) => {
        const result = await Department.updateStatus(
            req.params.code, 
            req.body.is_active, 
            req.apiAuth.appName
        );
        updated(res, result, `Department ${req.body.is_active ? 'activated' : 'deactivated'} successfully`);
    })
);

router.patch(`${API_VERSION}/departments/:code/move`,
    apiAuth(['write']),
    departmentValidator.moveDepartmentRules(),
    validate,
    asyncHandler(async (req, res) => {
        const result = await Department.moveToDivision(
            req.params.code,
            req.body.division_code,
            req.apiAuth.appName
        );
        updated(res, result, 'Department moved successfully');
    })
);

// ===== SPECIAL ROUTES =====
router.get(`${API_VERSION}/organization-tree`,
    apiController.getOrganizationTree
);

router.get(`${API_VERSION}/organization-tree/:code`,
    companyValidator.getCompanyByCodeRules(),
    validate,
    asyncHandler(async (req, res) => {
        const tree = await OrganizationService.getOrganizationTree(req.params.code);
        if (!tree || tree.length === 0) {
            return notFound(res, 'Company not found or has no organization structure');
        }
        sendSuccess(res, tree[0], 'Organization tree retrieved successfully');
    })
);

router.get(`${API_VERSION}/search`,
    apiController.searchOrganization
);

router.get(`${API_VERSION}/hierarchy/:type/:code`,
    apiController.getEntityHierarchy
);

router.get(`${API_VERSION}/statistics`,
    apiController.getOrganizationStatistics
);

// ===== FLEXIBLE API ROUTES (FR-API-004) =====
router.get(`${API_VERSION}/flexible/company-departments`,
    // companyValidator.flexibleApiRules(),
    // validate,
    asyncHandler(async (req, res) => {
        const company_code = req.query.company;
        if (!company_code) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_COMPANY_CODE',
                    message: 'Company code is required',
                    field: 'company'
                }
            });
        }

        const result = await OrganizationService.getCompanyWithDepartments(company_code);
        if (!result) {
            return notFound(res, 'Company not found');
        }

        const response = {
            success: true,
            data: result,
            meta: {
                included: ['company', 'departments'],
                total_departments: result.departments.length
            }
        };

        res.json(response);
    })
);

router.get(`${API_VERSION}/flexible/company-full`,
    // companyValidator.flexibleApiRules(),
    // validate,
    asyncHandler(async (req, res) => {
        const company_code = req.query.company;
        if (!company_code) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_COMPANY_CODE',
                    message: 'Company code is required',
                    field: 'company'
                }
            });
        }

        const result = await OrganizationService.getCompanyFull(company_code);
        if (!result) {
            return notFound(res, 'Company not found');
        }

        const response = {
            success: true,
            data: result,
            meta: {
                included: ['company', 'branches', 'divisions', 'departments'],
                total_branches: result.branches.length,
                total_divisions: result.divisions.length,
                total_departments: result.departments.length
            }
        };

        res.json(response);
    })
);

router.get(`${API_VERSION}/flexible/custom`,
    // companyValidator.flexibleApiRules(),
    // validate,
    asyncHandler(async (req, res) => {
        const company_code = req.query.company;
        if (!company_code) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_COMPANY_CODE',
                    message: 'Company code is required',
                    field: 'company'
                }
            });
        }

        // Parse include and skip parameters
        const includeParam = req.query.include || '';
        const skipParam = req.query.skip || '';
        
        const includeArray = includeParam.split(',').map(s => s.trim()).filter(s => s);
        const skipArray = skipParam.split(',').map(s => s.trim()).filter(s => s);

        const includeParams = {
            branches: includeArray.includes('branches'),
            divisions: includeArray.includes('divisions'),
            departments: includeArray.includes('departments'),
            skip: skipArray
        };

        const result = await OrganizationService.getCustomOrganizationData(company_code, includeParams);
        if (!result) {
            return notFound(res, 'Company not found');
        }

        // Build included array based on what was actually included
        const included = ['company'];
        if (result.branches) included.push('branches');
        if (result.divisions) included.push('divisions');
        if (result.departments) included.push('departments');

        const response = {
            success: true,
            data: result,
            meta: {
                included,
                ...(result.branches && { total_branches: result.branches.length }),
                ...(result.divisions && { total_divisions: result.divisions.length }),
                ...(result.departments && { total_departments: result.departments.length })
            }
        };

        res.json(response);
    })
);

// ===== ERROR HANDLING =====
router.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'ENDPOINT_NOT_FOUND',
            message: 'The requested API endpoint does not exist'
        }
    });
});

module.exports = router;