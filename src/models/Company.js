const { sql, executeQuery, executeTransaction } = require('../config/database');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

class Company {
    constructor(data) {
        this.company_code = data.company_code;
        this.company_name_th = data.company_name_th;
        this.company_name_en = data.company_name_en;
        this.tax_id = data.tax_id;
        this.website = data.website;
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_date = data.created_date;
        this.created_by = data.created_by;
        this.updated_date = data.updated_date;
        this.updated_by = data.updated_by;
    }

    // Get all companies
    static async findAll(filters = {}) {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return this.getMockData().filter(company => {
                    if (filters.is_active !== undefined && company.is_active !== filters.is_active) {
                        return false;
                    }
                    if (filters.search) {
                        const search = filters.search.toLowerCase();
                        return company.company_name_th.toLowerCase().includes(search) ||
                               company.company_name_en?.toLowerCase().includes(search) ||
                               company.company_code.toLowerCase().includes(search);
                    }
                    return true;
                });
            }
            
            let query = `
                SELECT company_code, company_name_th, company_name_en, 
                       tax_id, is_active, created_date, created_by, 
                       updated_date, updated_by
                FROM Companies
                WHERE 1=1
            `;
            
            const inputs = {};
            
            // Apply filters
            if (filters.is_active !== undefined) {
                query += ' AND is_active = @is_active';
                inputs.is_active = filters.is_active;
            }
            
            if (filters.search) {
                query += ' AND (company_name_th LIKE @search OR company_name_en LIKE @search OR company_code LIKE @search)';
                inputs.search = `%${filters.search}%`;
            }
            
            // Add sorting
            query += ' ORDER BY company_code';
            
