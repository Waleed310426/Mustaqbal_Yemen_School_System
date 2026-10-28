const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const { getNotifications, markAsRead, markAllRead, sendBroadcast, getDashboardStats } = require('./dashboard.controller');

router.get('/stats', auth, getDashboardStats);
router.get('/notifications', auth, getNotifications);
router.patch('/notifications/:id/read', auth, markAsRead);
router.patch('/notifications/read-all', auth, markAllRead);
router.post('/notifications/broadcast', auth, requireRole(['admin', 'teacher']), sendBroadcast);

module.exports = router;
