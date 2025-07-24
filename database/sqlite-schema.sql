-- SQLite Schema for Organization Management System

-- Companies table
CREATE TABLE IF NOT EXISTS Companies (
    company_code TEXT PRIMARY KEY,
    company_name_th TEXT NOT NULL,
    company_name_en TEXT,
    tax_id TEXT UNIQUE,
    is_active INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    updated_date TEXT,
    updated_by TEXT
);

-- Branches table
CREATE TABLE IF NOT EXISTS Branches (
    branch_code TEXT PRIMARY KEY,
    branch_name TEXT NOT NULL,
    company_code TEXT NOT NULL,
    is_headquarters INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    updated_date TEXT,
    updated_by TEXT,
    FOREIGN KEY (company_code) REFERENCES Companies(company_code)
);

-- Divisions table
CREATE TABLE IF NOT EXISTS Divisions (
    division_code TEXT PRIMARY KEY,
    division_name TEXT NOT NULL,
    company_code TEXT NOT NULL,
    branch_code TEXT,
    is_active INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    updated_date TEXT,
    updated_by TEXT,
    FOREIGN KEY (company_code) REFERENCES Companies(company_code),
    FOREIGN KEY (branch_code) REFERENCES Branches(branch_code)
);

-- Departments table
CREATE TABLE IF NOT EXISTS Departments (
    department_code TEXT PRIMARY KEY,
    department_name TEXT NOT NULL,
    division_code TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    updated_date TEXT,
    updated_by TEXT,
    FOREIGN KEY (division_code) REFERENCES Divisions(division_code)
);

-- API Keys table
CREATE TABLE IF NOT EXISTS API_Keys (
    api_key_id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key TEXT NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE,
    app_name TEXT NOT NULL,
    description TEXT,
    permissions TEXT DEFAULT 'read',
    is_active INTEGER DEFAULT 1,
    expires_date TEXT,
    created_date TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    updated_date TEXT,
    updated_by TEXT,
    last_used_date TEXT,
    usage_count INTEGER DEFAULT 0
);

-- API Logs table
CREATE TABLE IF NOT EXISTS API_Logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_body TEXT,
    response_status INTEGER,
    response_time INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (api_key_id) REFERENCES API_Keys(api_key_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS Sessions (
    session_id TEXT PRIMARY KEY,
    expires INTEGER,
    data TEXT
);

-- Sample data
INSERT OR IGNORE INTO Companies (company_code, company_name_th, company_name_en, tax_id, is_active, created_by) VALUES
('RUXCHAI', 'บริษัท รักษ์ชายธุรกิจ จำกัด', 'Ruxchai Business Company Limited', '0105561234567', 1, 'admin'),
('COLD001', 'บริษัท รักษ์ชาย โคลสโตเรจ จำกัด', 'Ruxchai Cold Storage Company Limited', '0105567890123', 1, 'admin'),
('LOGISTICS', 'บริษัท รักษ์ชาย โลจิสติกส์ จำกัด', 'Ruxchai Logistics Company Limited', '0105512345678', 0, 'admin');

INSERT OR IGNORE INTO Branches (branch_code, branch_name, company_code, is_headquarters, is_active, created_by) VALUES
('RUXCHAI-HQ', 'สำนักงานใหญ่', 'RUXCHAI', 1, 1, 'admin'),
('RUXCHAI-BKK', 'สาขากรุงเทพ', 'RUXCHAI', 0, 1, 'admin'),
('COLD001-HQ', 'สำนักงานใหญ่', 'COLD001', 1, 1, 'admin');

INSERT OR IGNORE INTO Divisions (division_code, division_name, company_code, branch_code, is_active, created_by) VALUES
('RUXCHAI-DIV01', 'ฝ่ายขาย', 'RUXCHAI', 'RUXCHAI-HQ', 1, 'admin'),
('RUXCHAI-DIV02', 'ฝ่ายการเงิน', 'RUXCHAI', 'RUXCHAI-HQ', 1, 'admin'),
('COLD001-DIV01', 'ฝ่ายโลจิสติกส์', 'COLD001', 'COLD001-HQ', 1, 'admin');

INSERT OR IGNORE INTO Departments (department_code, department_name, division_code, is_active, created_by) VALUES
('RUXCHAI-DEPT01', 'แผนกขายในประเทศ', 'RUXCHAI-DIV01', 1, 'admin'),
('RUXCHAI-DEPT02', 'แผนกขายต่างประเทศ', 'RUXCHAI-DIV01', 1, 'admin'),
('RUXCHAI-DEPT03', 'แผนกบัญชี', 'RUXCHAI-DIV02', 1, 'admin'),
('COLD001-DEPT01', 'แผนกขนส่ง', 'COLD001-DIV01', 1, 'admin');

-- Sample API Keys
INSERT OR IGNORE INTO API_Keys (api_key, api_key_hash, app_name, permissions, is_active, created_by) VALUES
('test-api-key-12345', 'hash123', 'Development Key', 'read,write', 1, 'admin'),
('read-only-key-67890', 'hash456', 'Read Only Key', 'read', 1, 'admin');