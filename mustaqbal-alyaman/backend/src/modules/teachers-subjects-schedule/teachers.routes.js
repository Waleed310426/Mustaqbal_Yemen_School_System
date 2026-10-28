const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const {
  getTeachers, createTeacher, updateTeacher, deleteTeacher,
  getSubjects, createSubject, updateSubject, deleteSubject,
  assignTeacherSubject, removeTeacherSubject,
  getPeriods,
  getScheduleByClass, createScheduleEntry, deleteScheduleEntry,
} = require('./teachers.controller');

// Teachers
router.get('/teachers', auth, requireRole(['admin']), getTeachers);
router.post('/teachers', auth, requireRole(['admin']), createTeacher);
router.put('/teachers/:id', auth, requireRole(['admin']), updateTeacher);
router.delete('/teachers/:id', auth, requireRole(['admin']), deleteTeacher);

// Subjects
router.get('/subjects', auth, getSubjects);
router.post('/subjects', auth, requireRole(['admin']), createSubject);
router.put('/subjects/:id', auth, requireRole(['admin']), updateSubject);
router.delete('/subjects/:id', auth, requireRole(['admin']), deleteSubject);

// Teacher-Subject assignments
router.post('/teacher-subjects', auth, requireRole(['admin']), assignTeacherSubject);
router.delete('/teacher-subjects/:id', auth, requireRole(['admin']), removeTeacherSubject);

// Periods
router.get('/periods', auth, getPeriods);

// Schedule
router.get('/schedule', auth, getScheduleByClass);
router.post('/schedule', auth, requireRole(['admin']), createScheduleEntry);
router.delete('/schedule/:id', auth, requireRole(['admin']), deleteScheduleEntry);

module.exports = router;
