const Division = require('../models/Division');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendPaginated, created, updated, deleted, notFound } = require('../utils/response');
const { getPaginationParams } = require('../utils/pagination');
const logger = require('../utils/logger');

// Display divisions list page
const showDivisionsPage = asyncHandler(async (req, res) => {
    try {
        const { page, limit } = getPaginationParams(req);
        const filters = {
            company_code: req.query.company_code,
            branch_code: req.query.branch_code,
            is_active: req.query.is_active,
            search: req.query.search
        };

        logger.info('Fetching divisions with filters:', filters);
        
        const [result, companies] = await Promise.all([
            Division.findPaginated(page, limit, filters),
            Company.findAll({ is_active: true })
        ]);
        
        logger.info('Divisions fetch result:', { dataCount: result.data.length, companiesCount: companies.length });
        
        res.render('divisions/index', {
            title: 'Divisions',
            divisions: result.data,
            pagination: result.pagination,
            companies: companies,
            filters: filters,
            query: req.query,
            success: null,
            error: null
        });
    } catch (error) {
        logger.error('Error in showDivisionsPage:', error);
        res.redirect('/');
    }
});

// Display create division form
const showCreateDivisionForm = asyncHandler(async (req, res) => {
    try {
        logger.info('Fetching companies for division create form');
        const companies = await Company.findAll({ is_active: true });
        logger.info('Companies fetched for division create form:', { count: companies.length });
        
        res.render('divisions/create', {
            title: 'Create Division',
            companies: companies,
            selectedCompany: req.query.company_code,
            csrfToken: req.csrfToken ? req.csrfToken() : '',
            error: null
        });
    } catch (error) {
        logger.error('Error in showCreateDivisionForm:', error);
        res.redirect('/divisions');
    }
});

// Display edit division form
const showEditDivisionForm = asyncHandler(async (req, res) => {
    try {
        logger.info('Fetching division for edit form:', { code: req.params.code });
        const division = await Division.findByCode(req.params.code);
        
        if (!division) {
            logger.warn('Division not found for edit:', { code: req.params.code });
            return res.redirect('/divisions');
        }
        
        const [companies, branches] = await Promise.all([
            Company.findAll({ is_active: true }),
            Branch.findByCompany(division.company_code)
        ]);
        
        logger.info('Division and related data loaded for edit form:', { 
            divisionCode: division.division_code, 
            companiesCount: companies.length,
            branchesCount: branches.length
        });
        
        // Ensure all division fields have default values to prevent template errors
        const safeDivision = {
            division_code: division.division_code || '',
            division_name: division.division_name || '',
            company_code: division.company_code || '',
            branch_code: division.branch_code || null,
            company_name_th: division.company_name_th || '',
            company_name_en: division.company_name_en || '',
            branch_name: division.branch_name || null,
            is_active: division.is_active !== undefined ? division.is_active : true,
            created_date: division.created_date || new Date(),
            created_by: division.created_by || 'system',
            updated_date: division.updated_date || null,
            updated_by: division.updated_by || null
        };
        
        res.render('divisions/edit', {
            title: 'Edit Division',
            division: safeDivision,
            companies: companies || [],
            branches: branches || [],
            error: null
        });
    } catch (error) {
        logger.error('Error in showEditDivisionForm:', error);
        res.redirect('/divisions');
    }
});

// Handle create division form submission
const handleCreateDivision = asyncHandler(async (req, res) => {
    try {
        const divisionData = {
            division_code: req.body.division_code,
            division_name: req.body.division_name,
            company_code: req.body.company_code,
            branch_code: req.body.branch_code || null,
            is_active: req.body.is_active === 'true' || req.body.is_active === 'on',
            created_by: req.user?.username || 'admin'
        };

        const division = new Division(divisionData);
        await division.create();
        
        logger.info(`Division created: ${division.division_code} by ${divisionData.created_by}`);
        
        res.redirect('/divisions');
    } catch (error) {
        logger.error('Error creating division:', error);
        res.redirect('/divisions/new');
    }
});

// Handle update division form submission
const handleUpdateDivision = asyncHandler(async (req, res) => {
    try {
        const division = await Division.findByCode(req.params.code);
        
        if (!division) {
            return res.redirect('/divisions');
        }
        
        // Validate required fields
        if (!req.body.division_name || req.body.division_name.trim() === '') {
            return res.redirect(`/divisions/${req.params.code}/edit`);
        }
        
        // Update fields
        division.division_name = req.body.division_name.trim();
        division.branch_code = req.body.branch_code || null;
        if (req.body.is_active !== undefined) {
            division.is_active = req.body.is_active === 'on' || req.body.is_active === true;
        }
        division.updated_by = req.user?.username || 'admin';
        
        await division.update();
        
        logger.info(`Division updated: ${division.division_code} by ${division.updated_by}`);
        
        res.redirect('/divisions');
    } catch (error) {
        logger.error('Error updating division:', error);
        res.redirect(`/divisions/${req.params.code}/edit`);
    }
});

