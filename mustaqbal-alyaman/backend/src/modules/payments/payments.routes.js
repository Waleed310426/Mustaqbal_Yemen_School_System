const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const { getFeeStructures, createFeeStructure, updateFeeStructure, getPayments, createPayment, updatePayment, deletePayment, getFinancialReport } = require('./payments.controller');

router.get('/fee-structures', auth, getFeeStructures);
router.post('/fee-structures', auth, requireRole(['admin']), createFeeStructure);
router.put('/fee-structures/:id', auth, requireRole(['admin']), updateFeeStructure);

router.get('/', auth, requireRole(['admin']), getPayments);
router.post('/', auth, requireRole(['admin']), createPayment);
router.put('/:id', auth, requireRole(['admin']), updatePayment);
router.delete('/:id', auth, requireRole(['admin']), deletePayment);
router.get('/report', auth, requireRole(['admin']), getFinancialReport);

module.exports = router;
