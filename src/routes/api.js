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
const branchController = require('../controllers/branchController');
const divisionController = require('../controllers/divisionController');
const departmentController = require('../controllers/departmentController');
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

// Debug middleware to log all requests
router.use((req, res, next) => {
    console.log(`API Request: ${req.method} ${req.path}`);
    next();
});

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

// DELETE route first to ensure it's matched
router.delete(`${API_VERSION}/companies/:code`,
    apiAuth(['write']),
    companyValidator.getCompanyByCodeRules(),
    validate,
    companyController.deleteCompany
);

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
    branchController.getAllBranches
);

router.get(`${API_VERSION}/branches/:code`,
    branchValidator.getBranchByCodeRules(),
    validate,
    branchController.getBranchByCode
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
    branchController.createBranch
);

router.put(`${API_VERSION}/branches/:code`,
    apiAuth(['write']),
    branchValidator.updateBranchRules(),
    validate,
    branchController.updateBranch
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

router.delete(`${API_VERSION}/branches/:code`,
    apiAuth(['write']),
    branchValidator.getBranchByCodeRules(),
    validate,
    branchController.deleteBranch
);

// ===== DIVISIONS ROUTES =====
router.get(`${API_VERSION}/divisions`,
    divisionValidator.searchDivisionsRules(),
    validate,
    validatePagination,
    divisionController.getAllDivisions
);

router.get(`${API_VERSION}/divisions/:code`,
    divisionValidator.getDivisionByCodeRules(),
    validate,
    divisionController.getDivisionByCode
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
    divisionController.createDivision
);

router.put(`${API_VERSION}/divisions/:code`,
    apiAuth(['write']),
    divisionValidator.updateDivisionRules(),
    validate,
    divisionController.updateDivision
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

router.delete(`${API_VERSION}/divisions/:code`,
    apiAuth(['write']),
    divisionValidator.getDivisionByCodeRules(),
    validate,
    divisionController.deleteDivision
);

// ===== DEPARTMENTS ROUTES =====
router.get(`${API_VERSION}/departments`,
    departmentValidator.searchDepartmentsRules(),
    validate,
    validatePagination,
    departmentController.getAllDepartments
);

router.get(`${API_VERSION}/departments/:code`,
    departmentValidator.getDepartmentByCodeRules(),
    validate,
    departmentController.getDepartmentByCode
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
    departmentController.createDepartment
);

router.put(`${API_VERSION}/departments/:code`,
    apiAuth(['write']),
    departmentValidator.updateDepartmentRules(),
    validate,
    departmentController.updateDepartment
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

router.delete(`${API_VERSION}/departments/:code`,
    apiAuth(['write']),
    departmentValidator.getDepartmentByCodeRules(),
    validate,
    departmentController.deleteDepartment
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