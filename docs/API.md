# Organization Structure Management System - API Documentation

## Overview

The Organization Structure Management System provides a comprehensive RESTful API for managing hierarchical organizational data with 4 levels: Companies, Branches, Divisions, and Departments.

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

All API endpoints require authentication using API keys in the request header:

```http
X-API-Key: your-api-key-here
```

### API Key Permissions

- `read` - Read-only access to all endpoints
- `write` - Write access (create, update, delete)
- `read_write` - Full access to all operations

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "message": "Data retrieved successfully"
}
```

## Rate Limiting

- **Window**: 15 minutes (900,000ms)
- **Max Requests**: 100 requests per window
- **Headers**: Rate limit info included in response headers

## Endpoints

## Companies

### GET /companies
Retrieve a list of all companies with optional filtering and pagination.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `search` (string): Search by company code or name
- `is_active` (boolean): Filter by active status

**Example Request:**
```http
GET /api/v1/companies?page=1&limit=10&search=ABC&is_active=true
X-API-Key: your-api-key
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "company_code": "ABC001",
      "company_name_th": "#4)1 @-55 31",
      "company_name_en": "ABC Company Limited",
      "tax_id": "0123456789012",
      "is_active": true,
      "created_date": "2024-01-01T00:00:00.000Z",
      "created_by": "system",
      "updated_date": null,
      "updated_by": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "message": "Companies retrieved successfully"
}
```

### GET /companies/:code
Retrieve a specific company by code.

**Parameters:**
- `code` (string): Company code

**Example Response:**
```json
{
  "success": true,
  "data": {
    "company_code": "ABC001",
    "company_name_th": "#4)1 @-55 31",
    "company_name_en": "ABC Company Limited",
    "tax_id": "0123456789012",
    "is_active": true,
    "created_date": "2024-01-01T00:00:00.000Z",
    "created_by": "system"
  },
  "message": "Company retrieved successfully"
}
```

### POST /companies
Create a new company.

**Required Permission:** `write` or `read_write`

**Request Body:**
```json
{
  "company_code": "ABC001",
  "company_name_th": "#4)1 @-55 31",
  "company_name_en": "ABC Company Limited",
  "tax_id": "0123456789012",
  "is_active": true
}
```

**Validation Rules:**
- `company_code`: Required, unique, max 20 characters
- `company_name_th`: Required, max 200 characters
- `company_name_en`: Optional, max 200 characters
- `tax_id`: Optional, must be 13 digits if provided
- `is_active`: Optional, boolean (default: true)

### PUT /companies/:code
Update an existing company.

**Required Permission:** `write` or `read_write`

**Request Body:** Same as POST, all fields optional except validation rules apply

### PATCH /companies/:code/status
Update company active status.

**Required Permission:** `write` or `read_write`

**Request Body:**
```json
{
  "is_active": false
}
```

---

## Branches

### GET /branches
Retrieve a list of all branches with optional filtering and pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `company_code` (string): Filter by company
- `is_active` (boolean): Filter by active status
- `is_headquarters` (boolean): Filter headquarters branches
- `search` (string): Search by branch code or name

### GET /branches/:code
Retrieve a specific branch by code.

### GET /companies/:code/branches
Retrieve all branches for a specific company.

### POST /branches
Create a new branch.

**Required Permission:** `write` or `read_write`

**Request Body:**
```json
{
  "branch_code": "ABC001-HQ",
  "branch_name": "*312C+H",
  "company_code": "ABC001",
  "is_headquarters": true,
  "is_active": true
}
```

**Validation Rules:**
- `branch_code`: Required, unique, max 20 characters
- `branch_name`: Required, max 200 characters
- `company_code`: Required, must exist in Companies table
- `is_headquarters`: Optional, boolean (default: false)
- `is_active`: Optional, boolean (default: true)

**Business Rules:**
- Only one headquarters branch per company
- Company must exist and be active

---

## Divisions

### GET /divisions
Retrieve a list of all divisions with optional filtering and pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `company_code` (string): Filter by company
- `branch_code` (string): Filter by branch
- `is_active` (boolean): Filter by active status
- `search` (string): Search by division code or name

### GET /divisions/:code
Retrieve a specific division by code.

### GET /companies/:code/divisions
Retrieve all divisions for a specific company.

### GET /branches/:code/divisions
Retrieve all divisions for a specific branch.

### POST /divisions
Create a new division.

**Required Permission:** `write` or `read_write`

**Request Body:**
```json
{
  "division_code": "ABC001-IT",
  "division_name": "H2"@BB%"5*2#*@(",
  "company_code": "ABC001",
  "branch_code": "ABC001-HQ",
  "is_active": true
}
```

**Validation Rules:**
- `division_code`: Required, unique, max 20 characters
- `division_name`: Required, max 200 characters
- `company_code`: Required, must exist in Companies table
- `branch_code`: Optional, must exist in Branches table if provided
- `is_active`: Optional, boolean (default: true)

**Business Rules:**
- Division can belong directly to company (no branch) or to a specific branch
- If branch_code provided, branch must belong to the specified company

### PATCH /divisions/:code/move
Move a division to a different branch.

**Required Permission:** `write` or `read_write`

**Request Body:**
```json
{
  "branch_code": "ABC001-BR2"
}
```

---

## Departments

### GET /departments
Retrieve a list of all departments with optional filtering and pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `division_code` (string): Filter by division
- `company_code` (string): Filter by company
- `branch_code` (string): Filter by branch
- `is_active` (boolean): Filter by active status
- `search` (string): Search by department code or name

### GET /departments/:code
Retrieve a specific department by code.

### GET /divisions/:code/departments
Retrieve all departments for a specific division.

### POST /departments
Create a new department.

**Required Permission:** `write` or `read_write`

**Request Body:**
```json
{
  "department_code": "ABC001-IT-DEV",
  "department_name": "A12#0",
  "division_code": "ABC001-IT",
  "is_active": true
}
```

**Validation Rules:**
- `department_code`: Required, unique, max 20 characters
- `department_name`: Required, max 200 characters
- `division_code`: Required, must exist in Divisions table
- `is_active`: Optional, boolean (default: true)

### PATCH /departments/:code/move
Move a department to a different division.

**Required Permission:** `write` or `read_write`

**Request Body:**
```json
{
  "division_code": "ABC001-HR"
}
```

---

## Special Endpoints

### GET /organization-tree
Retrieve the complete organization structure in a hierarchical tree format.

**Query Parameters:**
- `company_code` (string): Filter by specific company

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "company_code": "ABC001",
      "company_name_th": "#4)1 @-55 31",
      "company_name_en": "ABC Company Limited",
      "is_active": true,
      "branches": [
        {
          "branch_code": "ABC001-HQ",
          "branch_name": "*312C+H",
          "is_headquarters": true,
          "is_active": true,
          "divisions": [
            {
              "division_code": "ABC001-IT",
              "division_name": "H2"@BB%"5*2#*@(",
              "is_active": true,
              "departments": [
                {
                  "department_code": "ABC001-IT-DEV",
                  "department_name": "A12#0",
                  "is_active": true
                }
              ]
            }
          ]
        }
      ],
      "divisions": [
        {
          "division_code": "ABC001-ADMIN",
          "division_name": "H2"#4+2#",
          "is_active": true,
          "departments": []
        }
      ]
    }
  ],
  "message": "Organization tree retrieved successfully"
}
```

