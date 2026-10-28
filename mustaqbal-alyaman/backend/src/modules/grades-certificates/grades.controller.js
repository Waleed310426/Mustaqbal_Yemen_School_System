const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Grade, Certificate } = require('./grades.model');
const { Student } = require('../students-classes/students.model');
const { Subject } = require('../teachers-subjects-schedule/teachers.model');
const User = require('../auth/user.model');

// =================== GRADES ===================

const getGrades = async (req, res, next) => {
  try {
    let { student_id, subject_id, term_id } = req.query;
    const where = {};
    if (req.user.role === 'student') {
      const studentRec = await Student.findOne({ where: { user_id: req.user.id } });
      if (studentRec) where.student_id = studentRec.id;
    } else if (student_id) {
      where.student_id = student_id;
    }
    if (subject_id) where.subject_id = subject_id;
    if (term_id) where.term_id = term_id;

    const grades = await Grade.findAll({
      where,
      include: [
        { model: Subject, as: 'subject' },
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name'] }] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: grades });
  } catch (err) { next(err); }
};

const createGrade = async (req, res, next) => {
  try {
    const { student_id, subject_id, term_id, exam_type, score, max_score, notes } = req.body;
    if (!student_id || !subject_id || !exam_type || score === undefined) {
      return res.status(400).json({ success: false, error: 'بيانات الدرجة غير مكتملة.' });
    }
    const grade = await Grade.create({
      student_id, subject_id, term_id, exam_type, score, max_score, notes,
      entered_by: req.user.id,
    });
    res.status(201).json({ success: true, data: grade });
  } catch (err) { next(err); }
};

const updateGrade = async (req, res, next) => {
  try {
    const grade = await Grade.findByPk(req.params.id);
    if (!grade) return res.status(404).json({ success: false, error: 'الدرجة غير موجودة.' });
    await grade.update(req.body);
    res.json({ success: true, data: grade });
  } catch (err) { next(err); }
};

const deleteGrade = async (req, res, next) => {
  try {
    const grade = await Grade.findByPk(req.params.id);
    if (!grade) return res.status(404).json({ success: false, error: 'الدرجة غير موجودة.' });
    await grade.destroy();
    res.json({ success: true, data: { message: 'تم حذف الدرجة.' } });
  } catch (err) { next(err); }
};

/**
 * GET /api/grades/sheet?student_id=&term_id=
 * كشف درجات طالب كامل مع المعدل
 */
const getGradeSheet = async (req, res, next) => {
  try {
    let { student_id, term_id } = req.query;
    if (req.user.role === 'student') {
      const studentRec = await Student.findOne({ where: { user_id: req.user.id } });
      if (studentRec) student_id = studentRec.id;
    }
    if (!student_id) {
      return res.status(400).json({ success: false, error: 'يرجى اختيار طالب لعرض كشف الدرجات.' });
    }

    const { Class } = require('../students-classes/students.model');
    const student = await Student.findByPk(student_id, {
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'] },
        { model: Class, as: 'class' },
      ],
    });

    const where = { student_id };
    if (term_id) where.term_id = term_id;

    const grades = await Grade.findAll({
      where,
      include: [{ model: Subject, as: 'subject' }],
      order: [['created_at', 'ASC']],
    });

    // تجميع الدرجات حسب المادة
    const bySubject = {};
    for (const g of grades) {
      const subName = g.subject?.name || 'مادة عامة';
      if (!bySubject[subName]) bySubject[subName] = { subject: g.subject, grades: [] };
      bySubject[subName].grades.push(g);
    }

    // حساب المعدل
    let totalScore = 0, totalMax = 0;
    Object.values(bySubject).forEach(s => {
      s.grades.forEach(g => {
        totalScore += parseFloat(g.score);
        totalMax += parseFloat(g.max_score);
      });
    });

    const average = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        student: student ? {
          id: student.id,
          name: student.user?.name,
          email: student.user?.email,
          class: student.class ? `${student.class.grade_level} - ${student.class.section}` : 'غير محدد',
        } : null,
        bySubject: Object.values(bySubject),
        average,
        totalScore,
        totalMax,
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/grades/sheet/pdf?student_id=&term_id=
 * استخراج وتنزيل كشف الدرجات كملف PDF رسمي
 */
const getGradeSheetPdf = async (req, res, next) => {
  try {
    let { student_id, term_id } = req.query;
    if (req.user.role === 'student') {
      const studentRec = await Student.findOne({ where: { user_id: req.user.id } });
      if (studentRec) student_id = studentRec.id;
    }
    if (!student_id) {
      return res.status(400).json({ success: false, error: 'يرجى اختيار طالب لاستخراج كشف الدرجات.' });
    }

    const { Class } = require('../students-classes/students.model');
    const { SchoolSetting, Term } = require('../settings/settings.model');

    const [student, settings, term] = await Promise.all([
      Student.findByPk(student_id, {
        include: [
          { model: User, as: 'user', attributes: ['name', 'email'] },
          { model: Class, as: 'class' },
        ],
      }),
      SchoolSetting.findOne(),
      term_id ? Term.findByPk(term_id) : Term.findOne({ where: { is_current: true } }),
    ]);

    if (!student) {
      return res.status(404).json({ success: false, error: 'الطالب غير موجود.' });
    }

    const where = { student_id };
    if (term_id) where.term_id = term_id;

    const grades = await Grade.findAll({
      where,
      include: [{ model: Subject, as: 'subject' }],
      order: [['created_at', 'ASC']],
    });

    // تجميع الدرجات حسب المادة
    const bySubject = {};
    for (const g of grades) {
      const subName = g.subject?.name || 'مادة عامة';
      if (!bySubject[subName]) bySubject[subName] = { subject: g.subject, grades: [] };
      bySubject[subName].grades.push(g);
    }

    let totalScore = 0, totalMax = 0;
    Object.values(bySubject).forEach(s => {
      s.grades.forEach(g => {
        totalScore += parseFloat(g.score);
        totalMax += parseFloat(g.max_score);
      });
    });

    const average = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : '0';
    const numAvg = parseFloat(average);
    let appraisal = 'مقبول';
    if (numAvg >= 90) appraisal = 'ممتاز (تفوق عام)';
    else if (numAvg >= 80) appraisal = 'جيد جداً';
    else if (numAvg >= 65) appraisal = 'جيد';
    else if (numAvg < 50) appraisal = 'يحتاج دعم وتقوية';

    // إنشاء مستند PDF
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="gradesheet_${student_id}.pdf"`);
    doc.pipe(res);

    const fontPath = fs.existsSync('C:/Windows/Fonts/arial.ttf')
      ? 'C:/Windows/Fonts/arial.ttf'
      : (fs.existsSync('C:/Windows/Fonts/tahoma.ttf') ? 'C:/Windows/Fonts/tahoma.ttf' : null);
    if (fontPath) doc.font(fontPath);

    const schoolName = settings?.school_name || 'مدرسة مستقبل اليمن الأهلية';
    const termName = term?.name || 'الفصل الدراسي الأول';
    const academicYear = term?.academic_year || '2025-2026';

    // إطار الصفحة
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(2).stroke('#1e3a8a');
    doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).lineWidth(0.8).stroke('#cbd5e1');

    // ترويسة التقرير
    doc.fillColor('#1e3a8a').fontSize(22).text(schoolName, { align: 'center' });
    doc.fillColor('#64748b').fontSize(11).text('الجمهورية اليمنية — إدارة الاختبارات والكنترول المدرسي', { align: 'center' });
    doc.fillColor('#d97706').fontSize(16).text('كشف نتائج دراسي رسمي', { align: 'center' }).moveDown(0.5);

    // بطاقة معلومات الطالب
    const startY = 120;
    doc.rect(40, startY, doc.page.width - 80, 75).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#1e293b').fontSize(12);

    const studentName = student.user?.name || 'الطالب';
    const className = student.class ? `${student.class.grade_level} - ${student.class.section}` : 'غير محدد';
    const issueDate = new Date().toLocaleDateString('ar-YE');

    doc.text(`اسم الطالب: ${studentName}`, 55, startY + 14);
    doc.text(`الصف والشعبة: ${className}`, 320, startY + 14);
    doc.text(`العام الدراسي: ${academicYear} (${termName})`, 55, startY + 42);
    doc.text(`تاريخ الإصدار: ${issueDate}`, 320, startY + 42);

    // جدول كشف المواد
    let tableY = startY + 95;
    doc.rect(40, tableY, doc.page.width - 80, 28).fill('#1e3a8a');
    doc.fillColor('#ffffff').fontSize(11);
    doc.text('المادة الدراسية', 55, tableY + 8);
    doc.text('مجموع الدرجة', 300, tableY + 8);
    doc.text('الدرجة العظمى', 390, tableY + 8);
    doc.text('النسبة %', 480, tableY + 8);

    tableY += 28;
    const subjectsList = Object.values(bySubject);

    if (subjectsList.length === 0) {
      doc.rect(40, tableY, doc.page.width - 80, 40).fillAndStroke('#ffffff', '#e2e8f0');
      doc.fillColor('#64748b').fontSize(11).text('لا توجد تقييمات مرصودة لهذا الطالب حتى الآن.', 60, tableY + 14);
      tableY += 40;
    } else {
      subjectsList.forEach((item, idx) => {
        const subScore = item.grades.reduce((s, g) => s + parseFloat(g.score), 0);
        const subMax = item.grades.reduce((s, g) => s + parseFloat(g.max_score), 0);
        const pct = subMax > 0 ? ((subScore / subMax) * 100).toFixed(1) : 0;
        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

        doc.rect(40, tableY, doc.page.width - 80, 24).fillAndStroke(rowBg, '#e2e8f0');
        doc.fillColor('#1e293b').fontSize(10);
        doc.text(item.subject?.name || 'مادة عامة', 55, tableY + 6);
        doc.text(String(subScore), 315, tableY + 6);
        doc.text(String(subMax), 405, tableY + 6);
        doc.text(`${pct}%`, 490, tableY + 6);
        tableY += 24;
      });
    }

    // سطر المجموع الكلي والمعدل
    doc.rect(40, tableY, doc.page.width - 80, 32).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.fillColor('#1e3a8a').fontSize(12);
    doc.text(`المجموع الكلي: ${totalScore} / ${totalMax}`, 55, tableY + 10);
    doc.text(`المعدل العام: ${average}%  —  التقدير: ${appraisal}`, 280, tableY + 10);

    // سطر التوقيعات والختم
    const signY = doc.page.height - 110;
    doc.fillColor('#475569').fontSize(11);
    doc.text('رئيس الكنترول: ________________', 55, signY);
    doc.text('ختم المدرسة الرسمي', 250, signY);
    doc.text('مدير المدرسة: ________________', 390, signY);

    doc.end();
  } catch (err) { next(err); }
};

// =================== CERTIFICATES ===================

const getCertificates = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'student') {
      const studentRec = await Student.findOne({ where: { user_id: req.user.id } });
      if (studentRec) where.student_id = studentRec.id;
    } else if (req.query.student_id) {
      where.student_id = req.query.student_id;
    }
    const certs = await Certificate.findAll({
      where,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: certs });
  } catch (err) { next(err); }
};

const issueCertificate = async (req, res, next) => {
  try {
    const { student_id, term_id, type, title } = req.body;

    // الحصول على بيانات الطالب
    const student = await Student.findByPk(student_id, {
      include: [{ model: User, as: 'user', attributes: ['name'] }],
    });
    if (!student) return res.status(404).json({ success: false, error: 'الطالب غير موجود.' });

    // التأكد من وجود مجلد uploads
    const uploadsDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // توليد PDF
    const fileName = `certificate_${student_id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // تصميم الشهادة المدرسية الرسمية
    const fontPath = fs.existsSync('C:/Windows/Fonts/arial.ttf')
      ? 'C:/Windows/Fonts/arial.ttf'
      : (fs.existsSync('C:/Windows/Fonts/tahoma.ttf') ? 'C:/Windows/Fonts/tahoma.ttf' : null);

    if (fontPath) {
      doc.font(fontPath);
    }

    // خلفية وإطار ذهبي / أزرق ملكي
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(4).stroke('#1e3a8a');
    doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56).lineWidth(1.5).stroke('#d97706');

    doc.fillColor('#1e3a8a').fontSize(32).text('مدرسة مستقبل اليمن الأهلية الحديثة', { align: 'center' }).moveDown(0.3);
    doc.fillColor('#64748b').fontSize(14).text('الجمهورية اليمنية — وزارة التربية والتعليم', { align: 'center' }).moveDown(1.2);

    doc.fillColor('#b45309').fontSize(26).text(`★ ${title || 'شهادة تفوق وتقدير'} ★`, { align: 'center' }).moveDown(1);

    const studentName = student.user?.name || 'الطالب';
    doc.fillColor('#1e293b').fontSize(18).text(`تسر إدارة المدرسة أن تمنح هذه الشهادة للطالب / ـة:`, { align: 'center' }).moveDown(0.4);
    doc.fillColor('#1e3a8a').fontSize(24).text(`${studentName}`, { align: 'center' }).moveDown(0.6);

    doc.fillColor('#334155').fontSize(16).text('تقديراً لجهوده المتميزة وتفوقه الأكاديمي وسلوكه النموذجي خلال العام الدراسي.', { align: 'center' }).moveDown(1.5);

    // سطر التوقيعات
    const dateStr = `التاريخ: ${new Date().toLocaleDateString('ar-YE')}`;
    doc.fillColor('#475569').fontSize(12).text(dateStr, 60, doc.page.height - 90);
    doc.text('مدير المدرسة: __________________', doc.page.width - 250, doc.page.height - 90);
    doc.text('ختم المدرسة الرسمي', { align: 'center' });

    doc.end();

    await new Promise((resolve) => stream.on('finish', resolve));

    const cert = await Certificate.create({
      student_id,
      term_id,
      type: type || 'completion',
      title: title || 'شهادة إتمام',
      file_url: `/uploads/${fileName}`,
      issued_by: req.user.id,
    });

    res.status(201).json({ success: true, data: cert });
  } catch (err) { next(err); }
};

const deleteCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findByPk(req.params.id);
    if (!cert) return res.status(404).json({ success: false, error: 'الشهادة غير موجودة.' });
    if (cert.file_url) {
      const filePath = path.join(__dirname, '../../..', cert.file_url);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to unlink file:', e); }
      }
    }
    await cert.destroy();
    res.json({ success: true, data: { message: 'تم حذف الشهادة بنجاح.' } });
  } catch (err) { next(err); }
};

module.exports = {
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradeSheet,
  getGradeSheetPdf,
  getCertificates,
  issueCertificate,
  deleteCertificate,
};
