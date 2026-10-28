const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const {
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradeSheet,
  getGradeSheetPdf,
  getCertificates,
  issueCertificate,
  deleteCertificate,
} = require('./grades.controller');

router.get('/', auth, getGrades);
router.post('/', auth, requireRole(['teacher', 'admin']), createGrade);
router.put('/:id', auth, requireRole(['teacher', 'admin']), updateGrade);
router.delete('/:id', auth, requireRole(['admin']), deleteGrade);
router.get('/sheet', auth, getGradeSheet);
router.get('/sheet/pdf', auth, getGradeSheetPdf);

router.get('/certificates', auth, getCertificates);
router.post('/certificates', auth, requireRole(['admin']), issueCertificate);
router.delete('/certificates/:id', auth, requireRole(['admin']), deleteCertificate);

module.exports = router;
