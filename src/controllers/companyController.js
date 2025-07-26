const Company = require('../models/Company');
const { asyncHandler, businessError } = require('../middleware/errorHandler');
const { sendSuccess, sendPaginated, created, updated, deleted, notFound } = require('../utils/response');
const { getPaginationParams } = require('../utils/pagination');
const logger = require('../utils/logger');

// Get all companies with pagination
const getAllCompanies = asyncHandler(async (req, res) => {
    const { page, limit } = getPaginationParams(req);
    const filters = {
        is_active: req.query.is_active,
        search: req.query.search
    };

    const result = await Company.findPaginated(page, limit, filters);
    
    sendPaginated(res, result.data, result.pagination, 'Companies retrieved successfully');
});

// Get company by code
const getCompanyByCode = asyncHandler(async (req, res) => {
    const company = await Company.findByCode(req.params.code);
    
    if (!company) {
        return notFound(res, 'Company not found');
    }
    
    sendSuccess(res, company, 'Company retrieved successfully');
});

// Create new company
const createCompany = asyncHandler(async (req, res) => {
    const companyData = {
        company_code: req.body.company_code,
        company_name_th: req.body.company_name_th,
        company_name_en: req.body.company_name_en,
        tax_id: req.body.tax_id,
        is_active: req.body.is_active !== undefined ? req.body.is_active : true,
        created_by: req.user?.username || 'system'
    };

    const company = new Company(companyData);
    const result = await company.create();
    
    logger.info(`Company created: ${result.company_code} by ${companyData.created_by}`);
    
    created(res, result, 'Company created successfully');
});

// Update company
const updateCompany = asyncHandler(async (req, res) => {
    const company = await Company.findByCode(req.params.code);
    
    if (!company) {
        return notFound(res, 'Company not found');
    }
    
    // Validate and update fields
    if (req.body.company_name_th !== undefined) {
        if (!req.body.company_name_th || req.body.company_name_th.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Thai company name is required'
            });
        }
        company.company_name_th = req.body.company_name_th.trim();
    }
    if (req.body.company_name_en !== undefined) {
        company.company_name_en = req.body.company_name_en ? req.body.company_name_en.trim() : null;
    }
    if (req.body.tax_id !== undefined) {
        if (req.body.tax_id && req.body.tax_id.trim() !== '') {
            const taxId = req.body.tax_id.trim();
            if (!/^[0-9]{13}$/.test(taxId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tax ID must be exactly 13 digits'
                });
            }
            company.tax_id = taxId;
        } else {
            company.tax_id = null;
        }
    }
    if (req.body.website !== undefined) {
        company.website = req.body.website ? req.body.website.trim() : null;
    }
    if (req.body.email !== undefined) {
        company.email = req.body.email ? req.body.email.trim() : null;
    }
    if (req.body.phone !== undefined) {
        company.phone = req.body.phone ? req.body.phone.trim() : null;
    }
    if (req.body.address !== undefined) {
        company.address = req.body.address ? req.body.address.trim() : null;
    }
    if (req.body.is_active !== undefined) {
        company.is_active = req.body.is_active;
    }
    
    company.updated_by = req.apiAuth?.appName || req.user?.username || 'system';
    
    const result = await company.update();
    
    logger.info(`Company updated: ${result.company_code} by ${company.updated_by}`);
    
    updated(res, result, 'Company updated successfully');
});

// Update company status
const updateCompanyStatus = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { is_active } = req.body;
    const updatedBy = req.user?.username || 'system';
    
    const result = await Company.updateStatus(code, is_active, updatedBy);
    
    logger.info(`Company status updated: ${code} to ${is_active ? 'active' : 'inactive'} by ${updatedBy}`);
    
    updated(res, result, `Company ${is_active ? 'activated' : 'deactivated'} successfully`);
});

// Delete company
const deleteCompany = asyncHandler(async (req, res) => {
    const company = await Company.findByCode(req.params.code);
    
    if (!company) {
        return notFound(res, 'Company not found');
    }
    
    const result = await company.delete();
    
    logger.info(`Company deleted: ${req.params.code} by ${req.apiAuth?.appName || req.user?.username || 'system'}`);
    
    deleted(res, result, 'Company deleted successfully');
});

// Get company statistics
const getCompanyStatistics = asyncHandler(async (req, res) => {
    const stats = await Company.getStatistics();
    
    sendSuccess(res, stats, 'Company statistics retrieved successfully');
});

// Web controllers (for rendering views)

// Display companies list page
const showCompaniesPage = asyncHandler(async (req, res) => {
    const { page, limit } = getPaginationParams(req);
    const filters = {
        is_active: req.query.is_active,
        search: req.query.search
    };

    logger.debug('Company list request:', { page, limit, filters });
    const result = await Company.findPaginated(page, limit, filters);
    
    res.render('companies/index', {
        title: 'Companies',
        companies: result.data,
        pagination: result.pagination,
        filters: filters,
        query: req.query,
        success: req.flash('success'),
        error: req.flash('error')
    });
});

// Display create company form
const showCreateCompanyForm = asyncHandler(async (req, res) => {
    res.render('companies/create', {
        title: 'Create Company',
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        error: req.flash('error')
    });
});

