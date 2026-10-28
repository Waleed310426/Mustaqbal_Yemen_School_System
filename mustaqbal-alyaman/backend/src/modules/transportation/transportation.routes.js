const express = require('express');
const router = express.Router();
const ctrl = require('./transportation.controller');
const authMiddleware = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

router.use(authMiddleware);

// ---- خطوط السير ----
router.get('/routes', ctrl.getRoutes);
router.post('/routes', requireRole(['admin']), ctrl.createRoute);
router.put('/routes/:id', requireRole(['admin']), ctrl.updateRoute);
router.delete('/routes/:id', requireRole(['admin']), ctrl.deleteRoute);

// ---- الحافلات ----
router.get('/buses', ctrl.getBuses);
router.post('/buses', requireRole(['admin']), ctrl.createBus);
router.put('/buses/:id', requireRole(['admin']), ctrl.updateBus);
router.delete('/buses/:id', requireRole(['admin']), ctrl.deleteBus);

// ---- الاشتراكات ----
router.get('/subscriptions', ctrl.getSubscriptions);
router.post('/subscriptions', requireRole(['admin']), ctrl.createSubscription);
router.put('/subscriptions/:id', requireRole(['admin']), ctrl.updateSubscription);
router.delete('/subscriptions/:id', requireRole(['admin']), ctrl.deleteSubscription);

// ---- إحصائيات ----
router.get('/stats', ctrl.getStats);

module.exports = router;
