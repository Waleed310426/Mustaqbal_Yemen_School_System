const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const { createAttendance, updateAttendance, deleteAttendance, getAttendance, getAttendanceReport } = require('./attendance.controller');

router.post('/', auth, requireRole(['teacher', 'admin']), createAttendance);
router.put('/:id', auth, requireRole(['admin']), updateAttendance);
router.delete('/:id', auth, requireRole(['admin']), deleteAttendance);
router.get('/', auth, requireRole(['teacher', 'admin']), getAttendance);
router.get('/report', auth, getAttendanceReport);

module.exports = router;