// Handle toggle division status
const handleToggleStatus = asyncHandler(async (req, res) => {
    try {
        const division = await Division.findByCode(req.params.code);
        
        if (!division) {
            return res.redirect('/divisions');
        }
        
        const newStatus = !division.is_active;
        await Division.updateStatus(req.params.code, newStatus, req.user?.username || 'admin');
        
        logger.info(`Division status updated: ${req.params.code} to ${newStatus ? 'active' : 'inactive'}`);
        
        res.redirect('/divisions');
    } catch (error) {
        logger.error('Error toggling division status:', error);
        res.redirect('/divisions');
    }
});

// AJAX endpoint to get branches by company
const getBranchesByCompany = asyncHandler(async (req, res) => {
    const companyCode = req.params.companyCode;
    const branches = await Branch.findByCompany(companyCode);
    
    res.json({
        success: true,
        data: branches
    });
});

// API Controllers

// Get all divisions with pagination
const getAllDivisions = asyncHandler(async (req, res) => {
    const { page, limit } = getPaginationParams(req);
    const filters = {
        company_code: req.query.company_code,
        branch_code: req.query.branch_code,
        is_active: req.query.is_active,
        search: req.query.search
    };

    const result = await Division.findPaginated(page, limit, filters);
    sendPaginated(res, result.data, result.pagination, 'Divisions retrieved successfully');
});

// Get division by code
const getDivisionByCode = asyncHandler(async (req, res) => {
    const division = await Division.findByCode(req.params.code);
    if (!division) {
        return notFound(res, 'Division not found');
    }
    sendSuccess(res, division, 'Division retrieved successfully');
});

// Create new division
const createDivision = asyncHandler(async (req, res) => {
    const divisionData = {
        division_code: req.body.division_code,
        division_name: req.body.division_name,
        company_code: req.body.company_code,
        branch_code: req.body.branch_code || null,
        is_active: req.body.is_active !== undefined ? req.body.is_active : true,
        created_by: req.apiAuth?.appName || req.user?.username || 'system'
    };

    const division = new Division(divisionData);
    const result = await division.create();
    
    logger.info(`Division created: ${result.division_code} by ${divisionData.created_by}`);
    created(res, result, 'Division created successfully');
});

// Update division
const updateDivision = asyncHandler(async (req, res) => {
    const division = await Division.findByCode(req.params.code);
    if (!division) {
        return notFound(res, 'Division not found');
    }

    // Validate and update fields
    if (req.body.division_name !== undefined) {
        if (!req.body.division_name || req.body.division_name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Division name is required'
            });
        }
        division.division_name = req.body.division_name.trim();
    }
    if (req.body.branch_code !== undefined) {
        division.branch_code = req.body.branch_code || null;
    }
    if (req.body.is_active !== undefined) {
        division.is_active = req.body.is_active;
    }
    
    division.updated_by = req.apiAuth?.appName || req.user?.username || 'system';
    const result = await division.update();
    
    logger.info(`Division updated: ${result.division_code} by ${division.updated_by}`);
    updated(res, result, 'Division updated successfully');
});

// Delete division
const deleteDivision = asyncHandler(async (req, res) => {
    const division = await Division.findByCode(req.params.code);
    if (!division) {
        return notFound(res, 'Division not found');
    }
    
    const result = await division.delete();
    
    logger.info(`Division deleted: ${req.params.code} by ${req.apiAuth?.appName || req.user?.username || 'system'}`);
    deleted(res, result, 'Division deleted successfully');
});

// Handle delete division (web)
const handleDeleteDivision = asyncHandler(async (req, res) => {
    try {
        const division = await Division.findByCode(req.params.code);
        
        if (!division) {
            return res.redirect('/divisions');
        }
        
        // Delete the division
        await division.delete();
        
        logger.info(`Division deleted: ${req.params.code} by ${req.user?.username || 'system'}`);
        
        res.redirect('/divisions');
    } catch (error) {
        logger.error('Error deleting division:', error);
        res.redirect('/divisions');
    }
});

module.exports = {
    // Web controllers
    showDivisionsPage,
    showCreateDivisionForm,
    showEditDivisionForm,
    handleCreateDivision,
    handleUpdateDivision,
    handleToggleStatus,
    handleDeleteDivision,
    getBranchesByCompany,
    
    // API controllers
    getAllDivisions,
    getDivisionByCode,
    createDivision,
    updateDivision,
    deleteDivision
};