// Display edit company form
const showEditCompanyForm = asyncHandler(async (req, res) => {
    try {
        logger.info('Fetching company for edit form:', { code: req.params.code });
        const company = await Company.findByCode(req.params.code);
        
        if (!company) {
            logger.warn('Company not found for edit:', { code: req.params.code });
            req.flash('error', 'Company not found');
            return res.redirect('/companies');
        }
        
        logger.info('Company found for edit form:', { code: company.company_code, name: company.company_name_th });
        
        // Ensure all company fields have default values to prevent template errors
        const safeCompany = {
            company_code: company.company_code || '',
            company_name_th: company.company_name_th || '',
            company_name_en: company.company_name_en || null,
            tax_id: company.tax_id || null,
            website: company.website || null,
            email: company.email || null,
            phone: company.phone || null,
            address: company.address || null,
            is_active: company.is_active !== undefined ? company.is_active : true,
            created_date: company.created_date || new Date(),
            created_by: company.created_by || 'system',
            updated_date: company.updated_date || null,
            updated_by: company.updated_by || null
        };
        
        res.render('companies/edit', {
            title: 'Edit Company',
            company: safeCompany,
            error: req.flash('error')
        });
    } catch (error) {
        logger.error('Error in showEditCompanyForm:', error);
        req.flash('error', 'An error occurred while loading the edit form: ' + error.message);
        res.redirect('/companies');
    }
});

// Handle create company form submission
const handleCreateCompany = asyncHandler(async (req, res) => {
    try {
        logger.info('Form data received:', req.body);
        
        const companyData = {
            company_code: req.body.company_code,
            company_name_th: req.body.company_name_th,
            company_name_en: req.body.company_name_en,
            tax_id: req.body.tax_id,
            is_active: req.body.is_active === 'true',
            created_by: req.user?.username || 'admin'
        };

        const company = new Company(companyData);
        await company.create();
        
        req.flash('success', 'Company created successfully');
        res.redirect('/companies');
    } catch (error) {
        logger.error('Error creating company:', error);
        req.flash('error', error.message);
        res.redirect('/companies/new');
    }
});

// Handle update company form submission
const handleUpdateCompany = asyncHandler(async (req, res) => {
    try {
        const company = await Company.findByCode(req.params.code);
        
        if (!company) {
            req.flash('error', 'Company not found');
            return res.redirect('/companies');
        }
        
        // Validate required fields
        if (!req.body.company_name_th || req.body.company_name_th.trim() === '') {
            req.flash('error', 'Thai company name is required');
            return res.redirect(`/companies/${req.params.code}/edit`);
        }
        
        // Validate tax ID format if provided
        if (req.body.tax_id && req.body.tax_id.trim() !== '') {
            const taxId = req.body.tax_id.trim();
            if (!/^[0-9]{13}$/.test(taxId)) {
                req.flash('error', 'Tax ID must be exactly 13 digits');
                return res.redirect(`/companies/${req.params.code}/edit`);
            }
        }
        
        // Update fields
        company.company_name_th = req.body.company_name_th.trim();
        company.company_name_en = req.body.company_name_en ? req.body.company_name_en.trim() : null;
        company.tax_id = req.body.tax_id ? req.body.tax_id.trim() : null;
        company.website = req.body.website ? req.body.website.trim() : null;
        company.email = req.body.email ? req.body.email.trim() : null;
        company.phone = req.body.phone ? req.body.phone.trim() : null;
        company.address = req.body.address ? req.body.address.trim() : null;
        if (req.body.is_active !== undefined) {
            company.is_active = req.body.is_active === 'on' || req.body.is_active === true;
        }
        company.updated_by = req.user?.username || 'admin';
        
        await company.update();
        
        logger.info(`Company updated: ${company.company_code} by ${company.updated_by}`);
        
        req.flash('success', 'Company updated successfully');
        res.redirect('/companies');
    } catch (error) {
        logger.error('Error updating company:', error);
        req.flash('error', error.message || 'An error occurred while updating the company');
        res.redirect(`/companies/${req.params.code}/edit`);
    }
});

// Handle toggle company status
const handleToggleStatus = asyncHandler(async (req, res) => {
    try {
        const company = await Company.findByCode(req.params.code);
        
        if (!company) {
            req.flash('error', 'Company not found');
            return res.redirect('/companies');
        }
        
        const newStatus = !company.is_active;
        await Company.updateStatus(req.params.code, newStatus, req.user?.username || 'admin');
        
        req.flash('success', `Company ${newStatus ? 'activated' : 'deactivated'} successfully`);
        res.redirect('/companies');
    } catch (error) {
        logger.error('Error toggling company status:', error);
        req.flash('error', error.message);
        res.redirect('/companies');
    }
});

// Handle delete company
const handleDeleteCompany = asyncHandler(async (req, res) => {
    try {
        const company = await Company.findByCode(req.params.code);
        
        if (!company) {
            req.flash('error', 'Company not found');
            return res.redirect('/companies');
        }
        
        // Delete the company
        await company.delete();
        
        logger.info(`Company deleted: ${req.params.code} by ${req.user?.username || 'system'}`);
        
        req.flash('success', 'Company deleted successfully');
        res.redirect('/companies');
    } catch (error) {
        logger.error('Error deleting company:', error);
        req.flash('error', error.message || 'Failed to delete company');
        res.redirect('/companies');
    }
});

module.exports = {
    // API controllers
    getAllCompanies,
    getCompanyByCode,
    createCompany,
    updateCompany,
    updateCompanyStatus,
    deleteCompany,
    getCompanyStatistics,
    
    // Web controllers
    showCompaniesPage,
    showCreateCompanyForm,
    showEditCompanyForm,
    handleCreateCompany,
    handleUpdateCompany,
    handleToggleStatus,
    handleDeleteCompany
};