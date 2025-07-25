const Branch = require('../models/Branch');
const Company = require('../models/Company');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendPaginated, created, updated, deleted, notFound } = require('../utils/response');
const { getPaginationParams } = require('../utils/pagination');
const logger = require('../utils/logger');

// Display branches list page
const showBranchesPage = asyncHandler(async (req, res) => {
    const { page, limit } = getPaginationParams(req);
    const filters = {
        company_code: req.query.company_code,
        is_active: req.query.is_active,
        is_headquarters: req.query.is_headquarters,
        search: req.query.search
    };

    const [result, companies] = await Promise.all([
        Branch.findPaginated(page, limit, filters),
        Company.findAll({ is_active: true })
    ]);
    
    res.render('branches/index', {
        title: 'Branches',
        branches: result.data,
        pagination: result.pagination,
        companies: companies,
        filters: filters,
        query: req.query,
        success: req.flash('success'),
        error: req.flash('error')
    });
});

// Display create branch form
const showCreateBranchForm = asyncHandler(async (req, res) => {
    const companies = await Company.findAll({ is_active: true });
    
    res.render('branches/create', {
        title: 'Create Branch',
        companies: companies,
        selectedCompany: req.query.company_code,
        error: req.flash('error')
    });
});

// Display edit branch form
const showEditBranchForm = asyncHandler(async (req, res) => {
    try {
        logger.info('Fetching branch for edit form:', { code: req.params.code });
        const branch = await Branch.findByCode(req.params.code);
        
        if (!branch) {
            logger.warn('Branch not found for edit:', { code: req.params.code });
            req.flash('error', 'Branch not found');
            return res.redirect('/branches');
        }
        
        const companies = await Company.findAll({ is_active: true });
        logger.info('Branch and companies data loaded for edit form:', { 
            branchCode: branch.branch_code, 
            companiesCount: companies.length 
        });
        
        // Ensure all branch fields have default values to prevent template errors
        const safeBranch = {
            branch_code: branch.branch_code || '',
            branch_name: branch.branch_name || '',
            company_code: branch.company_code || '',
            company_name_th: branch.company_name_th || '',
            company_name_en: branch.company_name_en || '',
            is_headquarters: branch.is_headquarters !== undefined ? branch.is_headquarters : false,
            is_active: branch.is_active !== undefined ? branch.is_active : true,
            created_date: branch.created_date || new Date(),
            created_by: branch.created_by || 'system',
            updated_date: branch.updated_date || null,
            updated_by: branch.updated_by || null
        };
        
        res.render('branches/edit', {
            title: 'Edit Branch',
            branch: safeBranch,
            companies: companies || [],
            error: req.flash('error')
        });
    } catch (error) {
        logger.error('Error in showEditBranchForm:', error);
        req.flash('error', 'An error occurred while loading the edit form: ' + error.message);
        res.redirect('/branches');
    }
});

// Handle create branch form submission
const handleCreateBranch = asyncHandler(async (req, res) => {
    try {
        const branchData = {
            branch_code: req.body.branch_code,
            branch_name: req.body.branch_name,
            company_code: req.body.company_code,
            is_headquarters: req.body.is_headquarters === 'on',
            is_active: req.body.is_active === 'true' || req.body.is_active === 'on',
            created_by: req.user?.username || 'admin'
        };

        const branch = new Branch(branchData);
        await branch.create();
        
        logger.info(`Branch created: ${branch.branch_code} by ${branchData.created_by}`);
        
        req.flash('success', 'Branch created successfully');
        res.redirect('/branches');
    } catch (error) {
        logger.error('Error creating branch:', error);
        req.flash('error', error.message || 'Failed to create branch');
        res.redirect('/branches/new');
    }
});

// Handle update branch form submission
const handleUpdateBranch = asyncHandler(async (req, res) => {
    try {
        const branch = await Branch.findByCode(req.params.code);
        
        if (!branch) {
            req.flash('error', 'Branch not found');
            return res.redirect('/branches');
        }
        
        // Validate required fields
        if (!req.body.branch_name || req.body.branch_name.trim() === '') {
            req.flash('error', 'Branch name is required');
            return res.redirect(`/branches/${req.params.code}/edit`);
        }
        
        // Update fields
        branch.branch_name = req.body.branch_name.trim();
        branch.is_headquarters = req.body.is_headquarters === 'on';
        if (req.body.is_active !== undefined) {
            branch.is_active = req.body.is_active === 'on' || req.body.is_active === true;
        }
        branch.updated_by = req.user?.username || 'admin';
        
        await branch.update();
        
        logger.info(`Branch updated: ${branch.branch_code} by ${branch.updated_by}`);
        
        req.flash('success', 'Branch updated successfully');
        res.redirect('/branches');
    } catch (error) {
        logger.error('Error updating branch:', error);
        req.flash('error', error.message || 'An error occurred while updating the branch');
        res.redirect(`/branches/${req.params.code}/edit`);
    }
});

