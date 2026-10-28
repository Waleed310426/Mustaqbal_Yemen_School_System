const express = require('express');
const router = express.Router();
const ctrl = require('./activities.controller');
const authMiddleware = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

router.use(authMiddleware);

// ---- أنواع الأنشطة ----
router.get('/types', ctrl.getTypes);
router.post('/types', requireRole(['admin']), ctrl.createType);
router.put('/types/:id', requireRole(['admin']), ctrl.updateType);
router.delete('/types/:id', requireRole(['admin']), ctrl.deleteType);

// ---- الأنشطة ----
router.get('/', ctrl.getActivities);
router.get('/:id', ctrl.getActivityById);
router.post('/', requireRole(['admin']), ctrl.createActivity);
router.put('/:id', requireRole(['admin']), ctrl.updateActivity);
router.delete('/:id', requireRole(['admin']), ctrl.deleteActivity);

// ---- المشاركون ----
router.get('/:activity_id/participants', ctrl.getParticipants);
router.post('/:activity_id/participants', requireRole(['admin']), ctrl.addParticipant);
router.put('/participants/:id', requireRole(['admin']), ctrl.updateParticipant);
router.delete('/participants/:id', requireRole(['admin']), ctrl.removeParticipant);

module.exports = router;
