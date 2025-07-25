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
const flexibleController = require('../controllers/flexibleController');
const organizationController = require('../controllers/organizationController');
const searchController = require('../controllers/searchController');

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

// ===== ADVANCED API ROUTES =====

// Organization Tree API
router.get(`${API_VERSION}/organization-tree`,
    organizationController.getOrganizationTree
);

router.get(`${API_VERSION}/organization-tree/:company_code`,
    companyValidator.getCompanyByCodeRules(),
    validate,
    organizationController.getCompanyOrganizationTree
);

// Global Search API
router.get(`${API_VERSION}/search`,
    searchController.globalSearch
);

// Flexible Data Retrieval API
router.get(`${API_VERSION}/flexible/company-departments`,
    flexibleController.getCompanyDepartments
);

router.get(`${API_VERSION}/flexible/company-full`,
    flexibleController.getCompanyFull
);

router.get(`${API_VERSION}/flexible/custom`,
    flexibleController.getCustom
);

router.get(`${API_VERSION}/hierarchy/:type/:code`,
    apiController.getEntityHierarchy
);

router.get(`${API_VERSION}/statistics`,
    apiController.getOrganizationStatistics
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