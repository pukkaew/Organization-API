const { sql, executeQuery, executeTransaction } = require('../config/database');
const logger = require('../utils/logger');

class Branch {
    constructor(data) {
        this.branch_code = data.branch_code;
        this.branch_name = data.branch_name;
        this.company_code = data.company_code;
        this.is_headquarters = data.is_headquarters !== undefined ? data.is_headquarters : false;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_date = data.created_date;
        this.created_by = data.created_by;
        this.updated_date = data.updated_date;
        this.updated_by = data.updated_by;
    }

    // Get all branches
    static async findAll(filters = {}) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return this.getMockData().filter(branch => {
                    if (filters.company_code && branch.company_code !== filters.company_code) {
                        return false;
                    }
                    if (filters.is_active !== undefined && branch.is_active !== filters.is_active) {
                        return false;
                    }
                    if (filters.is_headquarters !== undefined && branch.is_headquarters !== filters.is_headquarters) {
                        return false;
                    }
                    if (filters.search) {
                        const search = filters.search.toLowerCase();
                        return branch.branch_name.toLowerCase().includes(search) ||
                               branch.branch_code.toLowerCase().includes(search);
                    }
                    return true;
                });
            }
            
            let query = `
                SELECT b.branch_code, b.branch_name, b.company_code, 
                       b.is_headquarters, b.is_active, b.created_date, 
                       b.created_by, b.updated_date, b.updated_by,
                       c.company_name_th, c.company_name_en
                FROM Branches b
                INNER JOIN Companies c ON b.company_code = c.company_code
                WHERE 1=1
            `;
            
            const inputs = {};
            
            // Apply filters
            if (filters.company_code) {
                query += ' AND b.company_code = @company_code';
                inputs.company_code = filters.company_code;
            }
            
            if (filters.is_active !== undefined) {
                query += ' AND b.is_active = @is_active';
                inputs.is_active = filters.is_active;
            }
            
            if (filters.is_headquarters !== undefined) {
                query += ' AND b.is_headquarters = @is_headquarters';
                inputs.is_headquarters = filters.is_headquarters;
            }
            
            if (filters.search) {
                query += ' AND (b.branch_name LIKE @search OR b.branch_code LIKE @search)';
                inputs.search = `%${filters.search}%`;
            }
            
            query += ' ORDER BY b.company_code, b.branch_code';
            
            const result = await executeQuery(query, inputs);
            return result.recordset.map(row => ({
                ...new Branch(row),
                company_name_th: row.company_name_th,
                company_name_en: row.company_name_en
            }));
        } catch (error) {
            logger.error('Error in Branch.findAll:', error);
            throw error;
        }
    }

    // Get branch by code
    static async findByCode(branchCode) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return null;
            }
            
            const query = `
                SELECT b.branch_code, b.branch_name, b.company_code, 
                       b.is_headquarters, b.is_active, b.created_date, 
                       b.created_by, b.updated_date, b.updated_by,
                       c.company_name_th, c.company_name_en
                FROM Branches b
                INNER JOIN Companies c ON b.company_code = c.company_code
                WHERE b.branch_code = @branch_code
            `;
            
            const result = await executeQuery(query, { branch_code: branchCode });
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            const row = result.recordset[0];
            return {
                ...new Branch(row),
                company_name_th: row.company_name_th,
                company_name_en: row.company_name_en
            };
        } catch (error) {
            logger.error('Error in Branch.findByCode:', error);
            throw error;
        }
    }

    // Get branches by company
    static async findByCompany(companyCode) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return [];
            }
            
            const query = `
                SELECT branch_code, branch_name, company_code, 
                       is_headquarters, is_active, created_date, 
                       created_by, updated_date, updated_by
                FROM Branches
                WHERE company_code = @company_code
                ORDER BY is_headquarters DESC, branch_code
            `;
            
            const result = await executeQuery(query, { company_code: companyCode });
            return result.recordset.map(row => new Branch(row));
        } catch (error) {
            logger.error('Error in Branch.findByCompany:', error);
            throw error;
        }
    }

    // Create new branch
    async create() {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                // Check if branch already exists
                if (this.constructor.mockBranches.some(b => b.branch_code === this.branch_code)) {
                    throw new Error('Branch code already exists');
                }
                
                // Handle headquarters logic for mock data
                if (this.is_headquarters) {
                    // Remove headquarters status from other branches in the same company
                    this.constructor.mockBranches.forEach(branch => {
                        if (branch.company_code === this.company_code && branch.is_headquarters) {
                            branch.is_headquarters = false;
                            branch.updated_date = new Date().toISOString();
                            branch.updated_by = this.created_by;
                        }
                    });
                }
                
                // Add new branch to mock data
                const newBranch = {
                    branch_code: this.branch_code,
                    branch_name: this.branch_name,
                    company_code: this.company_code,
                    is_headquarters: this.is_headquarters,
                    is_active: this.is_active,
                    created_date: new Date().toISOString(),
                    created_by: this.created_by,
                    updated_date: null,
                    updated_by: null
                };
                
                this.constructor.mockBranches.push(newBranch);
                
                // Return the created branch instance
                return new Branch(newBranch);
            }
            
            // Check if setting as headquarters
            if (this.is_headquarters) {
                // Remove headquarters status from other branches in the same company
                await executeQuery(
                    `UPDATE Branches 
                     SET is_headquarters = 0, 
                         updated_date = GETDATE(), 
                         updated_by = @updated_by
                     WHERE company_code = @company_code AND is_headquarters = 1`,
                    { 
                        company_code: this.company_code,
                        updated_by: this.created_by
                    }
                );
            }

            const query = `
                INSERT INTO Branches (
                    branch_code, branch_name, company_code, 
                    is_headquarters, is_active, created_by
                )
                VALUES (
                    @branch_code, @branch_name, @company_code, 
                    @is_headquarters, @is_active, @created_by
                )
            `;
            
            const inputs = {
                branch_code: this.branch_code,
                branch_name: this.branch_name,
                company_code: this.company_code,
                is_headquarters: this.is_headquarters,
                is_active: this.is_active,
                created_by: this.created_by
            };
            
            await executeQuery(query, inputs);
            
            return await Branch.findByCode(this.branch_code);
        } catch (error) {
            logger.error('Error in Branch.create:', error);
            throw error;
        }
    }

    // Update branch
    async update() {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                const branchIndex = this.constructor.mockBranches.findIndex(b => b.branch_code === this.branch_code);
                if (branchIndex === -1) {
                    throw new Error('Branch not found');
                }
                
                // Handle headquarters logic for mock data
                if (this.is_headquarters) {
                    // Remove headquarters status from other branches in the same company
                    this.constructor.mockBranches.forEach((branch, index) => {
                        if (branch.company_code === this.company_code && 
                            branch.is_headquarters && 
                            index !== branchIndex) {
                            branch.is_headquarters = false;
                            branch.updated_date = new Date().toISOString();
                            branch.updated_by = this.updated_by;
                        }
                    });
                }
                
                // Update the branch in mock data
                this.constructor.mockBranches[branchIndex] = {
                    ...this.constructor.mockBranches[branchIndex],
                    branch_name: this.branch_name,
                    is_headquarters: this.is_headquarters,
                    updated_date: new Date().toISOString(),
                    updated_by: this.updated_by
                };
                
                return new Branch(this.constructor.mockBranches[branchIndex]);
            }
            
            // Check if setting as headquarters
            if (this.is_headquarters) {
                // Remove headquarters status from other branches in the same company
                await executeQuery(
                    `UPDATE Branches 
                     SET is_headquarters = 0, 
                         updated_date = GETDATE(), 
                         updated_by = @updated_by
                     WHERE company_code = @company_code 
                     AND is_headquarters = 1 
                     AND branch_code != @branch_code`,
                    { 
                        company_code: this.company_code,
                        branch_code: this.branch_code,
                        updated_by: this.updated_by
                    }
                );
            }

            const query = `
                UPDATE Branches
                SET branch_name = @branch_name,
                    is_headquarters = @is_headquarters,
                    updated_date = GETDATE(),
                    updated_by = @updated_by
                WHERE branch_code = @branch_code
            `;
            
            const inputs = {
                branch_code: this.branch_code,
                branch_name: this.branch_name,
                is_headquarters: this.is_headquarters,
                updated_by: this.updated_by
            };
            
            const result = await executeQuery(query, inputs);
            
            if (result.rowsAffected[0] === 0) {
                throw new Error('Branch not found');
            }
            
            return await Branch.findByCode(this.branch_code);
        } catch (error) {
            logger.error('Error in Branch.update:', error);
            throw error;
        }
    }

    // Delete branch
    async delete() {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                const index = this.constructor.mockBranchs.findIndex(item => item.branch_code === this.branch_code);
                if (index === -1) {
                    throw new Error('Branch not found');
                }
                this.constructor.mockBranchs.splice(index, 1);
                return { branch_code: this.branch_code };
            }
            
            const query = `
                DELETE FROM Branches
                WHERE branch_code = @branch_code
            `;
            
            const result = await executeQuery(query, { branch_code: this.branch_code });
            
            if (result.rowsAffected[0] === 0) {
                throw new Error('Branch not found');
            }
            
            return { branch_code: this.branch_code };
        } catch (error) {
            logger.error('Error in Branch.delete:', error);
            throw error;
        }
    }

    // Update branch status
    static async updateStatus(branchCode, isActive, updatedBy) {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                const branchIndex = this.mockBranches.findIndex(b => b.branch_code === branchCode);
                if (branchIndex === -1) {
                    throw new Error('Branch not found');
                }
                
                // Update the branch status in mock data
                this.mockBranches[branchIndex] = {
                    ...this.mockBranches[branchIndex],
                    is_active: isActive,
                    updated_date: new Date().toISOString(),
                    updated_by: updatedBy
                };
                
                return new Branch(this.mockBranches[branchIndex]);
            }
            
            const query = `
                UPDATE Branches
                SET is_active = @is_active,
                    updated_date = GETDATE(),
                    updated_by = @updated_by
                WHERE branch_code = @branch_code
            `;
            
            const inputs = {
                branch_code: branchCode,
                is_active: isActive,
                updated_by: updatedBy
            };
            
            const result = await executeQuery(query, inputs);
            
            if (result.rowsAffected[0] === 0) {
                throw new Error('Branch not found');
            }
            
            return await Branch.findByCode(branchCode);
        } catch (error) {
            logger.error('Error in Branch.updateStatus:', error);
            throw error;
        }
    }

    // Check if branch code exists
    static async exists(branchCode) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return false;
            }
            
            const query = `
                SELECT COUNT(*) as count
                FROM Branches
                WHERE branch_code = @branch_code
            `;
            
            const result = await executeQuery(query, { branch_code: branchCode });
            return result.recordset[0].count > 0;
        } catch (error) {
            logger.error('Error in Branch.exists:', error);
            throw error;
        }
    }

    // Get branches with pagination
    static async findPaginated(page = 1, limit = 20, filters = {}) {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                // Apply filters to mock data
                let filteredData = this.getMockData().filter(branch => {
                    if (filters.company_code && branch.company_code !== filters.company_code) {
                        return false;
                    }
                    if (filters.is_active !== undefined && branch.is_active !== filters.is_active) {
                        return false;
                    }
                    if (filters.is_headquarters !== undefined && branch.is_headquarters !== filters.is_headquarters) {
                        return false;
                    }
                    if (filters.search) {
                        const search = filters.search.toLowerCase();
                        return branch.branch_name.toLowerCase().includes(search) ||
                               branch.branch_code.toLowerCase().includes(search);
                    }
                    return true;
                });

                const total = filteredData.length;
                const offset = (page - 1) * limit;
                const paginatedData = filteredData.slice(offset, offset + limit);

                return {
                    data: paginatedData,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        pages: Math.ceil(total / limit),
                        hasNext: offset + limit < total,
                        hasPrev: page > 1
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
                whereClause += ' AND b.company_code = @company_code';
                inputs.company_code = filters.company_code;
            }
            
            if (filters.is_active !== undefined) {
                whereClause += ' AND b.is_active = @is_active';
                inputs.is_active = filters.is_active;
            }
            
            if (filters.search) {
                whereClause += ' AND (b.branch_name LIKE @search OR b.branch_code LIKE @search)';
                inputs.search = `%${filters.search}%`;
            }
            
            // Count total records
            const countQuery = `
                SELECT COUNT(*) as total
                FROM Branches b
                ${whereClause}
            `;
            
            const countResult = await executeQuery(countQuery, inputs);
            const total = countResult.recordset[0].total;
            
            // Get paginated data
            const dataQuery = `
                SELECT b.branch_code, b.branch_name, b.company_code, 
                       b.is_headquarters, b.is_active, b.created_date, 
                       b.created_by, b.updated_date, b.updated_by,
                       c.company_name_th, c.company_name_en
                FROM Branches b
                INNER JOIN Companies c ON b.company_code = c.company_code
                ${whereClause}
                ORDER BY b.company_code, b.branch_code
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `;
            
            const dataResult = await executeQuery(dataQuery, inputs);
            
            return {
                data: dataResult.recordset.map(row => ({
                    ...new Branch(row),
                    company_name_th: row.company_name_th,
                    company_name_en: row.company_name_en
                })),
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error in Branch.findPaginated:', error);
            throw error;
        }
    }

    // Get branch statistics
    static async getStatistics(companyCode = null) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return {
                    total_branches: 0,
                    active_branches: 0,
                    inactive_branches: 0,
                    headquarters_count: 0
                };
            }
            
            let query = `
                SELECT 
                    COUNT(*) as total_branches,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_branches,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_branches,
                    SUM(CASE WHEN is_headquarters = 1 THEN 1 ELSE 0 END) as headquarters_count
                FROM Branches
            `;
            
            const inputs = {};
            
            if (companyCode) {
                query += ' WHERE company_code = @company_code';
                inputs.company_code = companyCode;
            }
            
            const result = await executeQuery(query, inputs);
            return result.recordset[0];
        } catch (error) {
            logger.error('Error in Branch.getStatistics:', error);
            throw error;
        }
    }

    // Check if company has branches
    static async companyHasBranches(companyCode) {
        try {
            // Skip database if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return this.mockBranches.some(b => b.company_code === companyCode);
            }
            
            const query = `
                SELECT COUNT(*) as count
                FROM Branches
                WHERE company_code = @company_code
            `;
            
            const result = await executeQuery(query, { company_code: companyCode });
            return result.recordset[0].count > 0;
        } catch (error) {
            logger.error('Error in Branch.companyHasBranches:', error);
            throw error;
        }
    }

    // Mock data for testing
    static mockBranches = [
        {
            branch_code: 'RUXCHAI-HQ',
            branch_name: 'สำนักงานใหญ่',
            company_code: 'RUXCHAI',
            is_headquarters: true,
            is_active: true,
            created_date: '2024-01-15T00:00:00.000Z',
            created_by: 'admin',
            updated_date: null,
            updated_by: null
        },
        {
            branch_code: 'RUXCHAI-BKK',
            branch_name: 'สาขากรุงเทพ',
            company_code: 'RUXCHAI',
            is_headquarters: false,
            is_active: true,
            created_date: '2024-01-20T00:00:00.000Z',
            created_by: 'admin',
            updated_date: null,
            updated_by: null
        },
        {
            branch_code: 'COLD001-HQ',
            branch_name: 'สำนักงานใหญ่',
            company_code: 'COLD001',
            is_headquarters: true,
            is_active: true,
            created_date: '2024-02-01T00:00:00.000Z',
            created_by: 'admin',
            updated_date: null,
            updated_by: null
        }
    ];

    static getMockData() {
        return this.mockBranches.map(data => new Branch(data));
    }

    // Mock exists method
    static async exists(branchCode) {
        if (process.env.USE_DATABASE === 'false') {
            return this.mockBranches.some(b => b.branch_code === branchCode);
        }
        
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM Branches
                WHERE branch_code = @branch_code
            `;
            
            const result = await executeQuery(query, { branch_code: branchCode });
            return result.recordset[0].count > 0;
        } catch (error) {
            logger.error('Error in Branch.exists:', error);
            throw error;
        }
    }

    // Mock findByCode method
    static async findByCode(branchCode) {
        if (process.env.USE_DATABASE === 'false') {
            const branch = this.mockBranches.find(b => b.branch_code === branchCode);
            return branch ? new Branch(branch) : null;
        }
        
        try {
            const query = `
                SELECT branch_code, branch_name, company_code, 
                       is_headquarters, is_active, created_date, 
                       created_by, updated_date, updated_by
                FROM Branches
                WHERE branch_code = @branch_code
            `;
            
            const result = await executeQuery(query, { branch_code: branchCode });
            return result.recordset.length > 0 ? new Branch(result.recordset[0]) : null;
        } catch (error) {
            logger.error('Error in Branch.findByCode:', error);
            throw error;
        }
    }

    // Mock findByCompany method
    static async findByCompany(companyCode) {
        if (process.env.USE_DATABASE === 'false') {
            return this.mockBranches
                .filter(b => b.company_code === companyCode)
                .map(b => new Branch(b));
        }
        
        try {
            const query = `
                SELECT branch_code, branch_name, company_code, 
                       is_headquarters, is_active, created_date, 
                       created_by, updated_date, updated_by
                FROM Branches
                WHERE company_code = @company_code
                ORDER BY is_headquarters DESC, branch_code
            `;
            
            const result = await executeQuery(query, { company_code: companyCode });
            return result.recordset.map(row => new Branch(row));
        } catch (error) {
            logger.error('Error in Branch.findByCompany:', error);
            throw error;
        }
    }
}

module.exports = Branch;