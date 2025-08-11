# Deployment Guide - Organization Structure Management

## Overview

9H!7-2# Deploy #0 Organization Structure Management System *3+#1 Production Environment

## Current Deployment Status

### Development Environment
- **Status**:  Running and Ready
- **URL**: http://localhost:3001
- **Database**: MSSQL Server (45.136.253.81:1433)
- **Environment**: Clean and Production-Ready

### System Information
- **Node.js Version**: 18.x+
- **Database**: Microsoft SQL Server 2019+
- **Port**: 3001
- **SSL**: Ready for HTTPS
- **Authentication**: Session + API Keys

## Pre-Deployment Checklist

### System Requirements
- [ ] Node.js 18.x or higher
- [ ] Microsoft SQL Server 2019+ accessible
- [ ] Minimum 2GB RAM
- [ ] Minimum 10GB disk space
- [ ] Network access to database server
- [ ] SSL certificate (for HTTPS)

### Database Requirements
- [ ] MSSQL Server running and accessible
- [ ] Database `OrgStructureDB` created
- [ ] Required tables created (Companies, Branches, Divisions, Departments, API_Keys, API_Logs)
- [ ] Database user with appropriate permissions
- [ ] Network connectivity between app server and database

### Security Requirements
- [ ] Firewall configured for required ports
- [ ] SSL/TLS certificates ready
- [ ] Environment variables secured
- [ ] Database connection encrypted
- [ ] Rate limiting configured

## Environment Configuration

### Production Environment Variables
```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_TYPE=mssql
USE_DATABASE=true
FORCE_MSSQL=true
DB_SERVER=your-production-mssql-server
DB_PORT=1433
DB_DATABASE=OrgStructureDB
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# Security Configuration
SESSION_SECRET=your-long-random-session-secret-key
JWT_SECRET=your-long-random-jwt-secret-key

# CORS and Security
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## Deployment Methods

### Method 1: Traditional Server Deployment

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Application Deployment
```bash
# Clone or upload application
git clone <your-repo> /opt/organization-api
cd /opt/organization-api

# Install dependencies
npm ci --production

# Create logs directory
mkdir -p logs

# Set up environment file
sudo nano .env
# (Copy production environment variables)

# Set permissions
sudo chown -R www-data:www-data /opt/organization-api
sudo chmod -R 755 /opt/organization-api
```

#### 3. Process Management with PM2
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'organization-api',
    script: 'server.js',
    cwd: '/opt/organization-api',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: '/opt/organization-api/logs/pm2.log',
    error_file: '/opt/organization-api/logs/pm2-error.log',
    out_file: '/opt/organization-api/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    restart_delay: 1000,
    max_restarts: 10
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor application
pm2 monit
```

### Method 2: Docker Deployment

#### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["node", "server.js"]
```

#### 2. Docker Compose Configuration
```yaml
version: '3.8'
services:
  organization-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DB_TYPE=mssql
      - USE_DATABASE=true
      - DB_SERVER=your-mssql-server
      - DB_PORT=1433
      - DB_DATABASE=OrgStructureDB
      - DB_USER=your-db-user
      - DB_PASSWORD=your-db-password
      - SESSION_SECRET=your-session-secret
      - JWT_SECRET=your-jwt-secret
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Method 3: Cloud Platform Deployment

#### AWS EC2 Deployment
1. Launch EC2 instance (Ubuntu 22.04 LTS)
2. Configure security groups (ports 22, 80, 443, 3001)
3. Install Node.js and application dependencies
4. Set up Application Load Balancer
5. Configure Auto Scaling Group
6. Set up CloudWatch monitoring

#### Azure App Service
1. Create Azure App Service (Node.js 18)
2. Configure connection strings for database
3. Set up Application Insights
4. Configure deployment slots
5. Set up custom domain and SSL

#### Google Cloud Platform
1. Create Compute Engine instance or App Engine
2. Configure Cloud SQL for MSSQL Server
3. Set up Load Balancer
4. Configure Cloud Monitoring
5. Set up Cloud Build for CI/CD

