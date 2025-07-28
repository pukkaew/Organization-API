const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const ApiKey = require('../models/ApiKey');

// Login endpoint for API authentication
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // Simple authentication (in production, use proper user authentication)
        if (username === 'admin' && password === 'admin123') {
            // Generate JWT token
            const token = jwt.sign(
                { 
                    username, 
                    type: 'user',
                    permissions: ['read', 'write']
                },
                process.env.JWT_SECRET || 'default-jwt-secret-key',
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                token,
                user: {
                    username,
                    permissions: ['read', 'write']
                }
            });
        }

        // Invalid credentials
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid username or password'
            }
        });

    } catch (error) {
        console.error('API Login error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Authentication failed'
            }
        });
    }
});

// Get current user info
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'NO_TOKEN',
                message: 'No authentication token provided'
            }
        });
    }

    try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-jwt-secret-key');
        
        res.json({
            success: true,
            user: {
                username: decoded.username,
                type: decoded.type,
                permissions: decoded.permissions
            }
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token'
            }
        });
    }
});

// Generate API key
router.post('/generate-key', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'NO_TOKEN',
                message: 'No authentication token provided'
            }
        });
    }

    try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-jwt-secret-key');
        
        if (!decoded.permissions.includes('write')) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to generate API keys'
                }
            });
        }

        const { key_name, description, permissions = ['read'] } = req.body;

        if (!key_name) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_KEY_NAME',
                    message: 'API key name is required'
                }
            });
        }

        // Generate API key
        const apiKey = await ApiKey.create({
            key_name,
            description,
            permissions,
            created_by: decoded.username
        });

        res.status(201).json({
            success: true,
            data: {
                id: apiKey.id,
                key_name: apiKey.key_name,
                api_key: apiKey.api_key,
                permissions: apiKey.permissions,
                created_at: apiKey.created_at
            },
            message: 'API key generated successfully. Please save the api_key as it will not be shown again.'
        });

    } catch (error) {
        console.error('Generate API key error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'KEY_GENERATION_ERROR',
                message: 'Failed to generate API key'
            }
        });
    }
});

module.exports = router;