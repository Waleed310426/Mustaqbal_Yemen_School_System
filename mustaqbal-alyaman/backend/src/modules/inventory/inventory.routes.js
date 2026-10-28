const express = require('express');
const router = express.Router();
const ctrl = require('./inventory.controller');
const authMiddleware = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

router.use(authMiddleware);

// ---- الفئات ----
router.get('/categories', ctrl.getCategories);
router.post('/categories', requireRole(['admin']), ctrl.createCategory);
router.put('/categories/:id', requireRole(['admin']), ctrl.updateCategory);
router.delete('/categories/:id', requireRole(['admin']), ctrl.deleteCategory);

// ---- الأصناف ----
router.get('/items', ctrl.getItems);
router.get('/items/:id', ctrl.getItemById);
router.post('/items', requireRole(['admin']), ctrl.createItem);
router.put('/items/:id', requireRole(['admin']), ctrl.updateItem);
router.delete('/items/:id', requireRole(['admin']), ctrl.deleteItem);

// ---- الموردون ----
router.get('/suppliers', ctrl.getSuppliers);
router.post('/suppliers', requireRole(['admin']), ctrl.createSupplier);
router.put('/suppliers/:id', requireRole(['admin']), ctrl.updateSupplier);
router.delete('/suppliers/:id', requireRole(['admin']), ctrl.deleteSupplier);

// ---- أوامر المخزون ----
router.get('/orders', ctrl.getOrders);
router.post('/orders', requireRole(['admin']), ctrl.createOrder);

// ---- إحصائيات ----
router.get('/stats', ctrl.getStats);

module.exports = router;
