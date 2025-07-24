const { sql, executeQuery, executeTransaction } = require('../config/database');
const logger = require('../utils/logger');

class Division {
    constructor(data) {
        this.division_code = data.division_code;
        this.division_name = data.division_name;
        this.company_code = data.company_code;
        this.branch_code = data.branch_code || null;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_date = data.created_date;
        this.created_by = data.created_by;
        this.updated_date = data.updated_date;
        this.updated_by = data.updated_by;
    }

    // Get all divisions
    static async findAll(filters = {}) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return this.getMockData().filter(division => {
                    if (filters.company_code && division.company_code !== filters.company_code) {
                        return false;
                    }
                    if (filters.branch_code && division.branch_code !== filters.branch_code) {
                        return false;
                    }
                    if (filters.is_active !== undefined && division.is_active !== filters.is_active) {
                        return false;
                    }
                    if (filters.search) {
                        const search = filters.search.toLowerCase();
                        return division.division_name.toLowerCase().includes(search) ||
                               division.division_code.toLowerCase().includes(search);
                    }
                    return true;
                });
            }
            
            let query = `
                SELECT d.division_code, d.division_name, d.company_code, 
                       d.branch_code, d.is_active, d.created_date, 
                       d.created_by, d.updated_date, d.updated_by,
                       c.company_name_th, c.company_name_en,
                       b.branch_name
                FROM Divisions d
                INNER JOIN Companies c ON d.company_code = c.company_code
                LEFT JOIN Branches b ON d.branch_code = b.branch_code
                WHERE 1=1
            `;
            
            const inputs = {};
            
            // Apply filters
            if (filters.company_code) {
                query += ' AND d.company_code = @company_code';
                inputs.company_code = filters.company_code;
            }
            
            if (filters.branch_code) {
                query += ' AND d.branch_code = @branch_code';
                inputs.branch_code = filters.branch_code;
            }
            
            if (filters.is_active !== undefined) {
                query += ' AND d.is_active = @is_active';
                inputs.is_active = filters.is_active;
            }
            
            if (filters.search) {
                query += ' AND (d.division_name LIKE @search OR d.division_code LIKE @search)';
                inputs.search = `%${filters.search}%`;
            }
            
            query += ' ORDER BY d.company_code, d.branch_code, d.division_code';
            
            const result = await executeQuery(query, inputs);
            return result.recordset.map(row => ({
                ...new Division(row),
                company_name_th: row.company_name_th,
                company_name_en: row.company_name_en,
                branch_name: row.branch_name
            }));
        } catch (error) {
            logger.error('Error in Division.findAll:', error);
            throw error;
        }
    }

    // Get division by code
    static async findByCode(divisionCode) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return null;
            }
            
            const query = `
                SELECT d.division_code, d.division_name, d.company_code, 
                       d.branch_code, d.is_active, d.created_date, 
                       d.created_by, d.updated_date, d.updated_by,
                       c.company_name_th, c.company_name_en,
                       b.branch_name
                FROM Divisions d
                INNER JOIN Companies c ON d.company_code = c.company_code
                LEFT JOIN Branches b ON d.branch_code = b.branch_code
                WHERE d.division_code = @division_code
            `;
            
            const result = await executeQuery(query, { division_code: divisionCode });
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            const row = result.recordset[0];
            return {
                ...new Division(row),
                company_name_th: row.company_name_th,
                company_name_en: row.company_name_en,
                branch_name: row.branch_name
            };
        } catch (error) {
            logger.error('Error in Division.findByCode:', error);
            throw error;
        }
    }

    // Get divisions by company
    static async findByCompany(companyCode) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return [];
            }
            
            const query = `
                SELECT d.division_code, d.division_name, d.company_code, 
                       d.branch_code, d.is_active, d.created_date, 
                       d.created_by, d.updated_date, d.updated_by,
                       b.branch_name
                FROM Divisions d
                LEFT JOIN Branches b ON d.branch_code = b.branch_code
                WHERE d.company_code = @company_code
                ORDER BY d.branch_code, d.division_code
            `;
            
            const result = await executeQuery(query, { company_code: companyCode });
            return result.recordset.map(row => ({
                ...new Division(row),
                branch_name: row.branch_name
            }));
        } catch (error) {
            logger.error('Error in Division.findByCompany:', error);
            throw error;
        }
    }

    // Get divisions by branch
    static async findByBranch(branchCode) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return [];
            }
            
            const query = `
                SELECT division_code, division_name, company_code, 
                       branch_code, is_active, created_date, 
                       created_by, updated_date, updated_by
                FROM Divisions
                WHERE branch_code = @branch_code
                ORDER BY division_code
            `;
            
            const result = await executeQuery(query, { branch_code: branchCode });
            return result.recordset.map(row => new Division(row));
        } catch (error) {
            logger.error('Error in Division.findByBranch:', error);
            throw error;
        }
    }

    // Create new division
    async create() {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                // Check if division already exists
                if (this.constructor.mockDivisions.some(d => d.division_code === this.division_code)) {
                    throw new Error('Division code already exists');
                }
                
                // Add new division to mock data
                const newDivision = {
                    division_code: this.division_code,
                    division_name: this.division_name,
                    company_code: this.company_code,
                    branch_code: this.branch_code,
                    is_active: this.is_active,
                    created_date: new Date().toISOString(),
                    created_by: this.created_by,
                    updated_date: null,
                    updated_by: null
                };
                
                this.constructor.mockDivisions.push(newDivision);
                
                return new Division(newDivision);
            }
            
            const query = `
                INSERT INTO Divisions (
                    division_code, division_name, company_code, 
                    branch_code, is_active, created_by
                )
                VALUES (
                    @division_code, @division_name, @company_code, 
                    @branch_code, @is_active, @created_by
                )
            `;
            
            const inputs = {
                division_code: this.division_code,
                division_name: this.division_name,
                company_code: this.company_code,
                branch_code: this.branch_code,
                is_active: this.is_active,
                created_by: this.created_by
            };
            
            await executeQuery(query, inputs);
            
            return await Division.findByCode(this.division_code);
        } catch (error) {
            logger.error('Error in Division.create:', error);
            throw error;
        }
    }

    // Update division
    async update() {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                const divisionIndex = this.constructor.mockDivisions.findIndex(d => d.division_code === this.division_code);
                if (divisionIndex === -1) {
                    throw new Error('Division not found');
                }
                
                // Update the division in mock data
                this.constructor.mockDivisions[divisionIndex] = {
                    ...this.constructor.mockDivisions[divisionIndex],
                    division_name: this.division_name,
                    branch_code: this.branch_code,
                    updated_date: new Date().toISOString(),
                    updated_by: this.updated_by
                };
                
                return new Division(this.constructor.mockDivisions[divisionIndex]);
            }
            
            const query = `
                UPDATE Divisions
                SET division_name = @division_name,
                    branch_code = @branch_code,
                    updated_date = GETDATE(),
                    updated_by = @updated_by
                WHERE division_code = @division_code
            `;
            
            const inputs = {
                division_code: this.division_code,
                division_name: this.division_name,
                branch_code: this.branch_code,
                updated_by: this.updated_by
            };
            
            const result = await executeQuery(query, inputs);
            
            if (result.rowsAffected[0] === 0) {
                throw new Error('Division not found');
            }
            
            return await Division.findByCode(this.division_code);
        } catch (error) {
            logger.error('Error in Division.update:', error);
            throw error;
        }
    }

    // Update division status
    static async updateStatus(divisionCode, isActive, updatedBy) {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                const divisionIndex = this.mockDivisions.findIndex(d => d.division_code === divisionCode);
                if (divisionIndex === -1) {
                    throw new Error('Division not found');
                }
                
                // Update the division status in mock data
                this.mockDivisions[divisionIndex] = {
                    ...this.mockDivisions[divisionIndex],
                    is_active: isActive,
                    updated_date: new Date().toISOString(),
                    updated_by: updatedBy
                };
                
                return new Division(this.mockDivisions[divisionIndex]);
            }
            
            const query = `
                UPDATE Divisions
                SET is_active = @is_active,
                    updated_date = GETDATE(),
                    updated_by = @updated_by
                WHERE division_code = @division_code
            `;
            
            const inputs = {
                division_code: divisionCode,
                is_active: isActive,
                updated_by: updatedBy
            };
            
            const result = await executeQuery(query, inputs);
            
            if (result.rowsAffected[0] === 0) {
                throw new Error('Division not found');
            }
            
            return await Division.findByCode(divisionCode);
        } catch (error) {
            logger.error('Error in Division.updateStatus:', error);
            throw error;
        }
    }

    // Check if division code exists
    static async exists(divisionCode) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return false;
            }
            
            const query = `
                SELECT COUNT(*) as count
                FROM Divisions
                WHERE division_code = @division_code
            `;
            
            const result = await executeQuery(query, { division_code: divisionCode });
            return result.recordset[0].count > 0;
        } catch (error) {
            logger.error('Error in Division.exists:', error);
            throw error;
        }
    }

    // Get divisions with pagination
    static async findPaginated(page = 1, limit = 20, filters = {}) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return {
                    data: [],
                    pagination: {
                        page: page,
                        limit: limit,
                        total: 0,
                        pages: 0
                    }
                };
            }
            
            const offset = (page - 1) * limit;
            
            // Build WHERE clause
            let whereClause = ' WHERE 1=1';
            const inputs = {
                limit: limit,
                offset: offset
            };
            
            if (filters.company_code) {
                whereClause += ' AND d.company_code = @company_code';
                inputs.company_code = filters.company_code;
            }
            
            if (filters.branch_code) {
                whereClause += ' AND d.branch_code = @branch_code';
                inputs.branch_code = filters.branch_code;
            }
            
            if (filters.is_active !== undefined) {
                whereClause += ' AND d.is_active = @is_active';
                inputs.is_active = filters.is_active;
            }
            
            if (filters.search) {
                whereClause += ' AND (d.division_name LIKE @search OR d.division_code LIKE @search)';
                inputs.search = `%${filters.search}%`;
            }
            
            // Count total records
            const countQuery = `
                SELECT COUNT(*) as total
                FROM Divisions d
                ${whereClause}
            `;
            
            const countResult = await executeQuery(countQuery, inputs);
            const total = countResult.recordset[0].total;
            
            // Get paginated data
            const dataQuery = `
                SELECT d.division_code, d.division_name, d.company_code, 
                       d.branch_code, d.is_active, d.created_date, 
                       d.created_by, d.updated_date, d.updated_by,
                       c.company_name_th, c.company_name_en,
                       b.branch_name
                FROM Divisions d
                INNER JOIN Companies c ON d.company_code = c.company_code
                LEFT JOIN Branches b ON d.branch_code = b.branch_code
                ${whereClause}
                ORDER BY d.company_code, d.branch_code, d.division_code
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `;
            
            const dataResult = await executeQuery(dataQuery, inputs);
            
            return {
                data: dataResult.recordset.map(row => ({
                    ...new Division(row),
                    company_name_th: row.company_name_th,
                    company_name_en: row.company_name_en,
                    branch_name: row.branch_name
                })),
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error in Division.findPaginated:', error);
            throw error;
        }
    }

    // Get division statistics
    static async getStatistics(filters = {}) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return {
                    total_divisions: 0,
                    active_divisions: 0,
                    inactive_divisions: 0,
                    companies_count: 0,
                    branches_count: 0
                };
            }
            
            let query = `
                SELECT 
                    COUNT(*) as total_divisions,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_divisions,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_divisions,
                    COUNT(DISTINCT company_code) as companies_count,
                    COUNT(DISTINCT branch_code) as branches_count
                FROM Divisions
                WHERE 1=1
            `;
            
            const inputs = {};
            
            if (filters.company_code) {
                query += ' AND company_code = @company_code';
                inputs.company_code = filters.company_code;
            }
            
            if (filters.branch_code) {
                query += ' AND branch_code = @branch_code';
                inputs.branch_code = filters.branch_code;
            }
            
            const result = await executeQuery(query, inputs);
            return result.recordset[0];
        } catch (error) {
            logger.error('Error in Division.getStatistics:', error);
            throw error;
        }
    }

    // Move division to another branch
    static async moveToBranch(divisionCode, newBranchCode, updatedBy) {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                const divisionIndex = this.mockDivisions.findIndex(d => d.division_code === divisionCode);
                if (divisionIndex === -1) {
                    throw new Error('Division not found');
                }
                
                // Update the division's branch in mock data
                this.mockDivisions[divisionIndex] = {
                    ...this.mockDivisions[divisionIndex],
                    branch_code: newBranchCode,
                    updated_date: new Date().toISOString(),
                    updated_by: updatedBy
                };
                
                return new Division(this.mockDivisions[divisionIndex]);
            }
            
            // First check if the division and new branch exist and belong to the same company
            const checkQuery = `
                SELECT d.company_code as division_company, b.company_code as branch_company
                FROM Divisions d
                CROSS JOIN Branches b
                WHERE d.division_code = @division_code 
                AND b.branch_code = @branch_code
            `;
            
            const checkResult = await executeQuery(checkQuery, {
                division_code: divisionCode,
                branch_code: newBranchCode
            });
            
            if (checkResult.recordset.length === 0) {
                throw new Error('Division or Branch not found');
            }
            
            if (checkResult.recordset[0].division_company !== checkResult.recordset[0].branch_company) {
                throw new Error('Division and Branch must belong to the same company');
            }
            
            // Update the division's branch
            const updateQuery = `
                UPDATE Divisions
                SET branch_code = @branch_code,
                    updated_date = GETDATE(),
                    updated_by = @updated_by
                WHERE division_code = @division_code
            `;
            
            const result = await executeQuery(updateQuery, {
                division_code: divisionCode,
                branch_code: newBranchCode,
                updated_by: updatedBy
            });
            
            if (result.rowsAffected[0] === 0) {
                throw new Error('Failed to update division');
            }
            
            return await Division.findByCode(divisionCode);
        } catch (error) {
            logger.error('Error in Division.moveToBranch:', error);
            throw error;
        }
    }

    // Mock data for testing
    static mockDivisions = [
        {
            division_code: 'RUXCHAI-DIV01',
            division_name: 'ฝ่ายขาย',
            company_code: 'RUXCHAI',
            branch_code: 'RUXCHAI-HQ',
            is_active: true,
            created_date: '2024-01-16T00:00:00.000Z',
            created_by: 'admin',
            updated_date: null,
            updated_by: null
        },
        {
            division_code: 'RUXCHAI-DIV02',
            division_name: 'ฝ่ายการเงิน',
            company_code: 'RUXCHAI',
            branch_code: 'RUXCHAI-HQ',
            is_active: true,
            created_date: '2024-01-16T00:00:00.000Z',
            created_by: 'admin',
            updated_date: null,
            updated_by: null
        },
        {
            division_code: 'COLD001-DIV01',
            division_name: 'ฝ่ายโลจิสติกส์',
            company_code: 'COLD001',
            branch_code: 'COLD001-HQ',
            is_active: true,
            created_date: '2024-02-02T00:00:00.000Z',
            created_by: 'admin',
            updated_date: null,
            updated_by: null
        }
    ];

    static getMockData() {
        return this.mockDivisions.map(data => new Division(data));
    }

    // Mock exists method
    static async exists(divisionCode) {
        if (process.env.USE_DATABASE === 'false') {
            return this.mockDivisions.some(d => d.division_code === divisionCode);
        }
        
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM Divisions
                WHERE division_code = @division_code
            `;
            
            const result = await executeQuery(query, { division_code: divisionCode });
            return result.recordset[0].count > 0;
        } catch (error) {
            logger.error('Error in Division.exists:', error);
            throw error;
        }
    }

    // Mock findByCode method
    static async findByCode(divisionCode) {
        if (process.env.USE_DATABASE === 'false') {
            const division = this.mockDivisions.find(d => d.division_code === divisionCode);
            return division ? new Division(division) : null;
        }
        
        try {
            const query = `
                SELECT division_code, division_name, company_code, 
                       branch_code, is_active, created_date, 
                       created_by, updated_date, updated_by
                FROM Divisions
                WHERE division_code = @division_code
            `;
            
            const result = await executeQuery(query, { division_code: divisionCode });
            return result.recordset.length > 0 ? new Division(result.recordset[0]) : null;
        } catch (error) {
            logger.error('Error in Division.findByCode:', error);
            throw error;
        }
    }

    // Mock findByBranch method
    static async findByBranch(branchCode) {
        if (process.env.USE_DATABASE === 'false') {
            return this.mockDivisions
                .filter(d => d.branch_code === branchCode)
                .map(d => new Division(d));
        }
        
        try {
            const query = `
                SELECT division_code, division_name, company_code, 
                       branch_code, is_active, created_date, 
                       created_by, updated_date, updated_by
                FROM Divisions
                WHERE branch_code = @branch_code
                ORDER BY division_code
            `;
            
            const result = await executeQuery(query, { branch_code: branchCode });
            return result.recordset.map(row => new Division(row));
        } catch (error) {
            logger.error('Error in Division.findByBranch:', error);
            throw error;
        }
    }

    // Mock findByCompany method
    static async findByCompany(companyCode) {
        if (process.env.USE_DATABASE === 'false') {
            return this.mockDivisions
                .filter(d => d.company_code === companyCode)
                .map(d => new Division(d));
        }
        
        try {
            const query = `
                SELECT division_code, division_name, company_code, 
                       branch_code, is_active, created_date, 
                       created_by, updated_date, updated_by
                FROM Divisions
                WHERE company_code = @company_code
                ORDER BY branch_code, division_code
            `;
            
            const result = await executeQuery(query, { company_code: companyCode });
            return result.recordset.map(row => new Division(row));
        } catch (error) {
            logger.error('Error in Division.findByCompany:', error);
            throw error;
        }
    }
}

module.exports = Division;