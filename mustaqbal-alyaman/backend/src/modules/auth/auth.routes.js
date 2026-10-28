const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, resetPassword } = require('./auth.controller');
const authMiddleware = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
router.get('/me', authMiddleware, getMe);

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, changePassword);

// POST /api/auth/reset-password (Admin only)
router.post('/reset-password', authMiddleware, requireRole(['admin']), resetPassword);

module.exports = router;