            const result = await executeQuery(query, inputs);
            return result.recordset.map(row => new Company(row));
        } catch (error) {
            logger.error('Error in Company.findAll:', error);
            throw error;
        }
    }

    // Get company by code
    static async findByCode(companyCode) {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return await this.findMockByCode(companyCode);
            }
            
            const query = `
                SELECT company_code, company_name_th, company_name_en, 
                       tax_id, is_active, created_date, created_by, 
                       updated_date, updated_by
                FROM Companies
                WHERE company_code = @company_code
            `;
            
            const result = await executeQuery(query, { company_code: companyCode });
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            return new Company(result.recordset[0]);
        } catch (error) {
            logger.error('Error in Company.findByCode:', error);
            throw error;
        }
    }

    // Create new company
    // Validate company data
    validate() {
        const errors = [];

        // Required fields validation
        if (!this.company_code || this.company_code.trim() === '') {
            errors.push('รหัสบริษัทเป็นข้อมูลที่จำเป็น');
        }
        if (!this.company_name_th || this.company_name_th.trim() === '') {
            errors.push('ชื่อบริษัท (ไทย) เป็นข้อมูลที่จำเป็น');
        }

        // Format validation
        if (this.company_code && !/^[A-Z0-9]{2,20}$/.test(this.company_code)) {
            errors.push('รหัสบริษัทต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 2-20 ตัวอักษร');
        }
        if (this.tax_id && !/^\d{13}$/.test(this.tax_id)) {
            errors.push('เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก');
        }

        // Length validation
        if (this.company_name_th && this.company_name_th.length > 255) {
            errors.push('ชื่อบริษัท (ไทย) ต้องไม่เกิน 255 ตัวอักษร');
        }
        if (this.company_name_en && this.company_name_en.length > 255) {
            errors.push('ชื่อบริษัท (อังกฤษ) ต้องไม่เกิน 255 ตัวอักษร');
        }

        return errors;
    }

    async create() {
        try {
            // Validate data first
            const validationErrors = this.validate();
            if (validationErrors.length > 0) {
                const error = new Error(validationErrors.join(', '));
                error.statusCode = 400;
                error.validationErrors = validationErrors;
                throw error;
            }

            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return await Company.createMock({
                    company_code: this.company_code,
                    company_name_th: this.company_name_th,
                    company_name_en: this.company_name_en,
                    tax_id: this.tax_id,
                    is_active: this.is_active,
                    created_by: this.created_by
                });
            }
            
            const query = `
                INSERT INTO Companies (
                    company_code, company_name_th, company_name_en, 
                    tax_id, is_active, created_date, created_by
                )
                VALUES (
                    @company_code, @company_name_th, @company_name_en, 
                    @tax_id, @is_active, GETDATE(), @created_by
                )
            `;
            
            const inputs = {
                company_code: this.company_code,
                company_name_th: this.company_name_th,
                company_name_en: this.company_name_en,
                tax_id: this.tax_id,
                is_active: this.is_active,
                created_by: this.created_by
            };
            
            await executeQuery(query, inputs);
            
            // Fetch the created record
            return await Company.findByCode(this.company_code);
        } catch (error) {
            logger.error('Error in Company.create:', error);
            throw error;
        }
    }

    // Update company
    async update() {
        try {
            // Validate data first
            const validationErrors = this.validate();
            if (validationErrors.length > 0) {
                const error = new Error(validationErrors.join(', '));
                error.statusCode = 400;
                error.validationErrors = validationErrors;
                throw error;
            }

            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return await Company.updateMock(this.company_code, {
                    company_name_th: this.company_name_th,
                    company_name_en: this.company_name_en,
                    tax_id: this.tax_id,
                    updated_by: this.updated_by
                });
            }
            
            const query = `
                UPDATE Companies
                SET company_name_th = @company_name_th,
                    company_name_en = @company_name_en,
                    tax_id = @tax_id,
                    updated_date = GETDATE(),
                    updated_by = @updated_by
                WHERE company_code = @company_code
            `;
            
            const inputs = {
                company_code: this.company_code,
                company_name_th: this.company_name_th,
                company_name_en: this.company_name_en,
                tax_id: this.tax_id,
                updated_by: this.updated_by
            };
            
            const result = await executeQuery(query, inputs);
            
            if (result.rowsAffected[0] === 0) {
                throw new Error('Company not found');
            }
            
            return await Company.findByCode(this.company_code);
        } catch (error) {
            logger.error('Error in Company.update:', error);
            throw error;
        }
    }

    // Update company status
    static async updateStatus(companyCode, isActive, updatedBy) {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return await this.updateMockStatus(companyCode, isActive, updatedBy);
            }
            
            const query = `
                UPDATE Companies
                SET is_active = @is_active,
                    updated_date = datetime('now'),
                    updated_by = @updated_by
                WHERE company_code = @company_code
            `;
            
            const inputs = {
                company_code: companyCode,
                is_active: isActive,
                updated_by: updatedBy
            };
            
            const result = await executeQuery(query, inputs);
            
            if (result.rowsAffected[0] === 0) {
                throw new Error('Company not found');
            }
            
            return await Company.findByCode(companyCode);
        } catch (error) {
            logger.error('Error in Company.updateStatus:', error);
            throw error;
        }
    }

    // Delete company
    async delete() {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return await this.deleteMock();
            }
            
            // Use transaction to delete in correct order
            return await executeTransaction(async (transaction) => {
                // Delete departments first (they depend on divisions)
                await executeQuery(`
                    DELETE d FROM Departments d
                    INNER JOIN Divisions div ON d.division_code = div.division_code
                    WHERE div.company_code = @company_code
                `, { company_code: this.company_code }, transaction);
                
                // Delete divisions (they depend on company)
                await executeQuery(`
                    DELETE FROM Divisions WHERE company_code = @company_code
                `, { company_code: this.company_code }, transaction);
                
                // Delete branches (they depend on company)
                await executeQuery(`
                    DELETE FROM Branches WHERE company_code = @company_code
                `, { company_code: this.company_code }, transaction);
                
                // Finally delete the company
                const result = await executeQuery(`
                    DELETE FROM Companies WHERE company_code = @company_code
                `, { company_code: this.company_code }, transaction);
                
                if (result.rowsAffected[0] === 0) {
                    throw new Error('Company not found');
                }
                
                return { company_code: this.company_code };
            });
        } catch (error) {
            logger.error('Error in Company.delete:', error);
            throw error;
        }
    }

    // Check if company code exists
    static async exists(companyCode) {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return this.mockCompanies.some(c => c.company_code === companyCode);
            }
            
            const query = `
                SELECT COUNT(*) as count
                FROM Companies
                WHERE company_code = @company_code
            `;
            
            const result = await executeQuery(query, { company_code: companyCode });
            return result.recordset[0].count > 0;
        } catch (error) {
            logger.error('Error in Company.exists:', error);
            throw error;
        }
    }

    // Get companies with pagination
    static async findPaginated(page = 1, limit = 20, filters = {}) {
        let dataQuery = '';
        let inputs = {};
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return this.getMockPaginated(page, limit, filters);
            }
            
            const offset = (page - 1) * limit;
            
            // Count total records
            let countQuery = `
                SELECT COUNT(*) as total
                FROM Companies
                WHERE 1=1
            `;
            
            inputs = {
                limit: limit,
                offset: offset
            };
            
            // Apply filters for count
            if (filters.is_active !== undefined) {
                countQuery += ' AND is_active = @is_active';
                inputs.is_active = filters.is_active;
            }
            
            if (filters.search) {
                countQuery += ' AND (company_name_th LIKE @search OR company_name_en LIKE @search OR company_code LIKE @search)';
                inputs.search = `%${filters.search}%`;
            }
            
            const countResult = await executeQuery(countQuery, inputs);
            const total = countResult.recordset[0].total;
            
            // Get paginated data
            let dataQuery = `
                SELECT company_code, company_name_th, company_name_en, 
                       tax_id, is_active, created_date, created_by, 
                       updated_date, updated_by
                FROM Companies
                WHERE 1=1
            `;
            
            // Apply filters for data
            if (filters.is_active !== undefined) {
                dataQuery += ' AND is_active = @is_active';
            }
            
            if (filters.search) {
                dataQuery += ' AND (company_name_th LIKE @search OR company_name_en LIKE @search OR company_code LIKE @search)';
            }
            
            dataQuery += ' ORDER BY company_code OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
            
            const dataResult = await executeQuery(dataQuery, inputs);
            
            // Handle different result formats
            const companies = dataResult?.recordset || dataResult || [];
            
            return {
                data: companies.map(row => new Company(row)),
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error in Company.findPaginated:', {
                error: error.message,
                query: dataQuery || 'unknown',
                inputs: inputs || {},
                stack: error.stack
            });
            throw error;
        }
    }

    // Get company statistics
    static async getStatistics() {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return this.getMockStatistics();
            }
            
            const query = `
                SELECT 
                    COUNT(*) as total_companies,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_companies,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_companies
                FROM Companies
            `;
            
            const result = await executeQuery(query);
            return result.recordset[0];
        } catch (error) {
            logger.error('Error in Company.getStatistics:', error);
            throw error;
        }
    }

    // Mock data for development/testing
    static mockCompanies = [
        {
            company_code: 'RUXCHAI',
            company_name_th: 'บริษัท รักษ์ชายธุรกิจ จำกัด',
            company_name_en: 'Ruxchai Business Company Limited',
            tax_id: '0105561234567',
            is_active: true,
            created_date: new Date('2024-01-15'),
            created_by: 'admin',
            updated_date: null,
            updated_by: null
        },
        {
            company_code: 'COLD001',
            company_name_th: 'บริษัท รักษ์ชาย โคลสโตเรจ จำกัด',
            company_name_en: 'Ruxchai Cold Storage Company Limited',
            tax_id: '0105567890123',
            is_active: true,
            created_date: new Date('2024-02-01'),
            created_by: 'admin',
            updated_date: new Date('2024-02-15'),
            updated_by: 'admin'
        },
        {
            company_code: 'LOGISTICS',
            company_name_th: 'บริษัท รักษ์ชาย โลจิสติกส์ จำกัด',
            company_name_en: 'Ruxchai Logistics Company Limited',
            tax_id: '0105512345678',
            is_active: false,
            created_date: new Date('2024-03-01'),
            created_by: 'admin',
            updated_date: new Date('2024-03-10'),
            updated_by: 'admin'
        }
    ];

    static getMockData() {
        return this.mockCompanies.map(data => new Company(data));
    }

    static async findMockByCode(code) {
        const company = this.mockCompanies.find(c => c.company_code === code);
        return company ? new Company(company) : null;
    }

    static async createMock(companyData) {
        // Validate company code
        if (!companyData.company_code) {
            throw new Error('Company code is required');
        }
        
        // Check if code already exists
        if (this.mockCompanies.find(c => c.company_code === companyData.company_code)) {
            throw new Error(`Company code ${companyData.company_code} already exists`);
        }

        const newCompany = {
            ...companyData,
            created_date: new Date(),
            updated_date: null
        };

        this.mockCompanies.push(newCompany);
        return new Company(newCompany);
    }

    static async updateMock(code, updateData) {
        const index = this.mockCompanies.findIndex(c => c.company_code === code);
        if (index === -1) {
            throw new Error('Company not found');
        }

        this.mockCompanies[index] = {
            ...this.mockCompanies[index],
            ...updateData,
            updated_date: new Date()
        };

        return new Company(this.mockCompanies[index]);
    }

    static async updateMockStatus(code, isActive, updatedBy) {
        const index = this.mockCompanies.findIndex(c => c.company_code === code);
        if (index === -1) {
            throw new Error('Company not found');
        }

        this.mockCompanies[index].is_active = isActive;
        this.mockCompanies[index].updated_date = new Date();
        this.mockCompanies[index].updated_by = updatedBy;

        return new Company(this.mockCompanies[index]);
    }

    static getMockPaginated(page = 1, limit = 20, filters = {}) {
        let filteredData = this.getMockData();

        // Apply filters
        if (filters.is_active !== undefined) {
            filteredData = filteredData.filter(c => c.is_active === filters.is_active);
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filteredData = filteredData.filter(c => 
                c.company_name_th.toLowerCase().includes(search) ||
                c.company_name_en?.toLowerCase().includes(search) ||
                c.company_code.toLowerCase().includes(search)
            );
        }

        // Pagination
        const total = filteredData.length;
        const offset = (page - 1) * limit;
        const paginatedData = filteredData.slice(offset, offset + limit);

        return {
            data: paginatedData,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static getMockStatistics() {
        const companies = this.mockCompanies;
        return {
            total_companies: companies.length,
            active_companies: companies.filter(c => c.is_active).length,
            inactive_companies: companies.filter(c => !c.is_active).length
        };
    }

    // Get company stats (for specific company)
    static async getStats(companyCode) {
        try {
            // Use mock data if USE_DATABASE is false
            if (process.env.USE_DATABASE === 'false') {
                return {
                    branches: 0,
                    divisions: 0,
                    departments: 0,
                    active_branches: 0,
                    active_divisions: 0,
                    active_departments: 0
                };
            }
            
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM Branches WHERE company_code = @company_code) as branches,
                    (SELECT COUNT(*) FROM Divisions WHERE company_code = @company_code) as divisions,
                    (SELECT COUNT(*) FROM Departments d INNER JOIN Divisions div ON d.division_code = div.division_code WHERE div.company_code = @company_code) as departments,
                    (SELECT COUNT(*) FROM Branches WHERE company_code = @company_code AND is_active = 1) as active_branches,
                    (SELECT COUNT(*) FROM Divisions WHERE company_code = @company_code AND is_active = 1) as active_divisions,
                    (SELECT COUNT(*) FROM Departments d INNER JOIN Divisions div ON d.division_code = div.division_code WHERE div.company_code = @company_code AND d.is_active = 1 AND div.is_active = 1) as active_departments
            `;
            
            const result = await executeQuery(query, { company_code: companyCode });
            return result.recordset[0];
        } catch (error) {
            logger.error('Error in Company.getStats:', error);
            // Return empty stats on error
            return {
                branches: 0,
                divisions: 0,
                departments: 0,
                active_branches: 0,
                active_divisions: 0,
                active_departments: 0
            };
        }
    }
}

module.exports = Company;