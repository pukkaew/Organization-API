// Path: /src/controllers/searchController.js
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class SearchController {
    
    // GET /api/search
    // ค้นหาข้ามทุกระดับ (Companies, Branches, Divisions, Departments)
    static async globalSearch(req, res) {
        try {
            const { 
                q, 
                type, 
                limit = 20, 
                page = 1,
                active_only = 'true' 
            } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_SEARCH_QUERY',
                        message: 'Search query must be at least 2 characters'
                    }
                });
            }

            const searchTerm = `%${q.trim()}%`;
            const isActiveOnly = active_only === 'true';
            const limitNum = Math.min(parseInt(limit) || 20, 100);
            const pageNum = Math.max(parseInt(page) || 1, 1);
            const offset = (pageNum - 1) * limitNum;

            const results = [];

            // Search Companies
            if (!type || type === 'companies') {
                const companiesQuery = `
                    SELECT TOP ${limitNum}
                        'company' as type,
                        company_code as code,
                        company_name_th as name_th,
                        company_name_en as name_en,
                        tax_id,
                        is_active,
                        company_code as parent_company,
                        NULL as parent_branch,
                        NULL as parent_division
                    FROM [dbo].[Companies]
                    WHERE (company_code LIKE @searchTerm 
                        OR company_name_th LIKE @searchTerm 
                        OR company_name_en LIKE @searchTerm 
                        OR tax_id LIKE @searchTerm)
                        ${isActiveOnly ? 'AND is_active = 1' : ''}
                    ORDER BY 
                        CASE 
                            WHEN company_code = @exactTerm THEN 1
                            WHEN company_code LIKE @startTerm THEN 2
                            WHEN company_name_th LIKE @startTerm THEN 3
                            ELSE 4
                        END,
                        company_code
                `;

                const companiesResult = await executeQuery(companiesQuery, { 
                    searchTerm, 
                    exactTerm: q.trim(),
                    startTerm: `${q.trim()}%`
                });
                results.push(...companiesResult.recordset);
            }

            // Search Branches
            if (!type || type === 'branches') {
                const branchesQuery = `
                    SELECT TOP ${limitNum}
                        'branch' as type,
                        b.branch_code as code,
                        b.branch_name as name_th,
                        NULL as name_en,
                        NULL as tax_id,
                        b.is_active,
                        b.company_code as parent_company,
                        NULL as parent_branch,
                        NULL as parent_division,
                        b.is_headquarters,
                        c.company_name_th as company_name
                    FROM [dbo].[Branches] b
                    INNER JOIN [dbo].[Companies] c ON b.company_code = c.company_code
                    WHERE (b.branch_code LIKE @searchTerm 
                        OR b.branch_name LIKE @searchTerm
                        OR c.company_name_th LIKE @searchTerm)
                        ${isActiveOnly ? 'AND b.is_active = 1 AND c.is_active = 1' : ''}
                    ORDER BY 
                        CASE 
                            WHEN b.branch_code = @exactTerm THEN 1
                            WHEN b.branch_code LIKE @startTerm THEN 2
                            WHEN b.branch_name LIKE @startTerm THEN 3
                            ELSE 4
                        END,
                        b.branch_code
                `;

                const branchesResult = await executeQuery(branchesQuery, { 
                    searchTerm, 
                    exactTerm: q.trim(),
                    startTerm: `${q.trim()}%`
                });
                results.push(...branchesResult.recordset);
            }

            // Search Divisions
            if (!type || type === 'divisions') {
                const divisionsQuery = `
                    SELECT TOP ${limitNum}
                        'division' as type,
                        d.division_code as code,
                        d.division_name as name_th,
                        NULL as name_en,
                        NULL as tax_id,
                        d.is_active,
                        d.company_code as parent_company,
                        d.branch_code as parent_branch,
                        NULL as parent_division,
                        c.company_name_th as company_name,
                        b.branch_name
                    FROM [dbo].[Divisions] d
                    INNER JOIN [dbo].[Companies] c ON d.company_code = c.company_code
                    LEFT JOIN [dbo].[Branches] b ON d.branch_code = b.branch_code
                    WHERE (d.division_code LIKE @searchTerm 
                        OR d.division_name LIKE @searchTerm
                        OR c.company_name_th LIKE @searchTerm
                        OR b.branch_name LIKE @searchTerm)
                        ${isActiveOnly ? 'AND d.is_active = 1 AND c.is_active = 1 AND (b.is_active = 1 OR b.branch_code IS NULL)' : ''}
                    ORDER BY 
                        CASE 
                            WHEN d.division_code = @exactTerm THEN 1
                            WHEN d.division_code LIKE @startTerm THEN 2
                            WHEN d.division_name LIKE @startTerm THEN 3
                            ELSE 4
                        END,
                        d.division_code
                `;

                const divisionsResult = await executeQuery(divisionsQuery, { 
                    searchTerm, 
                    exactTerm: q.trim(),
                    startTerm: `${q.trim()}%`
                });
                results.push(...divisionsResult.recordset);
            }

            // Search Departments
            if (!type || type === 'departments') {
                const departmentsQuery = `
                    SELECT TOP ${limitNum}
                        'department' as type,
                        dp.department_code as code,
                        dp.department_name as name_th,
                        NULL as name_en,
                        NULL as tax_id,
                        dp.is_active,
                        d.company_code as parent_company,
                        d.branch_code as parent_branch,
                        dp.division_code as parent_division,
                        c.company_name_th as company_name,
                        b.branch_name,
                        d.division_name
                    FROM [dbo].[Departments] dp
                    INNER JOIN [dbo].[Divisions] d ON dp.division_code = d.division_code
                    INNER JOIN [dbo].[Companies] c ON d.company_code = c.company_code
                    LEFT JOIN [dbo].[Branches] b ON d.branch_code = b.branch_code
                    WHERE (dp.department_code LIKE @searchTerm 
                        OR dp.department_name LIKE @searchTerm
                        OR d.division_name LIKE @searchTerm
                        OR c.company_name_th LIKE @searchTerm
                        OR b.branch_name LIKE @searchTerm)
                        ${isActiveOnly ? 'AND dp.is_active = 1 AND d.is_active = 1 AND c.is_active = 1 AND (b.is_active = 1 OR b.branch_code IS NULL)' : ''}
                    ORDER BY 
                        CASE 
                            WHEN dp.department_code = @exactTerm THEN 1
                            WHEN dp.department_code LIKE @startTerm THEN 2
                            WHEN dp.department_name LIKE @startTerm THEN 3
                            ELSE 4
                        END,
                        dp.department_code
                `;

                const departmentsResult = await executeQuery(departmentsQuery, { 
                    searchTerm, 
                    exactTerm: q.trim(),
                    startTerm: `${q.trim()}%`
                });
                results.push(...departmentsResult.recordset);
            }

            // Sort all results by relevance and apply pagination
            const sortedResults = results
                .sort((a, b) => {
                    // Exact match first
                    if (a.code === q.trim() && b.code !== q.trim()) return -1;
                    if (b.code === q.trim() && a.code !== q.trim()) return 1;
                    
                    // Then by type priority (company > branch > division > department)
                    const typePriority = { company: 1, branch: 2, division: 3, department: 4 };
                    const aPriority = typePriority[a.type] || 5;
                    const bPriority = typePriority[b.type] || 5;
                    
                    if (aPriority !== bPriority) return aPriority - bPriority;
                    
                    // Then alphabetically by code
                    return a.code.localeCompare(b.code);
                })
                .slice(offset, offset + limitNum);

            // Get total count for pagination
            const totalResults = results.length;
            const totalPages = Math.ceil(totalResults / limitNum);

            res.json({
                success: true,
                data: sortedResults,
                meta: {
                    query: q,
                    type: type || 'all',
                    page: pageNum,
                    limit: limitNum,
                    total: totalResults,
                    pages: totalPages,
                    active_only: isActiveOnly
                }
            });

        } catch (error) {
            logger.error('Error in globalSearch:', error);
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

module.exports = SearchController;