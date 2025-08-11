# Organization Structure Management System

ระบบจัดการโครงสร้างองค์กรแบบลำดับชั้น พร้อม RESTful API สำหรับการเชื่อมต่อกับระบบอื่นๆ

## Features

- 🏢 จัดการข้อมูลโครงสร้างองค์กร 4 ระดับ (บริษัท, สาขา, ฝ่าย, แผนก)
- 🔌 RESTful API พร้อมระบบ Authentication
- 🎨 Modern Web Interface ด้วย Tailwind CSS
- 🔐 ระบบจัดการ API Keys และ Permissions
- 📊 Real-time Dashboard แสดงสถิติการใช้งาน
- 📝 API Logging และ Monitoring
- 🔍 ระบบค้นหาข้ามทุกระดับ
- 🔒 Authentication และ Session Management
- 🌐 Responsive Design รองรับทุกอุปกรณ์
- ⚡ Performance Optimized พร้อม Caching

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Microsoft SQL Server 2019+
- **View Engine**: EJS Templates
- **Frontend**: Tailwind CSS, Font Awesome
- **Authentication**: Session-based + API Keys
- **Caching**: In-memory Cache
- **Logging**: Winston Logger
- **Security**: Rate Limiting, XSS Protection

## Prerequisites

- Node.js 18.x หรือสูงกว่า
- Microsoft SQL Server 2019 หรือสูงกว่า
- npm หรือ yarn

## Installation

1. Clone repository
```bash
git clone <repository-url>
cd organization-structure-management
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
# สร้างไฟล์ .env และตั้งค่าดังนี้:
PORT=3001
NODE_ENV=development

# Database Configuration
DB_TYPE=mssql
USE_DATABASE=true
FORCE_MSSQL=true

# MSSQL Server Configuration
DB_SERVER=your-mssql-server
DB_PORT=1433
DB_DATABASE=OrgStructureDB
DB_USER=sa
DB_PASSWORD=your-password

# Session Configuration
SESSION_SECRET=your-session-secret-key
JWT_SECRET=your-jwt-secret-key
```

4. Database Setup
```bash
# ระบบรองรับ MSSQL Server
# ตรวจสอบให้แน่ใจว่า MSSQL Server พร้อมใช้งาน
# และมีฐานข้อมูล OrgStructureDB พร้อมตารางที่จำเป็น:
# - Companies, Branches, Divisions, Departments, API_Keys, API_Logs
```

5. Run application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

6. Access the application
```
- Web Interface: http://localhost:3001
- API Endpoint: http://localhost:3001/api
- API Documentation: http://localhost:3001/docs

Default Login:
- Username: admin
- Password: admin123
```

## Project Structure

```
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # Route definitions
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── validators/     # Input validators
├── views/              # EJS templates
├── public/             # Static files
├── database/           # Database scripts
├── tests/              # Test files
├── docs/               # Documentation
└── logs/               # Application logs
```

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
ใช้ API Key ใน header:
```
X-API-Key: your-api-key-here
```

### Endpoints

#### Companies
- `GET /companies` - ดึงรายการบริษัททั้งหมด
- `GET /companies/:code` - ดึงข้อมูลบริษัทตามรหัส
- `POST /companies` - สร้างบริษัทใหม่
- `PUT /companies/:code` - แก้ไขข้อมูลบริษัท
- `PATCH /companies/:code/status` - เปลี่ยนสถานะบริษัท

#### Branches
- `GET /branches` - ดึงรายการสาขาทั้งหมด
- `GET /companies/:code/branches` - ดึงสาขาของบริษัท
- `POST /branches` - สร้างสาขาใหม่
- `PUT /branches/:code` - แก้ไขข้อมูลสาขา

#### Divisions
- `GET /divisions` - ดึงรายการฝ่ายทั้งหมด
- `GET /companies/:code/divisions` - ดึงฝ่ายของบริษัท
- `GET /branches/:code/divisions` - ดึงฝ่ายของสาขา
- `POST /divisions` - สร้างฝ่ายใหม่
- `PUT /divisions/:code` - แก้ไขข้อมูลฝ่าย

#### Departments
- `GET /departments` - ดึงรายการแผนกทั้งหมด
- `GET /divisions/:code/departments` - ดึงแผนกของฝ่าย
- `POST /departments` - สร้างแผนกใหม่
- `PUT /departments/:code` - แก้ไขข้อมูลแผนก

#### Organization Tree
- `GET /organization-tree` - ดึงโครงสร้างองค์กรทั้งหมด
- `GET /search?q=keyword` - ค้นหาข้ามทุกระดับ

## Testing

```bash
# Run all tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Development Guidelines

1. ใช้ MVC Pattern
2. ทำ Input Validation ทุกครั้ง
3. Handle Errors อย่างเหมาะสม
4. เขียน Unit Tests สำหรับ Business Logic
5. ใช้ ESLint และ Prettier
6. Comment code ที่สำคัญ

## Security

- ใช้ HTTPS ในการ production
- Encrypt sensitive data
- Rate limiting บน API
- Input sanitization
- SQL injection prevention
- XSS protection

## License

ISC

## Current Status

ระบบพร้อมใช้งาน! 

**System Information:**
- 🌐 **Server**: Running on Port 3001
- 🗄️ **Database**: MSSQL Server Connected
- 🧹 **Data**: Clean Database (No test data)
- 📊 **Dashboard**: Real-time Statistics
- 🔑 **API Keys**: Management Ready
- 🔍 **Search**: Cross-level Search Available

## Quick Start

1. เริ่มต้นใช้งาน: http://localhost:3001
2. Login ด้วย: admin / admin123  
3. สร้างบริษัทแรก จาก Dashboard → "เพิ่มบริษัท"
4. เพิ่มสาขา, ฝ่าย, แผนก ตามลำดับ
5. จัดการ API Keys สำหรับเชื่อมต่อระบบอื่น

## Support

สำหรับคำถามหรือปัญหา กรุณาติดต่อ:
- 📧 Email: support@organization.com  
- 📚 Documentation: http://localhost:3001/docs
- 🔧 System Status: http://localhost:3001 (Dashboard)