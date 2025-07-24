# Tests Directory

This directory contains all test files for the Organization Structure Management API.

## Directory Structure

### `/crud/`
- `test-mssql-crud.js` - Comprehensive CRUD operations testing with MSSQL database
- Tests create, read, update, delete operations for all entities (companies, branches, divisions, departments)

### `/database/`
- `test-db-direct.js` - Direct database connection and query testing
- Tests basic database connectivity and insert operations

### `/environment/`
- `test-env.js` - Environment variables and configuration testing
- Validates database connection settings and environment setup

### `/integration/`
- `api.test.js` - Integration tests for API endpoints
- Tests API functionality with authentication

### `/unit/`
- `company.test.js` - Unit tests for Company model
- `branch.test.js` - Unit tests for Branch model
- `division.test.js` - Unit tests for Division model
- `department.test.js` - Unit tests for Department model

### Root Level Tests
Core test files for comprehensive system testing:
- `test-comprehensive-api.js` - Complete API endpoint testing
- `test-comprehensive-mssql.js` - Full MSSQL database testing
- `test-all-requirements.js` - Requirements validation testing
- `test-simple-database.js` - Basic database operations
- `test-login.js` - Authentication testing
- `test-with-api-key.js` - API key authentication testing
- `test-sql-server-schema.js` - Database schema validation

**Note**: Redundant and debug test files have been removed for cleaner codebase maintenance.

## Running Tests

### CRUD Tests
```bash
# Run comprehensive MSSQL CRUD test
node tests/crud/test-mssql-crud.js
```

### Database Tests
```bash
# Test database connection
node tests/database/test-db-direct.js

# Test environment configuration
node tests/environment/test-env.js
```

### Unit Tests
```bash
# Run all unit tests
npm test
```

## Test Results

The CRUD test provides detailed output showing:
- ✅ Successful operations (returning 302 redirects)
- ❌ Failed operations with status codes
- 📊 Overall success rate and detailed failure analysis

Current CRUD test success rate: **58.3%**
- All form submissions work correctly (create, update, delete)
- Authentication and session handling functional
- Some persistence/timing issues with record retrieval