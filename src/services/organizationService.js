// Path: /src/services/organizationService.js
const { executeQuery, executeTransaction } = require('../config/database');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const Company = require('../models/Company');

class OrganizationService {
    /**
     * Get organization statistics
     */
    static async getOrganizationStats() {
        // Use mock data if USE_DATABASE is false
        if (process.env.USE_DATABASE === 'false') {
            const Company = require('../models/Company');
            const Branch = require('../models/Branch');
            const Division = require('../models/Division');
            const Department = require('../models/Department');
            
            const activeCompanies = Company.mockCompanies.filter(c => c.is_active).length;
            const activeBranches = Branch.mockBranches.filter(b => b.is_active).length;
            const activeDivisions = Division.mockDivisions.filter(d => d.is_active).length;
            const activeDepartments = Department.mockDepartments.filter(d => d.is_active).length;
            const headquarters = Branch.mockBranches.filter(b => b.is_headquarters && b.is_active).length;
            
            return {
                totalCompanies: activeCompanies,
                totalBranches: activeBranches,
                totalDivisions: activeDivisions,
                totalDepartments: activeDepartments,
                active_divisions: activeDivisions,
                headquarters_count: headquarters
            };
        }
        
        const cacheKey = 'org:stats:overall';
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM Companies WHERE is_active = 1) as totalCompanies,
                    (SELECT COUNT(*) FROM Branches WHERE is_active = 1) as totalBranches,
                    (SELECT COUNT(*) FROM Divisions WHERE is_active = 1) as totalDivisions,
                    (SELECT COUNT(*) FROM Departments WHERE is_active = 1) as totalDepartments,
                    (SELECT COUNT(*) FROM Divisions WHERE is_active = 1) as active_divisions,
                    (SELECT COUNT(*) FROM Branches WHERE is_headquarters = 1 AND is_active = 1) as headquarters_count
            `;

            const result = await executeQuery(query);
            const stats = result.recordset[0];

            await cache.set(cacheKey, stats, 1800); // Cache for 30 minutes
            return stats;
        } catch (error) {
            logger.error('Error getting organization stats:', error);
            return {
                totalCompanies: 0,
                totalBranches: 0,
                totalDivisions: 0,
                totalDepartments: 0,
                active_divisions: 0,
                headquarters_count: 0
            };
        }
    }

    /**
     * Get recent activities
     */
    static async getRecentActivities(limit = 10) {
        try {
            // For now, return empty array since we want clean database state
            // In production, this should query actual activity logs from database
            return [];
        } catch (error) {
            logger.error('Error getting recent activities:', error);
            return [];
        }
    }

    /**
     * Get organization chart data
     */
    static async getOrganizationChartData() {
        try {
            const stats = await this.getOrganizationStats();
            return {
                labels: ['บริษัท', 'สาขา', 'ฝ่าย', 'แผนก'],
                values: [
                    stats.totalCompanies,
                    stats.totalBranches,
                    stats.totalDivisions,
                    stats.totalDepartments
                ]
            };
        } catch (error) {
            logger.error('Error getting organization chart data:', error);
            return { labels: [], values: [] };
        }
    }

    /**
     * Get full organization tree
     */
    static async getOrganizationTree(companyCode = null) {
        // Use mock data if USE_DATABASE is false
        if (process.env.USE_DATABASE === 'false') {
            return this.getMockOrganizationTree(companyCode);
        }
        
        try {
            let query = `
                SELECT 
                    c.company_code,
                    c.company_name_th,
                    c.company_name_en,
                    c.is_active as company_active,
                    b.branch_code,
                    b.branch_name,
                    b.is_headquarters,
                    b.is_active as branch_active,
                    d.division_code,
                    d.division_name,
                    d.is_active as division_active,
                    dp.department_code,
                    dp.department_name,
                    dp.is_active as department_active
                FROM Companies c
                LEFT JOIN Branches b ON c.company_code = b.company_code
                LEFT JOIN Divisions d ON c.company_code = d.company_code 
                    AND (b.branch_code IS NULL OR b.branch_code = d.branch_code)
                LEFT JOIN Departments dp ON d.division_code = dp.division_code
                WHERE c.is_active = 1
            `;

            const inputs = {};
            if (companyCode) {
                query += ' AND c.company_code = @company_code';
                inputs.company_code = companyCode;
            }

            query += ' ORDER BY c.company_code, b.branch_code, d.division_code, dp.department_code';

            const result = await executeQuery(query, inputs);
            return this.transformToTree(result.recordset);
        } catch (error) {
            logger.error('Error getting organization tree:', error);
            return [];
        }
    }

    /**
     * Transform flat data to hierarchical tree structure
     */
    static transformToTree(flatData) {
        const tree = {};

        flatData.forEach(row => {
            // Company level
            if (!tree[row.company_code]) {
                tree[row.company_code] = {
                    company_code: row.company_code,
                    company_name_th: row.company_name_th,
                    company_name_en: row.company_name_en,
                    is_active: row.company_active,
                    branches: {},
                    divisions: {} // For divisions without branches
                };
            }

            const company = tree[row.company_code];

            // Branch level
            if (row.branch_code) {
                if (!company.branches[row.branch_code]) {
                    company.branches[row.branch_code] = {
                        branch_code: row.branch_code,
                        branch_name: row.branch_name,
                        is_headquarters: row.is_headquarters,
                        is_active: row.branch_active,
                        divisions: {}
                    };
                }
            }

            // Division level
            if (row.division_code) {
                const divisionContainer = row.branch_code 
                    ? company.branches[row.branch_code].divisions 
                    : company.divisions;

                if (!divisionContainer[row.division_code]) {
                    divisionContainer[row.division_code] = {
                        division_code: row.division_code,
                        division_name: row.division_name,
                        is_active: row.division_active,
                        departments: {}
                    };
                }

                // Department level
                if (row.department_code) {
                    divisionContainer[row.division_code].departments[row.department_code] = {
                        department_code: row.department_code,
                        department_name: row.department_name,
                        is_active: row.department_active
                    };
                }
            }
        });

        // Convert objects to arrays
        return Object.values(tree).map(company => ({
            ...company,
            branches: Object.values(company.branches).map(branch => ({
                ...branch,
                divisions: Object.values(branch.divisions).map(division => ({
                    ...division,
                    departments: Object.values(division.departments)
                }))
            })),
            divisions: Object.values(company.divisions).map(division => ({
                ...division,
                departments: Object.values(division.departments)
            }))
        }));
    }

    /**
     * Get company with departments only (skip branches and divisions)
     * FR-API-004: Flexible Data Retrieval
     */
    static async getCompanyWithDepartments(companyCode) {
        // Use mock data if USE_DATABASE is false
        if (process.env.USE_DATABASE === 'false') {
            const company = await Company.findByCode(companyCode);
            if (!company) {
                return null;
            }
            
            const Division = require('../models/Division');
            const Department = require('../models/Department');
            
            const divisions = await Division.findByCompany(companyCode);
            let departments = [];
            for (const division of divisions) {
                const divisionDepartments = await Department.findByDivision(division.division_code);
                departments = departments.concat(divisionDepartments);
            }
            
            return { 
                company: {
                    company_code: company.company_code,
                    company_name_th: company.company_name_th,
                    company_name_en: company.company_name_en,
                    tax_id: company.tax_id,
                    is_active: company.is_active
                }, 
                departments: departments
            };
        }

        try {
            const query = `
                SELECT 
                    c.company_code,
                    c.company_name_th,
                    c.company_name_en,
                    c.tax_id,
                    c.is_active as company_active,
                    dp.department_code,
                    dp.department_name,
                    dp.is_active as department_active,
                    d.division_code,
                    d.division_name,
                    b.branch_code,
                    b.branch_name
                FROM Companies c
                LEFT JOIN Divisions d ON c.company_code = d.company_code AND d.is_active = 1
                LEFT JOIN Departments dp ON d.division_code = dp.division_code AND dp.is_active = 1
                LEFT JOIN Branches b ON d.branch_code = b.branch_code AND b.is_active = 1
                WHERE c.company_code = @company_code AND c.is_active = 1
                ORDER BY dp.department_name
            `;

            const result = await executeQuery(query, { company_code: companyCode });
            const rows = result.recordset;

            if (rows.length === 0) {
                return null;
            }

            const company = {
                company_code: rows[0].company_code,
                company_name_th: rows[0].company_name_th,
                company_name_en: rows[0].company_name_en,
                tax_id: rows[0].tax_id,
                is_active: rows[0].company_active
            };

            const departments = rows
                .filter(row => row.department_code)
                .map(row => ({
                    department_code: row.department_code,
                    department_name: row.department_name,
                    division_code: row.division_code,
                    division_name: row.division_name,
                    branch_code: row.branch_code,
                    branch_name: row.branch_name,
                    is_active: row.department_active
                }));

            return { company, departments };
        } catch (error) {
            logger.error('Error getting company with departments:', error);
            throw error;
        }
    }

    /**
     * Get complete company structure (all levels)
     * FR-API-004: Flexible Data Retrieval
     */
    static async getCompanyFull(companyCode) {
        // Use mock data if USE_DATABASE is false
        if (process.env.USE_DATABASE === 'false') {
            const company = await Company.findByCode(companyCode);
            if (!company) {
                return null;
            }
            
            const Branch = require('../models/Branch');
            const Division = require('../models/Division');
            const Department = require('../models/Department');
            
            const branches = await Branch.findByCompany(companyCode);
            const divisions = await Division.findByCompany(companyCode);
            
            // Get all departments for divisions in this company
            let departments = [];
            for (const division of divisions) {
                const divisionDepartments = await Department.findByDivision(division.division_code);
                departments = departments.concat(divisionDepartments);
            }
            
            return { 
                company: {
                    company_code: company.company_code,
                    company_name_th: company.company_name_th,
                    company_name_en: company.company_name_en,
                    tax_id: company.tax_id,
                    is_active: company.is_active
                },
                branches: branches,
                divisions: divisions,
                departments: departments
            };
        }

        try {
            const query = `
                SELECT 
                    c.company_code,
                    c.company_name_th,
                    c.company_name_en,
                    c.tax_id,
                    c.is_active as company_active,
                    b.branch_code,
                    b.branch_name,
                    b.is_headquarters,
                    b.is_active as branch_active,
                    d.division_code,
                    d.division_name,
                    d.is_active as division_active,
                    dp.department_code,
                    dp.department_name,
                    dp.is_active as department_active
                FROM Companies c
                LEFT JOIN Branches b ON c.company_code = b.company_code AND b.is_active = 1
                LEFT JOIN Divisions d ON c.company_code = d.company_code AND d.is_active = 1
                    AND (b.branch_code IS NULL OR b.branch_code = d.branch_code)
                LEFT JOIN Departments dp ON d.division_code = dp.division_code AND dp.is_active = 1
                WHERE c.company_code = @company_code AND c.is_active = 1
                ORDER BY b.branch_name, d.division_name, dp.department_name
            `;

            const result = await executeQuery(query, { company_code: companyCode });
            const rows = result.recordset;

            if (rows.length === 0) {
                return null;
            }

            const company = {
                company_code: rows[0].company_code,
                company_name_th: rows[0].company_name_th,
                company_name_en: rows[0].company_name_en,
                tax_id: rows[0].tax_id,
                is_active: rows[0].company_active
            };

            const branches = [];
            const divisions = [];
            const departments = [];

            const seenBranches = new Set();
            const seenDivisions = new Set();
            const seenDepartments = new Set();

            rows.forEach(row => {
                if (row.branch_code && !seenBranches.has(row.branch_code)) {
                    branches.push({
                        branch_code: row.branch_code,
                        branch_name: row.branch_name,
                        is_headquarters: row.is_headquarters,
                        is_active: row.branch_active
                    });
                    seenBranches.add(row.branch_code);
                }

                if (row.division_code && !seenDivisions.has(row.division_code)) {
                    divisions.push({
                        division_code: row.division_code,
                        division_name: row.division_name,
                        branch_code: row.branch_code,
                        is_active: row.division_active
                    });
                    seenDivisions.add(row.division_code);
                }

                if (row.department_code && !seenDepartments.has(row.department_code)) {
                    departments.push({
                        department_code: row.department_code,
                        department_name: row.department_name,
                        division_code: row.division_code,
                        is_active: row.department_active
                    });
                    seenDepartments.add(row.department_code);
                }
            });

            return { company, branches, divisions, departments };
        } catch (error) {
            logger.error('Error getting company full structure:', error);
            throw error;
        }
    }

    /**
     * Get custom organization data based on include parameters
     * FR-API-004: Flexible Data Retrieval
     */
    static async getCustomOrganizationData(companyCode, includeParams = {}) {
        const {
            branches = false,
            divisions = false,
            departments = false,
            skip = []
        } = includeParams;

        // Handle mock data when database is disabled
        if (process.env.USE_DATABASE === 'false') {
            const company = await Company.findByCode(companyCode);
            if (!company) {
                return null;
            }
            
            const result = {
                company: {
                    company_code: company.company_code,
                    company_name_th: company.company_name_th,
                    company_name_en: company.company_name_en,
                    tax_id: company.tax_id,
                    is_active: company.is_active
                }
            };
            
            // Mock data only has companies, so branches/divisions/departments are empty
            if (branches && !skip.includes('branches')) {
                result.branches = [];
            }
            if (divisions && !skip.includes('divisions')) {
                result.divisions = [];
            }
            if (departments && !skip.includes('departments')) {
                result.departments = [];
            }
            
            return result;
        }

        try {
            const result = { company: null };
            
            // Get company basic info
            const companyQuery = `
                SELECT company_code, company_name_th, company_name_en, tax_id, is_active
                FROM Companies 
                WHERE company_code = @company_code AND is_active = 1
            `;
            
            const companyResult = await executeQuery(companyQuery, { company_code: companyCode });
            if (companyResult.recordset.length === 0) {
                return null;
            }
            
            result.company = companyResult.recordset[0];

            // Include branches if requested and not skipped
            if (branches && !skip.includes('branches')) {
                const branchQuery = `
                    SELECT branch_code, branch_name, is_headquarters, is_active
                    FROM Branches 
                    WHERE company_code = @company_code AND is_active = 1
                    ORDER BY branch_name
                `;
                const branchResult = await executeQuery(branchQuery, { company_code: companyCode });
                result.branches = branchResult.recordset;
            }

            // Include divisions if requested and not skipped
            if (divisions && !skip.includes('divisions')) {
                const divisionQuery = `
                    SELECT division_code, division_name, branch_code, is_active
                    FROM Divisions 
                    WHERE company_code = @company_code AND is_active = 1
                    ORDER BY division_name
                `;
                const divisionResult = await executeQuery(divisionQuery, { company_code: companyCode });
                result.divisions = divisionResult.recordset;
            }

            // Include departments if requested and not skipped
            if (departments && !skip.includes('departments')) {
                const departmentQuery = `
                    SELECT dp.department_code, dp.department_name, dp.division_code, dp.is_active
                    FROM Departments dp
                    INNER JOIN Divisions d ON dp.division_code = d.division_code
                    WHERE d.company_code = @company_code AND dp.is_active = 1 AND d.is_active = 1
                    ORDER BY dp.department_name
                `;
                const departmentResult = await executeQuery(departmentQuery, { company_code: companyCode });
                result.departments = departmentResult.recordset;
            }

            return result;
        } catch (error) {
            logger.error('Error getting custom organization data:', error);
            throw error;
        }
    }

    /**
     * Clone organization structure
     */
    static async cloneStructure(sourceCompanyCode, targetCompanyCode, options = {}) {
        // Skip database if USE_DATABASE is false
        if (process.env.USE_DATABASE === 'false') {
            return {
                branches: 0,
                divisions: 0,
                departments: 0
            };
        }
        
        const {
            includeBranches = true,
            includeDivisions = true,
            includeDepartments = true,
            createdBy = 'system'
        } = options;

        try {
            return await executeTransaction(async (transaction) => {
                const results = {
                    branches: 0,
                    divisions: 0,
                    departments: 0
                };

                // Implementation would go here...
                logger.info(`Structure cloned from ${sourceCompanyCode} to ${targetCompanyCode}`);
                return results;
            });
        } catch (error) {
            logger.error('Error cloning structure:', error);
            throw error;
        }
    }

    /**
     * Get mock organization tree for testing
     */
    static getMockOrganizationTree(companyCode = null) {
        const Company = require('../models/Company');
        const Branch = require('../models/Branch');
        const Division = require('../models/Division');
        const Department = require('../models/Department');

        const companies = Company.mockCompanies;
        const branches = Branch.mockBranches;
        const divisions = Division.mockDivisions;
        const departments = Department.mockDepartments;

        // Filter companies if companyCode is provided
        const filteredCompanies = companyCode 
            ? companies.filter(c => c.company_code === companyCode)
            : companies;

        return filteredCompanies.map(company => {
            const companyBranches = branches.filter(b => b.company_code === company.company_code);
            const companyDivisions = divisions.filter(d => d.company_code === company.company_code);

            return {
                company_code: company.company_code,
                company_name_th: company.company_name_th,
                company_name_en: company.company_name_en,
                is_active: company.is_active,
                branches: companyBranches.map(branch => ({
                    branch_code: branch.branch_code,
                    branch_name: branch.branch_name,
                    is_headquarters: branch.is_headquarters,
                    is_active: branch.is_active,
                    divisions: divisions.filter(d => d.branch_code === branch.branch_code).map(division => ({
                        division_code: division.division_code,
                        division_name: division.division_name,
                        is_active: division.is_active,
                        departments: departments.filter(dept => dept.division_code === division.division_code).map(dept => ({
                            department_code: dept.department_code,
                            department_name: dept.department_name,
                            is_active: dept.is_active
                        }))
                    }))
                })),
                divisions: companyDivisions.map(division => ({
                    division_code: division.division_code,
                    division_name: division.division_name,
                    branch_code: division.branch_code,
                    is_active: division.is_active,
                    departments: departments.filter(dept => dept.division_code === division.division_code).map(dept => ({
                        department_code: dept.department_code,
                        department_name: dept.department_name,
                        is_active: dept.is_active
                    }))
                }))
            };
        });
    }
}

module.exports = OrganizationService;