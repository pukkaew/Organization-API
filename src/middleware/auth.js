// Path: /src/middleware/auth.js
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// In-memory user store (ในระบบจริงควรใช้ database)
const users = {
    admin: {
        id: 1,
        username: 'admin',
        email: 'admin@organization.com',
        // Password: admin123
        password: '$2a$10$VHfrT501zIGvyQ087wYsOuni0pwQ8Vg2UV3q6r46PDnIcX1USQwj2',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'manage_users']
    },
    user: {
        id: 2,
        username: 'user',
        email: 'user@organization.com',
        // Password: user123
        password: '$2a$10$pnrkWH9Lem68SjVCRYLRGOiseYGateF9kMKkV/bpg.a5oL.22f5mG',
        role: 'user',
        permissions: ['read']
    }
};

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
        }
        
        // req.flash('error', 'Please login to continue');
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
    
    const user = getUserById(req.session.userId);
    if (!user) {
        req.session.destroy();
        return res.redirect('/login');
    }
    
    req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
    };
    
    res.locals.user = req.user;
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
    
    next();
};

// Permission middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions.includes(permission)) {
            if (req.path.startsWith('/api/')) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to access this resource'
                    }
                });
            }
            
            // req.flash('error', 'You do not have permission to access this resource');
            return res.redirect('/');
        }
        
        next();
    };
};

const requireAnyPermission = (permissions) => {
    return (req, res, next) => {
        if (!req.user || !permissions.some(p => req.user.permissions.includes(p))) {
            if (req.path.startsWith('/api/')) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to access this resource'
                    }
                });
            }
            
            // req.flash('error', 'You do not have permission to access this resource');
            return res.redirect('/');
        }
        
        next();
    };
};

const requireAllPermissions = (permissions) => {
    return (req, res, next) => {
        if (!req.user || !permissions.every(p => req.user.permissions.includes(p))) {
            if (req.path.startsWith('/api/')) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to access this resource'
                    }
                });
            }
            
            // req.flash('error', 'You do not have permission to access this resource');
            return res.redirect('/');
        }
        
        next();
    };
};

// Simple login handler
const login = (req, res) => {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Request body:', req.body);
    console.log('Username:', req.body.username);
    console.log('Password length:', req.body.password ? req.body.password.length : 0);
    
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
        console.log('ERROR: Missing username or password');
        return res.render('auth/login', {
            title: 'Login',
            error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
            success: null,
            csrfToken: req.csrfToken ? req.csrfToken() : ''
        });
    }
    
    // Check user exists
    const user = users[username.toLowerCase()];
    if (!user) {
        console.log('ERROR: User not found -', username);
        return res.render('auth/login', {
            title: 'Login',
            error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
            success: null,
            csrfToken: req.csrfToken ? req.csrfToken() : ''
        });
    }
    
    console.log('User found:', user.username);
    
    // For demo purposes, use simple password comparison
    const validPasswords = {
        'admin': 'admin123',
        'user': 'user123'
    };
    
    if (password !== validPasswords[username.toLowerCase()]) {
        console.log('ERROR: Invalid password for user -', username);
        return res.render('auth/login', {
            title: 'Login',
            error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
            success: null,
            csrfToken: req.csrfToken ? req.csrfToken() : ''
        });
    }
    
    console.log('Password valid! Setting session...');
    
    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
    };
    
    console.log('Session set:', {
        userId: req.session.userId,
        username: req.session.username
    });
    
    logger.info(`User logged in: ${username}`);
    
    // Save session before redirect
    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.render('auth/login', {
                title: 'Login',
                error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
                success: null,
                csrfToken: req.csrfToken ? req.csrfToken() : ''
            });
        }
        
        // Redirect to dashboard
        const redirectUrl = '/';
        console.log('Redirecting to:', redirectUrl);
        console.log('=== LOGIN SUCCESS ===');
        
        res.redirect(redirectUrl);
    });
};

// Logout handler
const logout = (req, res) => {
    const username = req.user?.username;
    
    req.session.destroy((err) => {
        if (err) {
            logger.error('Logout error:', err);
        } else if (username) {
            logger.info(`User logged out: ${username}`);
        }
        res.redirect('/login');
    });
};

// Show login page
const showLoginPage = (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/');
    }
    
    res.render('auth/login', {
        title: 'Login',
        error: null,
        success: null,
        csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
};

// Helper functions
function getUserById(userId) {
    return Object.values(users).find(user => user.id === userId);
}

const storeReturnTo = (req, res, next) => {
    if (!req.session.userId && req.method === 'GET' && 
        !req.path.includes('/login') && 
        !req.path.includes('/api/') &&
        !req.path.includes('.')) {
        req.session.returnTo = req.originalUrl;
    }
    next();
};

const optionalAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        const user = getUserById(req.session.userId);
        if (user) {
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            };
            res.locals.user = req.user;
        }
    }
    
    res.locals.user = req.user || null;
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
    next();
};

async function generatePasswordHash(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

module.exports = {
    requireAuth,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    login,
    logout,
    showLoginPage,
    storeReturnTo,
    optionalAuth,
    generatePasswordHash
};