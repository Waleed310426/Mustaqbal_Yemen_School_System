const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const {
  getSettings,
  updateSettings,
  getTerms,
  createTerm,
  updateTerm,
  setCurrentTerm,
  deleteTerm,
} = require('./settings.controller');

router.get('/', auth, getSettings);
router.put('/', auth, requireRole(['admin']), updateSettings);

router.get('/terms', auth, getTerms);
router.post('/terms', auth, requireRole(['admin']), createTerm);
router.put('/terms/:id', auth, requireRole(['admin']), updateTerm);
router.patch('/terms/:id/current', auth, requireRole(['admin']), setCurrentTerm);
router.delete('/terms/:id', auth, requireRole(['admin']), deleteTerm);

module.exports = router;
