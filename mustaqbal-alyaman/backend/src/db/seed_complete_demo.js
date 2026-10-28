require('dotenv').config();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const sequelize = require('../config/db');
const setupAssociations = require('./associations');

setupAssociations();

const User = require('../modules/auth/user.model');
const { Student, Class, Parent, StudentParent } = require('../modules/students-classes/students.model');
const { Teacher, Subject, TeacherSubject, Period, Schedule } = require('../modules/teachers-subjects-schedule/teachers.model');
const { Grade, Certificate } = require('../modules/grades-certificates/grades.model');
const Attendance = require('../modules/attendance/attendance.model');
const { Payment, FeeStructure } = require('../modules/payments/payments.model');
const { SchoolSetting, Term } = require('../modules/settings/settings.model');

async function seedCompleteData() {
  console.log('🌱 بدء غرس البيانات التجريبية الشاملة...');

  // 1. التأكد من وجود مجلد uploads
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 2. التحقق من المستخدمين والكيانات
  const adminUser = await User.findOne({ where: { role: 'admin' } });
  const teacher1 = await Teacher.findOne({ where: { id: 1 } });
  const teacher2 = await Teacher.findOne({ where: { id: 2 } });
  const student1 = await Student.findOne({ where: { id: 1 } });
  const student2 = await Student.findOne({ where: { id: 2 } });
  const term1 = await Term.findOne({ where: { is_current: true } }) || await Term.findOne();

  const termId = term1 ? term1.id : 1;

  // 3. التأكد من وجود المواد الأساسية
  const [subMath] = await Subject.findOrCreate({ where: { name: 'الرياضيات' } });
  const [subArabic] = await Subject.findOrCreate({ where: { name: 'اللغة العربية' } });
  const [subScience] = await Subject.findOrCreate({ where: { name: 'العلوم' } });
  const [subIslamic] = await Subject.findOrCreate({ where: { name: 'التربية الإسلامية' } });

  // 4. جدول الحصص الأسبوعي (Schedule)
  console.log('📅 إعداد الجداول الدراسية الأسبوعية...');
  await Schedule.destroy({ where: {} }); // تنظيف الجدول أولاً لتجنب التكرار

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const scheduleRows = [];

  // الصف السابع - أ (class_id: 1)
  days.forEach(day => {
    // الحصة الأولى (07:30 - 08:15)
    scheduleRows.push({
      class_id: 1,
      subject_id: day === 'monday' || day === 'wednesday' ? subArabic.id : subMath.id,
      teacher_id: day === 'monday' || day === 'wednesday' ? 2 : 1,
      period_id: 1,
      day,
      term_id: termId,
    });

    // الحصة الثانية (08:20 - 09:05)
    scheduleRows.push({
      class_id: 1,
      subject_id: day === 'monday' || day === 'wednesday' ? subMath.id : subArabic.id,
      teacher_id: day === 'monday' || day === 'wednesday' ? 1 : 2,
      period_id: 2,
      day,
      term_id: termId,
    });

    // الحصة الثالثة (09:10 - 09:55)
    scheduleRows.push({
      class_id: 1,
      subject_id: subScience.id,
      teacher_id: 1,
      period_id: 3,
      day,
      term_id: termId,
    });

    // الحصة الرابعة (10:10 - 10:55)
    scheduleRows.push({
      class_id: 1,
      subject_id: subIslamic.id,
      teacher_id: 2,
      period_id: 4,
      day,
      term_id: termId,
    });

    // الصف السابع - ب (class_id: 2) لحصص المعلم الأخرى
    scheduleRows.push({
      class_id: 2,
      subject_id: subMath.id,
      teacher_id: 1,
      period_id: 4,
      day,
      term_id: termId,
    });
    scheduleRows.push({
      class_id: 2,
      subject_id: subArabic.id,
      teacher_id: 2,
      period_id: 3,
      day,
      term_id: termId,
    });
  });

  await Schedule.bulkCreate(scheduleRows);
  console.log(`✅ تم إنشاء ${scheduleRows.length} حصة دراسية أسبوعية`);

  // 5. درجات الطلاب (Grades)
  console.log('📝 رصد درجات الطلاب...');
  await Grade.destroy({ where: {} });

  const gradeItems = [
    // درجات الطالب 1 (محمد سالم)
    { student_id: 1, subject_id: subMath.id, exam_type: 'monthly', score: 28, max_score: 30, notes: 'اختبار شهر أول ممتاز' },
    { student_id: 1, subject_id: subMath.id, exam_type: 'midterm', score: 38, max_score: 40, notes: 'امتحان نصف فصلي' },
    { student_id: 1, subject_id: subMath.id, exam_type: 'homework', score: 15, max_score: 15, notes: 'واجبات كاملة' },
    { student_id: 1, subject_id: subMath.id, exam_type: 'participation', score: 15, max_score: 15, notes: 'مشاركة صفية متألقة' },

    { student_id: 1, subject_id: subArabic.id, exam_type: 'monthly', score: 27, max_score: 30, notes: 'اختبار شهري' },
    { student_id: 1, subject_id: subArabic.id, exam_type: 'midterm', score: 37, max_score: 40, notes: 'نصف فصلي' },
    { student_id: 1, subject_id: subArabic.id, exam_type: 'homework', score: 14, max_score: 15, notes: 'مواظب على الواجبات' },
    { student_id: 1, subject_id: subArabic.id, exam_type: 'participation', score: 14, max_score: 15, notes: 'مشاركة وتفاعل' },

    { student_id: 1, subject_id: subScience.id, exam_type: 'monthly', score: 29, max_score: 30, notes: 'اختبار العلوم' },
    { student_id: 1, subject_id: subScience.id, exam_type: 'midterm', score: 39, max_score: 40, notes: 'امتحان نصف فصلي' },
    { student_id: 1, subject_id: subScience.id, exam_type: 'homework', score: 15, max_score: 15, notes: 'تطبيق عملي ممتاز' },
    { student_id: 1, subject_id: subScience.id, exam_type: 'participation', score: 15, max_score: 15, notes: 'نشاط صفي' },

    { student_id: 1, subject_id: subIslamic.id, exam_type: 'monthly', score: 30, max_score: 30, notes: 'حفظ ممتاز' },
    { student_id: 1, subject_id: subIslamic.id, exam_type: 'midterm', score: 40, max_score: 40, notes: 'امتحان نصف فصلي' },
    { student_id: 1, subject_id: subIslamic.id, exam_type: 'homework', score: 15, max_score: 15, notes: 'واجبات' },
    { student_id: 1, subject_id: subIslamic.id, exam_type: 'participation', score: 15, max_score: 15, notes: 'مشاركة' },

    // درجات الطالبة 2 (نور أحمد)
    { student_id: 2, subject_id: subMath.id, exam_type: 'monthly', score: 29, max_score: 30, notes: 'ممتازة' },
    { student_id: 2, subject_id: subMath.id, exam_type: 'midterm', score: 39, max_score: 40, notes: 'ممتازة' },
    { student_id: 2, subject_id: subMath.id, exam_type: 'homework', score: 15, max_score: 15, notes: 'واجبات' },
    { student_id: 2, subject_id: subMath.id, exam_type: 'participation', score: 15, max_score: 15, notes: 'مشاركة' },

    { student_id: 2, subject_id: subArabic.id, exam_type: 'monthly', score: 30, max_score: 30, notes: 'إنشاء وبلاغة ممتازة' },
    { student_id: 2, subject_id: subArabic.id, exam_type: 'midterm', score: 40, max_score: 40, notes: 'الدرجة الكاملة' },
    { student_id: 2, subject_id: subArabic.id, exam_type: 'homework', score: 15, max_score: 15, notes: 'واجبات' },
    { student_id: 2, subject_id: subArabic.id, exam_type: 'participation', score: 15, max_score: 15, notes: 'مشاركة' },
  ];

  await Grade.bulkCreate(gradeItems.map(g => ({
    ...g,
    term_id: termId,
    entered_by: adminUser ? adminUser.id : 1,
  })));
  console.log(`✅ تم رصد ${gradeItems.length} درجة دراسية بنجاح`);

  // 6. سجلات الحضور والغياب (Attendance)
  console.log('📋 تسجيل الحضور والغياب...');
  await Attendance.destroy({ where: {} });

  const attRecords = [];
  const today = new Date();

  for (let i = 20; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    // استثناء الجمعة والسبت
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) continue;

    const dateStr = d.toISOString().split('T')[0];

    // الطالب 1: غائب يوم واحد فقط قبل 10 أيام
    const s1Status = (i === 10) ? 'absent' : (i === 4 ? 'late' : 'present');
    const s1Notes = (i === 10) ? 'إجازة مرضية معتمدة' : (i === 4 ? 'تأخر عن الطابور الصباحي 10 دقائق' : null);

    attRecords.push({
      student_id: 1,
      period_id: 1,
      date: dateStr,
      status: s1Status,
      notes: s1Notes,
      recorded_by: 2, // الأستاذ أحمد
    });

    // الطالب 2: حضور دائم
    attRecords.push({
      student_id: 2,
      period_id: 1,
      date: dateStr,
      status: 'present',
      notes: null,
      recorded_by: 2,
    });
  }

  await Attendance.bulkCreate(attRecords);
  console.log(`✅ تم تسجيل ${attRecords.length} سجل حضور وغياب`);

  // 7. المدفوعات والرسوم (Payments)
  console.log('💳 تسجيل الرسوم والمدفوعات...');
  await Payment.destroy({ where: {} });

  const paymentsData = [
    {
      student_id: 1,
      amount: 120000,
      paid_date: '2025-09-10',
      due_date: '2025-09-15',
      payment_method: 'cash',
      status: 'paid',
      notes: 'القسط الدراسي الأول - العام 2025-2026',
    },
    {
      student_id: 1,
      amount: 30000,
      paid_date: '2025-09-15',
      due_date: '2025-09-20',
      payment_method: 'cash',
      status: 'paid',
      notes: 'رسوم خدمة باص المدرسة (الفصل الأول)',
    },
    {
      student_id: 1,
      amount: 50000,
      paid_date: null,
      due_date: '2026-02-15',
      payment_method: 'cash',
      status: 'pending',
      notes: 'القسط الدراسي الثاني - مستحق في بداية الفصل الثاني',
    },
    {
      student_id: 2,
      amount: 150000,
      paid_date: '2025-09-08',
      due_date: '2025-09-10',
      payment_method: 'cash',
      status: 'paid',
      notes: 'الرسوم الدراسية كاملة مسددة',
    },
  ];

  await Payment.bulkCreate(paymentsData);
  console.log(`✅ تم تسجيل ${paymentsData.length} سجل مدفوعات`);

  // 8. الشهادات المدرسية المعتمدة وتوليد PDF فعلي
  console.log('🏆 إصدار الشهادات المدرسية وتوليد PDF...');
  await Certificate.destroy({ where: {} });

  const certFileName1 = `cert_student1_honor.pdf`;
  const certFilePath1 = path.join(uploadsDir, certFileName1);

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
  const stream = fs.createWriteStream(certFilePath1);
  doc.pipe(stream);

  const fontPath = fs.existsSync('C:/Windows/Fonts/arial.ttf')
    ? 'C:/Windows/Fonts/arial.ttf'
    : (fs.existsSync('C:/Windows/Fonts/tahoma.ttf') ? 'C:/Windows/Fonts/tahoma.ttf' : null);
  if (fontPath) doc.font(fontPath);

  // رسم الشهادة
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(4).stroke('#1e3a8a');
  doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56).lineWidth(1.5).stroke('#d97706');

  doc.fillColor('#1e3a8a').fontSize(30).text('مدرسة مستقبل اليمن الأهلية الحديثة', { align: 'center' }).moveDown(0.2);
  doc.fillColor('#64748b').fontSize(13).text('الجمهورية اليمنية — وزارة التربية والتعليم', { align: 'center' }).moveDown(1);
  doc.fillColor('#b45309').fontSize(26).text('★ شهادة تفوق وتقدير وامتياز ★', { align: 'center' }).moveDown(1);

  doc.fillColor('#1e293b').fontSize(16).text('تمنح إدارة المدرسة هذه الشهادة تقديراً للطالب المتميز:', { align: 'center' }).moveDown(0.4);
  doc.fillColor('#1e3a8a').fontSize(26).text('محمد سالم', { align: 'center' }).moveDown(0.5);
  doc.fillColor('#334155').fontSize(15).text('تقديراً لتفوقه الأكاديمي الباهر وحصوله على معدل 95.8% وسلوكه النموذجي المشرف.', { align: 'center' }).moveDown(1.5);

  const dateStr = `تاريخ الإصدار: ${new Date().toLocaleDateString('ar-YE')}`;
  doc.fillColor('#475569').fontSize(12).text(dateStr, 60, doc.page.height - 90);
  doc.text('مدير المدرسة: أ. عبدالله الوادعي', doc.page.width - 260, doc.page.height - 90);
  doc.text('ختم الإدارة العامة والكنترول', { align: 'center' });

  doc.end();
  await new Promise(res => stream.on('finish', res));

  await Certificate.create({
    student_id: 1,
    term_id: termId,
    type: 'honor',
    title: 'شهادة تفوق وتقدير أكاديمي',
    file_url: `/uploads/${certFileName1}`,
    issued_by: adminUser ? adminUser.id : 1,
  });

  console.log('✅ تم توليد ملف الشهادة PDF وحفظها في قاعدة البيانات');
  console.log('🎉 اكتمل غرس البيانات بنجاح تام!');
  process.exit(0);
}

seedCompleteData().catch(err => {
  console.error('❌ خطأ في غرس البيانات:', err);
  process.exit(1);
});
