const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const {
  getClasses, createClass, updateClass, deleteClass,
  getStudents, getStudentById, createStudent, updateStudent, deleteStudent, transferStudent,
  getUsers, createUser, updateUserStatus,
} = require('./students.controller');

// === Classes ===
router.get('/classes', auth, getClasses);
router.post('/classes', auth, requireRole(['admin']), createClass);
router.put('/classes/:id', auth, requireRole(['admin']), updateClass);
router.delete('/classes/:id', auth, requireRole(['admin']), deleteClass);

// === Students ===
router.get('/students', auth, requireRole(['admin', 'teacher']), getStudents);
router.get('/students/:id', auth, getStudentById);
router.post('/students', auth, requireRole(['admin']), createStudent);
router.put('/students/:id', auth, requireRole(['admin']), updateStudent);
router.delete('/students/:id', auth, requireRole(['admin']), deleteStudent);
router.patch('/students/:id/transfer', auth, requireRole(['admin']), transferStudent);

// === Users (Admin) ===
router.get('/users', auth, requireRole(['admin']), getUsers);
router.post('/users', auth, requireRole(['admin']), createUser);
router.patch('/users/:id/status', auth, requireRole(['admin']), updateUserStatus);

module.exports = router;