### GET /search
Search across all organizational entities.

**Query Parameters:**
- `q` (string): Search query (minimum 2 characters)
- `type` (string): Entity type filter (`company`, `branch`, `division`, `department`)
- `limit` (integer): Maximum results per entity type (default: 20)

**Example Response:**
```json
{
  "success": true,
  "data": {
    "query": "IT",
    "total": 15,
    "results": {
      "companies": [],
      "branches": [],
      "divisions": [
        {
          "division_code": "ABC001-IT",
          "division_name": "H2"@BB%"5*2#*@(",
          "company_code": "ABC001",
          "branch_code": "ABC001-HQ",
          "is_active": true,
          "company_name_th": "#4)1 @-55 31",
          "branch_name": "*312C+H"
        }
      ],
      "departments": [
        {
          "department_code": "ABC001-IT-DEV",
          "department_name": "A12#0",
          "division_code": "ABC001-IT",
          "is_active": true,
          "division_name": "H2"@BB%"5*2#*@(",
          "company_code": "ABC001",
          "company_name_th": "#4)1 @-55 31"
        }
      ]
    }
  },
  "message": "Search completed successfully"
}
```

### GET /hierarchy/:type/:code
Get complete hierarchy information for a specific entity.

**Parameters:**
- `type`: Entity type (`company`, `branch`, `division`, `department`)
- `code`: Entity code