// Handle toggle branch status
const handleToggleStatus = asyncHandler(async (req, res) => {
    try {
        const branch = await Branch.findByCode(req.params.code);
        
        if (!branch) {
            req.flash('error', 'Branch not found');
            return res.redirect('/branches');
        }
        
        const newStatus = !branch.is_active;
        await Branch.updateStatus(req.params.code, newStatus, req.user?.username || 'admin');
        
        logger.info(`Branch status updated: ${req.params.code} to ${newStatus ? 'active' : 'inactive'}`);
        
        req.flash('success', `Branch ${newStatus ? 'activated' : 'deactivated'} successfully`);
        res.redirect('/branches');
    } catch (error) {
        logger.error('Error toggling branch status:', error);
        req.flash('error', error.message);
        res.redirect('/branches');
    }
});

// API Controllers

// Get all branches with pagination
const getAllBranches = asyncHandler(async (req, res) => {
    const { page, limit } = getPaginationParams(req);
    const filters = {
        company_code: req.query.company_code,
        is_active: req.query.is_active,
        is_headquarters: req.query.is_headquarters,
        search: req.query.search
    };

    const result = await Branch.findPaginated(page, limit, filters);
    sendPaginated(res, result.data, result.pagination, 'Branches retrieved successfully');
});

// Get branch by code
const getBranchByCode = asyncHandler(async (req, res) => {
    const branch = await Branch.findByCode(req.params.code);
    if (!branch) {
        return notFound(res, 'Branch not found');
    }
    sendSuccess(res, branch, 'Branch retrieved successfully');
});

// Create new branch
const createBranch = asyncHandler(async (req, res) => {
    const branchData = {
        branch_code: req.body.branch_code,
        branch_name: req.body.branch_name,
        company_code: req.body.company_code,
        is_headquarters: req.body.is_headquarters || false,
        is_active: req.body.is_active !== undefined ? req.body.is_active : true,
        created_by: req.apiAuth?.appName || req.user?.username || 'system'
    };

    const branch = new Branch(branchData);
    const result = await branch.create();
    
    logger.info(`Branch created: ${result.branch_code} by ${branchData.created_by}`);
    created(res, result, 'Branch created successfully');
});

// Update branch
const updateBranch = asyncHandler(async (req, res) => {
    const branch = await Branch.findByCode(req.params.code);
    if (!branch) {
        return notFound(res, 'Branch not found');
    }

    // Validate and update fields
    if (req.body.branch_name !== undefined) {
        if (!req.body.branch_name || req.body.branch_name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Branch name is required'
            });
        }
        branch.branch_name = req.body.branch_name.trim();
    }
    if (req.body.is_headquarters !== undefined) {
        branch.is_headquarters = req.body.is_headquarters;
    }
    if (req.body.is_active !== undefined) {
        branch.is_active = req.body.is_active;
    }
    
    branch.updated_by = req.apiAuth?.appName || req.user?.username || 'system';
    const result = await branch.update();
    
    logger.info(`Branch updated: ${result.branch_code} by ${branch.updated_by}`);
    updated(res, result, 'Branch updated successfully');
});

// Delete branch
const deleteBranch = asyncHandler(async (req, res) => {
    const branch = await Branch.findByCode(req.params.code);
    if (!branch) {
        return notFound(res, 'Branch not found');
    }
    
    const result = await branch.delete();
    
    logger.info(`Branch deleted: ${req.params.code} by ${req.apiAuth?.appName || req.user?.username || 'system'}`);
    deleted(res, result, 'Branch deleted successfully');
});

module.exports = {
    // Web controllers
    showBranchesPage,
    showCreateBranchForm,
    showEditBranchForm,
    handleCreateBranch,
    handleUpdateBranch,
    handleToggleStatus,
    
    // API controllers
    getAllBranches,
    getBranchByCode,
    createBranch,
    updateBranch,
    deleteBranch
};