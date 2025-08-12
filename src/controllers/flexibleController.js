// Path: /src/controllers/flexibleController.js
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class FlexibleController {
    
    // GET /api/flexible/company-departments
    // ดึงบริษัทพร้อมแผนกทั้งหมด (ข้ามสาขาและฝ่าย)
    static async getCompanyDepartments(req, res) {
        try {
            const { company } = req.query;
            
            if (!company) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_COMPANY',
                        message: 'Company code is required'
                    }
                });
            }

            // ดึงข้อมูลบริษัท
            const companyQuery = `
                SELECT company_code, company_name_th, company_name_en, tax_id, is_active
                FROM [dbo].[Companies]
                WHERE company_code = @company_code AND is_active = 1
            `;
            
            const companyResult = await executeQuery(companyQuery, { company_code: company });
            
            if (companyResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COMPANY_NOT_FOUND',
                        message: 'Company not found'
                    }
                });
            }

            // ดึงแผนกทั้งหมดของบริษัท (ผ่านฝ่าย)
            const departmentsQuery = `
                SELECT 
                    dp.department_code,
                    dp.department_name,
                    dv.division_code,
                    dv.division_name,
                    br.branch_code,
                    br.branch_name,
                    br.is_headquarters
                FROM [dbo].[Departments] dp
                INNER JOIN [dbo].[Divisions] dv ON dp.division_code = dv.division_code
                LEFT JOIN [dbo].[Branches] br ON dv.branch_code = br.branch_code
                WHERE dv.company_code = @company_code 
                    AND dp.is_active = 1 
                    AND dv.is_active = 1
                    AND (br.is_active = 1 OR br.branch_code IS NULL)
                ORDER BY br.is_headquarters DESC, br.branch_code, dv.division_code, dp.department_code
            `;
            
            const departmentsResult = await executeQuery(departmentsQuery, { company_code: company });

            res.json({
                success: true,
                data: {
                    company: companyResult.recordset[0],
                    departments: departmentsResult.recordset
                },
                meta: {
                    included: ['company', 'departments'],
                    total_departments: departmentsResult.recordset.length
                }
            });

        } catch (error) {
            logger.error('Error in getCompanyDepartments:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error'
                }
            });
        }
    }

    // GET /api/flexible/company-full
    // ดึงบริษัทพร้อมสาขา ฝ่าย แผนก ในครั้งเดียว
    static async getCompanyFull(req, res) {
        try {
            const { company } = req.query;
            
            if (!company) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_COMPANY',
                        message: 'Company code is required'
                    }
                });
            }

            // ดึงข้อมูลบริษัท
            const companyQuery = `
                SELECT company_code, company_name_th, company_name_en, tax_id, is_active,
                       created_date, created_by, updated_date, updated_by
                FROM [dbo].[Companies]
                WHERE company_code = @company_code AND is_active = 1
            `;
            
            const companyResult = await executeQuery(companyQuery, { company_code: company });
            
            if (companyResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COMPANY_NOT_FOUND',
                        message: 'Company not found'
                    }
                });
            }

            // ดึงสาขาทั้งหมด
            const branchesQuery = `
                SELECT branch_code, branch_name, company_code, is_headquarters, is_active,
                       created_date, created_by, updated_date, updated_by
                FROM [dbo].[Branches]
                WHERE company_code = @company_code AND is_active = 1
                ORDER BY is_headquarters DESC, branch_code
            `;
            
            const branchesResult = await executeQuery(branchesQuery, { company_code: company });

            // ดึงฝ่ายทั้งหมด
            const divisionsQuery = `
                SELECT division_code, division_name, company_code, branch_code, is_active,
                       created_date, created_by, updated_date, updated_by
                FROM [dbo].[Divisions]
                WHERE company_code = @company_code AND is_active = 1
                ORDER BY branch_code, division_code
            `;
            
            const divisionsResult = await executeQuery(divisionsQuery, { company_code: company });

            // ดึงแผนกทั้งหมด
            const departmentsQuery = `
                SELECT 
                    dp.department_code,
                    dp.department_name,
                    dp.division_code,
                    dp.is_active,
                    dp.created_date,
                    dp.created_by,
                    dp.updated_date,
                    dp.updated_by
                FROM [dbo].[Departments] dp
                INNER JOIN [dbo].[Divisions] dv ON dp.division_code = dv.division_code
                WHERE dv.company_code = @company_code 
                    AND dp.is_active = 1 
                    AND dv.is_active = 1
                ORDER BY dp.division_code, dp.department_code
            `;
            
            const departmentsResult = await executeQuery(departmentsQuery, { company_code: company });

            res.json({
                success: true,
                data: {
                    company: companyResult.recordset[0],
                    branches: branchesResult.recordset,
                    divisions: divisionsResult.recordset,
                    departments: departmentsResult.recordset
                },
                meta: {
                    included: ['company', 'branches', 'divisions', 'departments'],
                    total_branches: branchesResult.recordset.length,
                    total_divisions: divisionsResult.recordset.length,
                    total_departments: departmentsResult.recordset.length
                }
            });

        } catch (error) {
            logger.error('Error in getCompanyFull:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error'
                }
            });
        }
    }

    // GET /api/flexible/custom
    // ดึงข้อมูลแบบกำหนดเอง
    static async getCustom(req, res) {
        try {
            const { company, include, skip } = req.query;
            
            if (!company) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_COMPANY',
                        message: 'Company code is required'
                    }
                });
            }

            const includeList = include ? include.split(',').map(item => item.trim()) : [];
            const skipList = skip ? skip.split(',').map(item => item.trim()) : [];
            
            const result = { company: null };
            const meta = { included: ['company'] };

            // ดึงข้อมูลบริษัทเสมอ
            const companyQuery = `
                SELECT company_code, company_name_th, company_name_en, tax_id, is_active
                FROM [dbo].[Companies]
                WHERE company_code = @company_code AND is_active = 1
            `;
            
            const companyResult = await executeQuery(companyQuery, { company_code: company });
            
            if (companyResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COMPANY_NOT_FOUND',
                        message: 'Company not found'
                    }
                });
            }

            result.company = companyResult.recordset[0];

            // ดึงสาขา (ถ้าไม่ skip และอยู่ใน include หรือไม่ระบุ include)
            if (!skipList.includes('branches') && (includeList.length === 0 || includeList.includes('branches'))) {
                const branchesQuery = `
                    SELECT branch_code, branch_name, company_code, is_headquarters, is_active
                    FROM [dbo].[Branches]
                    WHERE company_code = @company_code AND is_active = 1
                    ORDER BY is_headquarters DESC, branch_code
                `;
                
                const branchesResult = await executeQuery(branchesQuery, { company_code: company });
                result.branches = branchesResult.recordset;
                meta.included.push('branches');
                meta.total_branches = branchesResult.recordset.length;
            }

            // ดึงฝ่าย (ถ้าไม่ skip และอยู่ใน include หรือไม่ระบุ include)
            if (!skipList.includes('divisions') && (includeList.length === 0 || includeList.includes('divisions'))) {
                const divisionsQuery = `
                    SELECT division_code, division_name, company_code, branch_code, is_active
                    FROM [dbo].[Divisions]
                    WHERE company_code = @company_code AND is_active = 1
                    ORDER BY branch_code, division_code
                `;
                
                const divisionsResult = await executeQuery(divisionsQuery, { company_code: company });
                result.divisions = divisionsResult.recordset;
                meta.included.push('divisions');
                meta.total_divisions = divisionsResult.recordset.length;
            }

            // ดึงแผนก (ถ้าไม่ skip และอยู่ใน include หรือไม่ระบุ include)
            if (!skipList.includes('departments') && (includeList.length === 0 || includeList.includes('departments'))) {
                const departmentsQuery = `
                    SELECT 
                        dp.department_code,
                        dp.department_name,
                        dp.division_code,
                        dp.is_active
                    FROM [dbo].[Departments] dp
                    INNER JOIN [dbo].[Divisions] dv ON dp.division_code = dv.division_code
                    WHERE dv.company_code = @company_code 
                        AND dp.is_active = 1 
                        AND dv.is_active = 1
                    ORDER BY dp.division_code, dp.department_code
                `;
                
                const departmentsResult = await executeQuery(departmentsQuery, { company_code: company });
                result.departments = departmentsResult.recordset;
                meta.included.push('departments');
                meta.total_departments = departmentsResult.recordset.length;
            }

            res.json({
                success: true,
                data: result,
                meta: meta
            });

        } catch (error) {
            logger.error('Error in getCustom:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error'
                }
            });
        }
    }
}

module.exports = FlexibleController;