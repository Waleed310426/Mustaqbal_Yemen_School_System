const express = require('express');
const router = express.Router();
const ctrl = require('./exams.controller');
const authMiddleware = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

router.use(authMiddleware);

// ---- قاعات الامتحانات ----
router.get('/halls', ctrl.getHalls);
router.post('/halls', requireRole(['admin']), ctrl.createHall);
router.put('/halls/:id', requireRole(['admin']), ctrl.updateHall);
router.delete('/halls/:id', requireRole(['admin']), ctrl.deleteHall);

// ---- أرقام الجلوس ----
router.get('/seats', ctrl.getSeatNumbers);
router.post('/seats/generate', requireRole(['admin']), ctrl.generateSeatNumbers);
router.put('/seats/:id', requireRole(['admin']), ctrl.updateSeat);
router.delete('/seats/:id', requireRole(['admin']), ctrl.deleteSeat);

// ---- جدول الامتحانات ----
router.get('/schedule', ctrl.getExamSchedule);
router.post('/schedule', requireRole(['admin']), ctrl.createExam);
router.put('/schedule/:id', requireRole(['admin']), ctrl.updateExam);
router.delete('/schedule/:id', requireRole(['admin']), ctrl.deleteExam);

// ---- كشف المناداة ----
router.get('/attendance-sheet', ctrl.getAttendanceSheet);

module.exports = router;
