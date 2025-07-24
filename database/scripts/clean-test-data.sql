-- =============================================
-- Clean Test Data Script
-- Organization Structure Management System  
-- =============================================

USE [OrgStructureDB_Test]
GO

-- =============================================
-- Delete all data in reverse order of dependencies
-- =============================================

PRINT 'Starting data cleanup...';

-- 1. Delete Departments (depends on Divisions)
DELETE FROM [dbo].[Departments];
PRINT 'Departments data deleted.';

-- 2. Delete Divisions (depends on Companies/Branches)  
DELETE FROM [dbo].[Divisions];
PRINT 'Divisions data deleted.';

-- 3. Delete Branches (depends on Companies)
DELETE FROM [dbo].[Branches];
PRINT 'Branches data deleted.';

-- 4. Delete Companies (root table)
DELETE FROM [dbo].[Companies];
PRINT 'Companies data deleted.';

-- 5. Delete API Logs (depends on API Keys)
DELETE FROM [dbo].[API_Logs];
PRINT 'API Logs data deleted.';

-- 6. Delete API Keys
DELETE FROM [dbo].[API_Keys];
PRINT 'API Keys data deleted.';

-- =============================================
-- Reset Identity Columns
-- =============================================

-- Reset API Keys identity
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[API_Keys]'))
BEGIN
    DBCC CHECKIDENT ('[dbo].[API_Keys]', RESEED, 0);
    PRINT 'API_Keys identity reset.';
END

-- Reset API Logs identity  
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[API_Logs]'))
BEGIN
    DBCC CHECKIDENT ('[dbo].[API_Logs]', RESEED, 0);
    PRINT 'API_Logs identity reset.';
END

-- =============================================
-- Verify cleanup
-- =============================================
DECLARE @totalRecords INT = 0;

SELECT @totalRecords = @totalRecords + COUNT(*) FROM [dbo].[Companies];
SELECT @totalRecords = @totalRecords + COUNT(*) FROM [dbo].[Branches];
SELECT @totalRecords = @totalRecords + COUNT(*) FROM [dbo].[Divisions];
SELECT @totalRecords = @totalRecords + COUNT(*) FROM [dbo].[Departments];
SELECT @totalRecords = @totalRecords + COUNT(*) FROM [dbo].[API_Keys];
SELECT @totalRecords = @totalRecords + COUNT(*) FROM [dbo].[API_Logs];

PRINT 'Total remaining records: ' + CAST(@totalRecords AS VARCHAR(10));

IF @totalRecords = 0
    PRINT 'SUCCESS: All test data has been cleaned successfully!';
ELSE
    PRINT 'WARNING: Some data may still remain in the database.';

-- =============================================
-- Show table counts
-- =============================================
PRINT '========================================';
PRINT 'Final table record counts:';
PRINT '========================================';

SELECT 'Companies' as TableName, COUNT(*) as RecordCount FROM [dbo].[Companies]
UNION ALL
SELECT 'Branches', COUNT(*) FROM [dbo].[Branches]  
UNION ALL
SELECT 'Divisions', COUNT(*) FROM [dbo].[Divisions]
UNION ALL
SELECT 'Departments', COUNT(*) FROM [dbo].[Departments]
UNION ALL
SELECT 'API_Keys', COUNT(*) FROM [dbo].[API_Keys]
UNION ALL  
SELECT 'API_Logs', COUNT(*) FROM [dbo].[API_Logs];

PRINT '========================================';
PRINT 'Data cleanup completed!';