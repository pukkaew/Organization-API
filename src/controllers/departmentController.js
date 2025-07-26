const Department = require('../models/Department');
const Division = require('../models/Division');
const Company = require('../models/Company');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendPaginated, created, updated, deleted, notFound } = require('../utils/response');
const { getPaginationParams } = require('../utils/pagination');
const logger = require('../utils/logger');

// Display departments list page
const showDepartmentsPage = asyncHandler(async (req, res) => {
    try {
        const { page, limit } = getPaginationParams(req);
        const filters = {
            division_code: req.query.division_code,
            company_code: req.query.company_code,
            branch_code: req.query.branch_code,
            is_active: req.query.is_active,
            search: req.query.search
        };

        logger.info('Fetching departments with filters:', filters);
        
        const [result, companies, divisions] = await Promise.all([
            Department.findPaginated(page, limit, filters),
            Company.findAll({ is_active: true }),
            Division.findAll({ is_active: true })
        ]);
        
        logger.info('Departments fetch result:', { dataCount: result.data.length, companiesCount: companies.length, divisionsCount: divisions.length });
        
        res.render('departments/index', {
            title: 'Departments',
            departments: result.data,
            pagination: result.pagination,
            companies: companies,
            divisions: divisions,
            filters: filters,
            query: req.query,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        logger.error('Error in showDepartmentsPage:', error);
        req.flash('error', 'An error occurred while loading departments: ' + error.message);
        res.redirect('/');
    }
});

// Display create department form
const showCreateDepartmentForm = asyncHandler(async (req, res) => {
    try {
        logger.info('Fetching divisions and companies for department create form');
        const [divisions, companies] = await Promise.all([
            Division.findAll({ is_active: true }),
            Company.findAll({ is_active: true })
        ]);
        logger.info('Data fetched for department create form:', { divisionsCount: divisions.length, companiesCount: companies.length });
        
        res.render('departments/create', {
            title: 'Create Department',
            divisions: divisions,
            companies: companies,
            selectedDivision: req.query.division_code,
            csrfToken: req.csrfToken ? req.csrfToken() : '',
            error: req.flash('error')
        });
    } catch (error) {
        logger.error('Error in showCreateDepartmentForm:', error);
        req.flash('error', 'An error occurred while loading the create form: ' + error.message);
        res.redirect('/departments');
    }
});

// Display edit department form
const showEditDepartmentForm = asyncHandler(async (req, res) => {
    try {
        logger.info('Fetching department for edit form:', { code: req.params.code });
        const department = await Department.findByCode(req.params.code);
        
        if (!department) {
            logger.warn('Department not found for edit:', { code: req.params.code });
            req.flash('error', 'Department not found');
            return res.redirect('/departments');
        }
        
        const [divisions, companies] = await Promise.all([
            Division.findAll({ is_active: true }),
            Company.findAll({ is_active: true })
        ]);
        
        logger.info('Department and related data loaded for edit form:', { 
            departmentCode: department.department_code, 
            divisionsCount: divisions.length,
            companiesCount: companies.length
        });
        
        // Ensure all department fields have default values to prevent template errors
        const safeDepartment = {
            department_code: department.department_code || '',
            department_name: department.department_name || '',
            division_code: department.division_code || '',
            division_name: department.division_name || '',
            company_code: department.company_code || '',
            branch_code: department.branch_code || null,
            company_name_th: department.company_name_th || '',
            company_name_en: department.company_name_en || '',
            branch_name: department.branch_name || null,
            is_active: department.is_active !== undefined ? department.is_active : true,
            created_date: department.created_date || new Date(),
            created_by: department.created_by || 'system',
            updated_date: department.updated_date || null,
            updated_by: department.updated_by || null
        };
        
        res.render('departments/edit', {
            title: 'Edit Department',
            department: safeDepartment,
            divisions: divisions || [],
            companies: companies || [],
            error: req.flash('error')
        });
    } catch (error) {
        logger.error('Error in showEditDepartmentForm:', error);
        req.flash('error', 'An error occurred while loading the edit form: ' + error.message);
        res.redirect('/departments');
    }
});

// Handle create department form submission
const handleCreateDepartment = asyncHandler(async (req, res) => {
    try {
        const departmentData = {
            department_code: req.body.department_code,
            department_name: req.body.department_name,
            division_code: req.body.division_code,
            is_active: req.body.is_active === 'true' || req.body.is_active === 'on',
            created_by: req.user?.username || 'admin'
        };

        const department = new Department(departmentData);
        await department.create();
        
        logger.info(`Department created: ${department.department_code} by ${departmentData.created_by}`);
        
        req.flash('success', 'Department created successfully');
        res.redirect('/departments');
    } catch (error) {
        logger.error('Error creating department:', error);
        req.flash('error', error.message || 'Failed to create department');
        res.redirect('/departments/new');
    }
});

// Handle update department form submission
const handleUpdateDepartment = asyncHandler(async (req, res) => {
    try {
        const department = await Department.findByCode(req.params.code);
        
        if (!department) {
            req.flash('error', 'Department not found');
            return res.redirect('/departments');
        }
        
        // Validate required fields
        if (!req.body.department_name || req.body.department_name.trim() === '') {
            req.flash('error', 'Department name is required');
            return res.redirect(`/departments/${req.params.code}/edit`);
        }
        
        // Update fields
        department.department_name = req.body.department_name.trim();
        if (req.body.division_code !== undefined) {
            department.division_code = req.body.division_code;
        }
        if (req.body.is_active !== undefined) {
            department.is_active = req.body.is_active === 'on' || req.body.is_active === true;
        }
        department.updated_by = req.user?.username || 'admin';
        
        await department.update();
        
        logger.info(`Department updated: ${department.department_code} by ${department.updated_by}`);
        
        req.flash('success', 'Department updated successfully');
        res.redirect('/departments');
    } catch (error) {
        logger.error('Error updating department:', error);
        req.flash('error', error.message || 'An error occurred while updating the department');
        res.redirect(`/departments/${req.params.code}/edit`);
    }
});

// Handle toggle department status
const handleToggleStatus = asyncHandler(async (req, res) => {
    try {
        const department = await Department.findByCode(req.params.code);
        
        if (!department) {
            req.flash('error', 'Department not found');
            return res.redirect('/departments');
        }
        
        const newStatus = !department.is_active;
        await Department.updateStatus(req.params.code, newStatus, req.user?.username || 'admin');
        
        logger.info(`Department status updated: ${req.params.code} to ${newStatus ? 'active' : 'inactive'}`);
        
        req.flash('success', `Department ${newStatus ? 'activated' : 'deactivated'} successfully`);
        res.redirect('/departments');
    } catch (error) {
        logger.error('Error toggling department status:', error);
        req.flash('error', error.message);
        res.redirect('/departments');
    }
});

// Handle move department to another division
const handleMoveDepartment = asyncHandler(async (req, res) => {
    try {
        const result = await Department.moveToDivision(
            req.params.code,
            req.body.division_code,
            req.user?.username || 'admin'
        );
        
        logger.info(`Department ${req.params.code} moved to division ${req.body.division_code}`);
        
        req.flash('success', 'Department moved successfully');
        res.redirect('/departments');
    } catch (error) {
        logger.error('Error moving department:', error);
        req.flash('error', error.message);
        res.redirect('/departments');
    }
});

// AJAX endpoint to get divisions by company
const getDivisionsByCompany = asyncHandler(async (req, res) => {
    const companyCode = req.params.companyCode;
    const divisions = await Division.findByCompany(companyCode);
    
    res.json({
        success: true,
        data: divisions
    });
});

// API Controllers

// Get all departments with pagination
const getAllDepartments = asyncHandler(async (req, res) => {
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
});

// Get department by code
const getDepartmentByCode = asyncHandler(async (req, res) => {
    const department = await Department.findByCode(req.params.code);
    if (!department) {
        return notFound(res, 'Department not found');
    }
    sendSuccess(res, department, 'Department retrieved successfully');
});

// Create new department
const createDepartment = asyncHandler(async (req, res) => {
    const departmentData = {
        department_code: req.body.department_code,
        department_name: req.body.department_name,
        division_code: req.body.division_code,
        is_active: req.body.is_active !== undefined ? req.body.is_active : true,
        created_by: req.apiAuth?.appName || req.user?.username || 'system'
    };

    const department = new Department(departmentData);
    const result = await department.create();
    
    logger.info(`Department created: ${result.department_code} by ${departmentData.created_by}`);
    created(res, result, 'Department created successfully');
});

// Update department
const updateDepartment = asyncHandler(async (req, res) => {
    const department = await Department.findByCode(req.params.code);
    if (!department) {
        return notFound(res, 'Department not found');
    }

    // Validate and update fields
    if (req.body.department_name !== undefined) {
        if (!req.body.department_name || req.body.department_name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Department name is required'
            });
        }
        department.department_name = req.body.department_name.trim();
    }
    if (req.body.division_code !== undefined) {
        department.division_code = req.body.division_code;
    }
    if (req.body.is_active !== undefined) {
        department.is_active = req.body.is_active;
    }
    
    department.updated_by = req.apiAuth?.appName || req.user?.username || 'system';
    const result = await department.update();
    
    logger.info(`Department updated: ${result.department_code} by ${department.updated_by}`);
    updated(res, result, 'Department updated successfully');
});