## Reverse Proxy Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3001;
    }
}
```

## Database Migration and Setup

### Production Database Setup
```sql
-- Create database
CREATE DATABASE OrgStructureDB;
GO

USE OrgStructureDB;
GO

-- Create tables (run table creation scripts)
-- See DATABASE.md for complete schema

-- Create indexes for performance
CREATE INDEX IX_Branches_CompanyCode ON Branches(company_code);
CREATE INDEX IX_Divisions_CompanyCode ON Divisions(company_code);
CREATE INDEX IX_Divisions_BranchCode ON Divisions(branch_code);
CREATE INDEX IX_Departments_DivisionCode ON Departments(division_code);
CREATE INDEX IX_APILogs_APIKeyId ON API_Logs(api_key_id);
CREATE INDEX IX_APILogs_CreatedDate ON API_Logs(created_date);

-- Set up database maintenance
-- Configure backup schedules
-- Set up log file management
```

## Monitoring and Logging

### Application Monitoring
```javascript
// Add to server.js for production monitoring
const express = require('express');
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV
    });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
    // Implement Prometheus metrics or similar
});
```

### Log Management
```bash
# Set up log rotation
sudo nano /etc/logrotate.d/organization-api

/opt/organization-api/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload organization-api
    endscript
}
```

## Security Hardening

### Server Security
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3001  # Remove after reverse proxy setup
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl reload ssh

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Application Security
- Environment variables secured
- Database connections encrypted
- Rate limiting implemented
- Input validation and sanitization
- CORS properly configured
- Security headers set
- Authentication and authorization in place

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/organization-api
          git pull origin main
          npm ci --production
          pm2 reload organization-api
```

## Backup and Recovery

### Database Backup
```sql
-- Full backup
BACKUP DATABASE OrgStructureDB 
TO DISK = '/backup/OrgStructureDB_Full.bak'
WITH COMPRESSION, INIT;

-- Differential backup
BACKUP DATABASE OrgStructureDB 
TO DISK = '/backup/OrgStructureDB_Diff.bak'
WITH DIFFERENTIAL, COMPRESSION;
```

### Application Backup
```bash
#!/bin/bash
# Backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/organization-api"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /opt/organization-api

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /opt/organization-api/logs

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

## Performance Optimization

### Application Performance
- Connection pooling configured
- Caching implemented
- Static file serving optimized
- Compression enabled
- Keep-alive connections

### Database Performance
- Proper indexes created
- Query optimization
- Connection pooling
- Regular maintenance tasks
- Statistics updates

## Troubleshooting

### Common Issues
1. **Database Connection Issues**
   - Check network connectivity
   - Verify credentials
   - Check firewall rules

2. **Application Not Starting**
   - Check environment variables
   - Verify Node.js version
   - Check file permissions

3. **Performance Issues**
   - Monitor database connections
   - Check memory usage
   - Analyze slow queries

### Health Checks
```bash
# Check application status
curl -f http://localhost:3001/health

# Check PM2 processes
pm2 list

# Check logs
pm2 logs organization-api

# Check system resources
htop
df -h
free -m
```

## Maintenance Tasks

### Regular Maintenance
- [ ] Weekly: Update system packages
- [ ] Weekly: Review application logs
- [ ] Monthly: Database maintenance
- [ ] Monthly: Security updates
- [ ] Quarterly: Performance review
- [ ] Quarterly: Backup validation

### Security Maintenance
- [ ] Regular security scans
- [ ] SSL certificate renewal
- [ ] Dependency updates
- [ ] Access review
- [ ] Audit log review

## Support and Documentation

### Production Support
- **Monitoring**: Real-time application monitoring
- **Alerts**: Automated alerting for issues
- **Logs**: Centralized logging system
- **Documentation**: Complete deployment documentation
- **Runbooks**: Operational procedures

### Contact Information
- **Technical Support**: Available during business hours
- **Emergency Contact**: On-call support for critical issues
- **Documentation**: Updated deployment guides
- **Training**: Team training on deployment procedures

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Status**: Production Ready 