**Example Response:**
```json
{
  "success": true,
  "data": {
    "division_code": "ABC001-IT",
    "division_name": "H2"@BB%"5*2#*@(",
    "company_code": "ABC001",
    "branch_code": "ABC001-HQ",
    "company_name_th": "#4)1 @-55 31",
    "branch_name": "*312C+H",
    "department_count": 3
  },
  "message": "division hierarchy retrieved successfully"
}
```

### GET /statistics
Get organization statistics and summary data.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "active_companies": 5,
    "inactive_companies": 1,
    "active_branches": 12,
    "inactive_branches": 2,
    "active_divisions": 25,
    "inactive_divisions": 3,
    "active_departments": 45,
    "inactive_departments": 5,
    "total_companies": 6,
    "total_branches": 14,
    "total_divisions": 28,
    "total_departments": 50,
    "total_entities": 98,
    "companies_with_branches": 4,
    "companies_without_branches": 2
  },
  "message": "Organization statistics retrieved successfully"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_API_KEY` | API key is invalid or missing |
| `INSUFFICIENT_PERMISSIONS` | API key lacks required permissions |
| `VALIDATION_ERROR` | Request data validation failed |
| `NOT_FOUND` | Requested resource not found |
| `DUPLICATE_CODE` | Entity code already exists |
| `FOREIGN_KEY_CONSTRAINT` | Referenced entity does not exist |
| `BUSINESS_RULE_VIOLATION` | Business logic validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `ENDPOINT_NOT_FOUND` | API endpoint does not exist |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## Performance Guidelines

- **Response Time**: Target < 500ms for all endpoints
- **Concurrent Requests**: System supports up to 1000 requests/minute per API key
- **Data Limits**: Maximum 100 items per page
- **Query Optimization**: Use specific filters to reduce result sets

---

## Examples

### Creating a Complete Organization Structure

1. **Create Company:**
```http
POST /api/v1/companies
Content-Type: application/json
X-API-Key: your-api-key

{
  "company_code": "TECH001",
  "company_name_th": "#4)1 @BB%"5 31",
  "company_name_en": "Technology Company Limited",
  "tax_id": "1234567890123"
}
```

2. **Create Branch:**
```http
POST /api/v1/branches
Content-Type: application/json
X-API-Key: your-api-key

{
  "branch_code": "TECH001-HQ",
  "branch_name": "*312C+H",
  "company_code": "TECH001",
  "is_headquarters": true
}
```

3. **Create Division:**
```http
POST /api/v1/divisions
Content-Type: application/json
X-API-Key: your-api-key

{
  "division_code": "TECH001-DEV",
  "division_name": "H2"12",
  "company_code": "TECH001",
  "branch_code": "TECH001-HQ"
}
```

4. **Create Department:**
```http
POST /api/v1/departments
Content-Type: application/json
X-API-Key: your-api-key

{
  "department_code": "TECH001-DEV-WEB",
  "department_name": "A12@'G",
  "division_code": "TECH001-DEV"
}
```

---

## Changelog

### Version 1.0 (Current)
- Initial API release
- Full CRUD operations for all entities
- Organization tree and search functionality
- API key authentication system
- Rate limiting and logging

---

## Support

For API support and questions:
- **Documentation**: Available at `/docs` endpoint
- **Status**: Check system status at `/api/v1/statistics`
- **Issues**: Report issues through the web interface