// Delete department
const deleteDepartment = asyncHandler(async (req, res) => {
    const department = await Department.findByCode(req.params.code);
    if (!department) {
        return notFound(res, 'Department not found');
    }
    
    const result = await department.delete();
    
    logger.info(`Department deleted: ${req.params.code} by ${req.apiAuth?.appName || req.user?.username || 'system'}`);
    deleted(res, result, 'Department deleted successfully');
});

// Handle delete department (web)
const handleDeleteDepartment = asyncHandler(async (req, res) => {
    try {
        const department = await Department.findByCode(req.params.code);
        
        if (!department) {
            req.flash('error', 'Department not found');
            return res.redirect('/departments');
        }
        
        // Delete the department
        await department.delete();
        
        logger.info(`Department deleted: ${req.params.code} by ${req.user?.username || 'system'}`);
        
        req.flash('success', 'Department deleted successfully');
        res.redirect('/departments');
    } catch (error) {
        logger.error('Error deleting department:', error);
        req.flash('error', error.message || 'Failed to delete department');
        res.redirect('/departments');
    }
});

module.exports = {
    // Web controllers
    showDepartmentsPage,
    showCreateDepartmentForm,
    showEditDepartmentForm,
    handleCreateDepartment,
    handleUpdateDepartment,
    handleToggleStatus,
    handleDeleteDepartment,
    handleMoveDepartment,
    getDivisionsByCompany,
    
    // API controllers
    getAllDepartments,
    getDepartmentByCode,
    createDepartment,
    updateDepartment,
    deleteDepartment
};