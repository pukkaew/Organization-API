// Path: /src/controllers/organizationController.js
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class OrganizationController {
    
    // GET /api/organization-tree
    // ดึงโครงสร้างองค์กรทั้งหมด
    static async getOrganizationTree(req, res) {
        try {
            const { active_only = 'true' } = req.query;
            const isActiveOnly = active_only === 'true';

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
                FROM [dbo].[Companies] c
                LEFT JOIN [dbo].[Branches] b ON c.company_code = b.company_code
                LEFT JOIN [dbo].[Divisions] d ON c.company_code = d.company_code 
                    AND (b.branch_code IS NULL OR b.branch_code = d.branch_code)
                LEFT JOIN [dbo].[Departments] dp ON d.division_code = dp.division_code
                WHERE ${isActiveOnly ? 'c.is_active = 1' : '1=1'}
                ORDER BY c.company_code, b.is_headquarters DESC, b.branch_code, d.division_code, dp.department_code
            `;

            const result = await executeQuery(query);
            
            // จัดกลุ่มข้อมูลเป็น tree structure
            const organizationTree = this.buildOrganizationTree(result.recordset, isActiveOnly);

            res.json({
                success: true,
                data: organizationTree,
                meta: {
                    total_companies: organizationTree.length,
                    active_only: isActiveOnly
                }
            });

        } catch (error) {
            logger.error('Error in getOrganizationTree:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error'
                }
            });
        }
    }

    // GET /api/organization-tree/{company_code}
    // ดึงโครงสร้างองค์กรของบริษัทที่ระบุ
    static async getCompanyOrganizationTree(req, res) {
        try {
            const { company_code } = req.params;
            const { active_only = 'true' } = req.query;
            const isActiveOnly = active_only === 'true';

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
                FROM [dbo].[Companies] c
                LEFT JOIN [dbo].[Branches] b ON c.company_code = b.company_code
                LEFT JOIN [dbo].[Divisions] d ON c.company_code = d.company_code 
                    AND (b.branch_code IS NULL OR b.branch_code = d.branch_code)
                LEFT JOIN [dbo].[Departments] dp ON d.division_code = dp.division_code
                WHERE c.company_code = @company_code
                    ${isActiveOnly ? 'AND c.is_active = 1' : ''}
                ORDER BY b.is_headquarters DESC, b.branch_code, d.division_code, dp.department_code
            `;

            const result = await executeQuery(query, { company_code });
            
            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COMPANY_NOT_FOUND',
                        message: 'Company not found'
                    }
                });
            }

            // จัดกลุ่มข้อมูลเป็น tree structure
            const organizationTree = this.buildOrganizationTree(result.recordset, isActiveOnly);

            res.json({
                success: true,
                data: organizationTree[0] || null,
                meta: {
                    company_code,
                    active_only: isActiveOnly
                }
            });

        } catch (error) {
            logger.error('Error in getCompanyOrganizationTree:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error'
                }
            });
        }
    }

    // Helper method to build organization tree structure
    static buildOrganizationTree(records, activeOnly = true) {
        const companies = new Map();

        records.forEach(record => {
            const companyCode = record.company_code;
            
            // Skip inactive records if activeOnly is true
            if (activeOnly && !record.company_active) return;

            // Initialize company if not exists
            if (!companies.has(companyCode)) {
                companies.set(companyCode, {
                    company_code: record.company_code,
                    company_name_th: record.company_name_th,
                    company_name_en: record.company_name_en,
                    tax_id: record.tax_id,
                    is_active: record.company_active,
                    branches: new Map(),
                    divisions_without_branch: []
                });
            }

            const company = companies.get(companyCode);

            // Handle branches
            if (record.branch_code) {
                if (activeOnly && !record.branch_active) return;

                if (!company.branches.has(record.branch_code)) {
                    company.branches.set(record.branch_code, {
                        branch_code: record.branch_code,
                        branch_name: record.branch_name,
                        is_headquarters: record.is_headquarters,
                        is_active: record.branch_active,
                        divisions: []
                    });
                }

                const branch = company.branches.get(record.branch_code);

                // Handle divisions under branch
                if (record.division_code) {
                    if (activeOnly && !record.division_active) return;

                    let division = branch.divisions.find(d => d.division_code === record.division_code);
                    if (!division) {
                        division = {
                            division_code: record.division_code,
                            division_name: record.division_name,
                            is_active: record.division_active,
                            departments: []
                        };
                        branch.divisions.push(division);
                    }

                    // Handle departments
                    if (record.department_code) {
                        if (activeOnly && !record.department_active) return;

                        const department = {
                            department_code: record.department_code,
                            department_name: record.department_name,
                            is_active: record.department_active
                        };
                        division.departments.push(department);
                    }
                }
            } else {
                // Handle divisions without branch (direct under company)
                if (record.division_code) {
                    if (activeOnly && !record.division_active) return;

                    let division = company.divisions_without_branch.find(d => d.division_code === record.division_code);
                    if (!division) {
                        division = {
                            division_code: record.division_code,
                            division_name: record.division_name,
                            is_active: record.division_active,
                            departments: []
                        };
                        company.divisions_without_branch.push(division);
                    }

                    // Handle departments
                    if (record.department_code) {
                        if (activeOnly && !record.department_active) return;

                        const department = {
                            department_code: record.department_code,
                            department_name: record.department_name,
                            is_active: record.department_active
                        };
                        division.departments.push(department);
                    }
                }
            }
        });

        // Convert Maps to Arrays and clean up structure
        return Array.from(companies.values()).map(company => ({
            company_code: company.company_code,
            company_name_th: company.company_name_th,
            company_name_en: company.company_name_en,
            tax_id: company.tax_id,
            is_active: company.is_active,
            branches: Array.from(company.branches.values()),
            divisions: company.divisions_without_branch
        }));
    }
}

module.exports = OrganizationController;