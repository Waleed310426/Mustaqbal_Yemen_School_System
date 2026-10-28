require('dotenv').config();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const sequelize = require('../config/db');
const setupAssociations = require('./associations');

setupAssociations();

// Import Models
const User = require('../modules/auth/user.model');
const { Student, Class, Parent, StudentParent } = require('../modules/students-classes/students.model');
const { Teacher, Subject, TeacherSubject, Period, Schedule } = require('../modules/teachers-subjects-schedule/teachers.model');
const { Grade, Certificate } = require('../modules/grades-certificates/grades.model');
const Attendance = require('../modules/attendance/attendance.model');
const { Payment, FeeStructure } = require('../modules/payments/payments.model');
const { SchoolSetting, Term } = require('../modules/settings/settings.model');
const Notification = require('../modules/dashboard-notifications/notification.model');
const { BusRoute, Bus, BusSubscription } = require('../modules/transportation/transportation.model');
const { ActivityType, Activity, ActivityParticipant } = require('../modules/activities/activities.model');
const { InventoryCategory, InventoryItem, InventorySupplier, InventoryOrder } = require('../modules/inventory/inventory.model');
const { ExamHall, SeatNumber, ExamSchedule } = require('../modules/exams/exams.model');

const SALT_ROUNDS = 10;

async function seedYemeniRealisticData() {
  console.log('🇾🇪 بدء غرس البيانات اليمنية الشاملة والواقعية لنظام مدرسة مستقبل اليمن...');

  const passwordHash = await bcrypt.hash('Pass@1234', SALT_ROUNDS);

  // 1. العام الدراسي والفصول
  console.log('📌 1. إعداد العام الدراسي والفصول...');
  let term = await Term.findOne({ where: { is_current: true } });
  if (!term) {
    term = await Term.create({
      name: 'الفصل الدراسي الأول 2025-2026',
      academic_year: '2025-2026',
      is_current: true,
      start_date: '2025-08-25',
      end_date: '2026-01-15',
    });
  }
  const termId = term.id;

  // 2. إعدادات المدرسة
  await SchoolSetting.upsert({
    id: 1,
    school_name: 'مدرسة مستقبل اليمن الأهلية النموذجية الحديثة',
    phone: '+967 1 445566',
    email: 'info@mustaqbal-alyaman.school.ye',
    address: 'الجمهورية اليمنية — أمانة العاصمة صنعاء — حي حدة جوار بريد حدة',
    established_year: 2012,
    current_term_id: termId,
  });

  // 3. الحصص الدراسية (Periods)
  console.log('⏰ 2. إعداد الحصص الدراسية اليومية...');
  const periodsData = [
    { name: 'الطابور والنشيد الوطني', start_time: '07:15:00', end_time: '07:30:00', order_num: 0 },
    { name: 'الحصة الأولى', start_time: '07:30:00', end_time: '08:15:00', order_num: 1 },
    { name: 'الحصة الثانية', start_time: '08:20:00', end_time: '09:05:00', order_num: 2 },
    { name: 'الحصة الثالثة', start_time: '09:10:00', end_time: '09:55:00', order_num: 3 },
    { name: 'استراحة الفسحة المدرسية', start_time: '09:55:00', end_time: '10:20:00', order_num: 4 },
    { name: 'الحصة الرابعة', start_time: '10:20:00', end_time: '11:05:00', order_num: 5 },
    { name: 'الحصة الخامسة', start_time: '11:10:00', end_time: '11:55:00', order_num: 6 },
    { name: 'الحصة السادسة', start_time: '12:00:00', end_time: '12:45:00', order_num: 7 },
  ];

  for (const p of periodsData) {
    const existing = await Period.findOne({ where: { name: p.name } });
    if (!existing) await Period.create(p);
  }
  const allPeriods = await Period.findAll({ order: [['order_num', 'ASC']] });
  const period1 = allPeriods.find(p => p.order_num === 1) || allPeriods[0];
  const period2 = allPeriods.find(p => p.order_num === 2) || allPeriods[1];
  const period3 = allPeriods.find(p => p.order_num === 3) || allPeriods[2];
  const period4 = allPeriods.find(p => p.order_num === 5) || allPeriods[3];

  // 4. الفصول الدراسية والشعب
  console.log('🏫 3. إعداد الفصول والشعب الدراسية...');
  const classesData = [
    { grade_level: 'الصف السابع', section: 'أ', capacity: 35, term_id: termId },
    { grade_level: 'الصف السابع', section: 'ب', capacity: 35, term_id: termId },
    { grade_level: 'الصف الثامن', section: 'أ', capacity: 35, term_id: termId },
    { grade_level: 'الصف الثامن', section: 'ب', capacity: 35, term_id: termId },
    { grade_level: 'الصف التاسع', section: 'أ', capacity: 35, term_id: termId },
    { grade_level: 'الأول الثانوي', section: 'أ', capacity: 32, term_id: termId },
    { grade_level: 'الثاني الثانوي', section: 'علمي أ', capacity: 30, term_id: termId },
    { grade_level: 'الثالث الثانوي', section: 'علمي أ', capacity: 30, term_id: termId },
  ];

  const classInstances = [];
  for (const c of classesData) {
    let [cls] = await Class.findOrCreate({
      where: { grade_level: c.grade_level, section: c.section, term_id: c.term_id },
      defaults: c,
    });
    classInstances.push(cls);
  }

  // 5. المواد الدراسية اليمنية
  console.log('📚 4. إعداد المناهج والمقررات المدرسية اليمنية...');
  const subjectsData = [
    { name: 'القرآن الكريم وعلومه', grade_level: 'عام', description: 'منهج وزارة التربية والتعليم للقرآن والتجويد' },
    { name: 'التربية الإسلامية والفقه', grade_level: 'عام', description: 'الحديث والسيرة النبوية والفقه والأخلاق' },
    { name: 'اللغة العربية (نحو وبلاغة)', grade_level: 'عام', description: 'قواعد النحو والصرف والإملاء والأدب العربي' },
    { name: 'الرياضيات والجبر', grade_level: 'عام', description: 'الهندسة والتحليل الرياضي والجبر والإحصاء' },
    { name: 'العلوم العامة', grade_level: 'أساسي', description: 'أساسيات الفيزياء والكيمياء والأحياء' },
    { name: 'الفيزياء', grade_level: 'ثانوي', description: 'الميكانيكا والموجات والكهرباء والمغناطيسية' },
    { name: 'الكيمياء', grade_level: 'ثانوي', description: 'الكيمياء العامة والعضوية والمعادلات المخبرية' },
    { name: 'الأحياء والبيئة', grade_level: 'ثانوي', description: 'علم الأحياء الدقيقة وعلم وظائف الأعضاء والوراثة' },
    { name: 'اللغة الإنجليزية', grade_level: 'عام', description: 'English for Yemen - الكتاب الوزاري المعتمد' },
    { name: 'التاريخ والتربية الوطنية', grade_level: 'عام', description: 'تاريخ اليمن وحضارات سبأ وحمير والثورات اليمنية' },
    { name: 'الجغرافيا الوطنية', grade_level: 'عام', description: 'تضاريس اليمن والمناخ والوطن العربي' },
    { name: 'الحاسوب وتكنولوجيا المعلومات', grade_level: 'عام', description: 'أساسيات البرمجة، والذكاء الاصطناعي والتطبيقات' },
  ];

  const subjectInstances = [];
  for (const s of subjectsData) {
    let [subj] = await Subject.findOrCreate({
      where: { name: s.name },
      defaults: s,
    });
    subjectInstances.push(subj);
  }

  // 6. المعلمون اليمنيون (10 معلمين متخصصين)
  console.log('👨‍🏫 5. إعداد هيئة التدريس اليمنية...');
  const teachersList = [
    { name: 'أ. أحمد صالح العرشي', email: 'ahmed.teacher@school.ye', phone: '771234567', spec: 'الرياضيات والجبر', hire: '2019-09-01' },
    { name: 'أ. خالد مسعود الحكيمي', email: 'khaled.hakimi@school.ye', phone: '772345678', spec: 'الفيزياء والعلوم', hire: '2020-08-15' },
    { name: 'أ. فاطمة محمد القدسي', email: 'fatima.qudsi@school.ye', phone: '733456789', spec: 'الكيمياء والعلوم العامة', hire: '2021-09-01' },
    { name: 'أ. عبدالغني سعيد الصنعاني', email: 'abdulghani.sanani@school.ye', phone: '774567890', spec: 'اللغة العربية والبلاغة', hire: '2018-09-01' },
    { name: 'أ. نجوى عثمان باعباد', email: 'najwa.baabbad@school.ye', phone: '715678901', spec: 'اللغة الإنجليزية', hire: '2022-08-20' },
    { name: 'أ. بلال يحيى الشرفي', email: 'belal.sharafi@school.ye', phone: '776789012', spec: 'القرآن الكريم والتربية الإسلامية', hire: '2017-09-01' },
    { name: 'أ. منى علي باصهيب', email: 'mona.basoheib@school.ye', phone: '737890123', spec: 'الأحياء والبيئة', hire: '2021-09-01' },
    { name: 'أ. وليد قاسم الذماري', email: 'walid.dhamari@school.ye', phone: '778901234', spec: 'التاريخ والجغرافيا والوطنية', hire: '2019-08-15' },
    { name: 'أ. سمية صادق الوادعي', email: 'somaya.wadaei@school.ye', phone: '719012345', spec: 'الحاسوب وتكنولوجيا المعلومات', hire: '2023-09-01' },
    { name: 'أ. عماد توفيق الحرازي', email: 'emad.harazi@school.ye', phone: '770123456', spec: 'الأنشطة والتربية الرياضية', hire: '2020-09-01' },
  ];

  const teacherInstances = [];
  for (const t of teachersList) {
    let [user] = await User.findOrCreate({
      where: { email: t.email },
      defaults: {
        name: t.name,
        email: t.email,
        password: passwordHash,
        role: 'teacher',
        status: 'active',
        phone: t.phone,
      },
    });

    let [teacher] = await Teacher.findOrCreate({
      where: { user_id: user.id },
      defaults: {
        specialization: t.spec,
        hire_date: t.hire,
      },
    });
    teacherInstances.push(teacher);
  }

  // 7. الطلاب اليمنيون (35 طالباً وطالبة من مختلف المحافظات والمناطق اليمنية)
  console.log('🎓 6. تسجيل 35 طالباً وطالبة ببيانات يمنية واقعية...');
  const studentsList = [
    { name: 'محمد سالم باعباد', email: 'student1@school.ye', gender: 'male', birth: '2011-04-12', address: 'صنعاء — شارع حدة جوار مجمع الكميم', classIdx: 0, phone: '777000101' },
    { name: 'نور أحمد الصعيدي', email: 'student2@school.ye', gender: 'female', birth: '2011-06-25', address: 'صنعاء — حي الرويشان شارع 14 أكتوبر', classIdx: 0, phone: '777000102' },
    { name: 'أسامة طارق الحبيشي', email: 'osama.hubaishi@school.ye', gender: 'male', birth: '2011-02-18', address: 'صنعاء — حي الصافية الغربية', classIdx: 0, phone: '777000103' },
    { name: 'سارة عبدالسلام الريمي', email: 'sara.raimi@school.ye', gender: 'female', birth: '2011-09-30', address: 'صنعاء — شارع الأصبحي جوار سوق المقالح', classIdx: 0, phone: '777000104' },
    { name: 'حمزة عبدالرحمن الشامي', email: 'hamza.shami@school.ye', gender: 'male', birth: '2011-11-05', address: 'صنعاء — بيت بوس حي الشباب', classIdx: 0, phone: '777000105' },
    
    // الصف السابع - ب
    { name: 'رغد عمار المخلافي', email: 'raghad.mikhlafi@school.ye', gender: 'female', birth: '2011-03-14', address: 'صنعاء — الدائري الغربي جوار جولة كنتاكي', classIdx: 1, phone: '777000106' },
    { name: 'يحيى هاشم المطهر', email: 'yahya.motahar@school.ye', gender: 'male', birth: '2011-08-20', address: 'صنعاء — حدة المدينة السكنية', classIdx: 1, phone: '777000107' },
    { name: 'بلقيس فؤاد الصبري', email: 'balqis.sabri@school.ye', gender: 'female', birth: '2011-05-10', address: 'صنعاء — شارع الجزائر جوار المركز الطبي', classIdx: 1, phone: '777000108' },
    { name: 'عمر خالد السقاف', email: 'omar.saqqaf@school.ye', gender: 'male', birth: '2011-12-01', address: 'صنعاء — حي الجامعة القديمة', classIdx: 1, phone: '777000109' },

    // الصف الثامن - أ
    { name: 'مروة نجيب البركاني', email: 'marwa.barkan@school.ye', gender: 'female', birth: '2010-04-18', address: 'صنعاء — شارع تعز حي شميلة', classIdx: 2, phone: '777000110' },
    { name: 'علي نبيل العنسي', email: 'ali.ansi@school.ye', gender: 'male', birth: '2010-07-22', address: 'صنعاء — شارع بغداد خلف بنك التضامن', classIdx: 2, phone: '777000111' },
    { name: 'أروى رضوان العامري', email: 'arwa.ameri@school.ye', gender: 'female', birth: '2010-01-19', address: 'صنعاء — عصر جوار برج النعمان', classIdx: 2, phone: '777000112' },
    { name: 'زيد صدام العولقي', email: 'zaid.awlaqi@school.ye', gender: 'male', birth: '2010-10-15', address: 'صنعاء — شارع الستين الجنوبي', classIdx: 2, phone: '777000113' },
    { name: 'حنين صادق الحمادي', email: 'haneen.hammadi@school.ye', gender: 'female', birth: '2010-09-03', address: 'صنعاء — جولة سبأ حي القيادة', classIdx: 2, phone: '777000114' },

    // الصف الثامن - ب
    { name: 'معاذ فهد الأصبحي', email: 'moath.asbahi@school.ye', gender: 'male', birth: '2010-03-29', address: 'صنعاء — شارع 24 الأصبحي', classIdx: 3, phone: '777000115' },
    { name: 'شيماء أنيس الكبسي', email: 'shaima.kibsi@school.ye', gender: 'female', birth: '2010-06-11', address: 'صنعاء — الحصبة حي الرماح', classIdx: 3, phone: '777000116' },
    { name: 'وسيم رمزي الزبيري', email: 'waseem.zubairi@school.ye', gender: 'male', birth: '2010-08-08', address: 'صنعاء — حي القاع شارع الزبيري', classIdx: 3, phone: '777000117' },
    { name: 'ريناد بسام الشيباني', email: 'renad.shaibani@school.ye', gender: 'female', birth: '2010-11-23', address: 'صنعاء — شارع عمان جوار السفارة', classIdx: 3, phone: '777000118' },

    // الصف التاسع - أ (الشهادة الأساسية)
    { name: 'صهيب مجاهد القوسي', email: 'suhaib.qawsi@school.ye', gender: 'male', birth: '2009-02-14', address: 'صنعاء — حي نقم جبل نقم', classIdx: 4, phone: '777000119' },
    { name: 'ياسمين هاني الدبعي', email: 'yasmin.dubaie@school.ye', gender: 'female', birth: '2009-05-17', address: 'صنعاء — حدة شارع بيروت', classIdx: 4, phone: '777000120' },
    { name: 'براء توفيق الأكوع', email: 'baraa.akwa@school.ye', gender: 'male', birth: '2009-08-09', address: 'صنعاء — حي الصافية الشرقية', classIdx: 4, phone: '777000121' },
    { name: 'دانية إبراهيم المؤيد', email: 'dania.muayyad@school.ye', gender: 'female', birth: '2009-12-28', address: 'صنعاء — حي الكويت جوار المستشفى', classIdx: 4, phone: '777000122' },
    { name: 'إلياس وضاح الجبري', email: 'elyas.jabri@school.ye', gender: 'male', birth: '2009-04-03', address: 'صنعاء — مذبح شارع الثلاثين', classIdx: 4, phone: '777000123' },

    // الأول الثانوي - أ
    { name: 'ملاك منير باحاج', email: 'malak.bahaj@school.ye', gender: 'female', birth: '2008-03-21', address: 'صنعاء — فج عطان حي الفلل', classIdx: 5, phone: '777000124' },
    { name: 'حميد فيصل الوادعي', email: 'humaid.wadaei@school.ye', gender: 'male', birth: '2008-07-10', address: 'صنعاء — بيت بوس جولة سيتي ماكس', classIdx: 5, phone: '777000125' },
    { name: 'تسنيم عصام الهتار', email: 'tasneem.hattar@school.ye', gender: 'female', birth: '2008-09-19', address: 'صنعاء — شارع بغداد برج الذهب', classIdx: 5, phone: '777000126' },
    { name: 'غسان جميل الرداعي', email: 'ghassan.radaei@school.ye', gender: 'male', birth: '2008-11-30', address: 'صنعاء — شارع خولان جولة الحثيلي', classIdx: 5, phone: '777000127' },

    // الثاني الثانوي - علمي أ
    { name: 'شهد طلال المعمري', email: 'shahd.mamari@school.ye', gender: 'female', birth: '2007-01-16', address: 'صنعاء — شارع الستين الغربي حي صوفان', classIdx: 6, phone: '777000128' },
    { name: 'ريان منذر الشرجبي', email: 'rayan.sharjabi@school.ye', gender: 'male', birth: '2007-05-24', address: 'صنعاء — حي القادسية شارع تعز', classIdx: 6, phone: '777000129' },
    { name: 'دينا بشير الحذيفي', email: 'dina.huthaifi@school.ye', gender: 'female', birth: '2007-08-12', address: 'صنعاء — حي المطار الجديد', classIdx: 6, phone: '777000130' },
    { name: 'عاصم عادل المذحجي', email: 'asim.madhhaji@school.ye', gender: 'male', birth: '2007-10-04', address: 'صنعاء — شملان جوار سوق شملان', classIdx: 6, phone: '777000131' },

    // الثالث الثانوي - علمي أ (الشهادة الثانوية العامة)
    { name: 'أمل حسام الحوشبي', email: 'amal.hawshabi@school.ye', gender: 'female', birth: '2006-03-08', address: 'صنعاء — شارع دمشق حي الصافية', classIdx: 7, phone: '777000132' },
    { name: 'لؤي زكريا السنيدار', email: 'luai.sunaidar@school.ye', gender: 'male', birth: '2006-06-19', address: 'صنعاء — التحرير شارع علي عبدالمغني', classIdx: 7, phone: '777000133' },
    { name: 'جود هيثم المحاقري', email: 'joud.mahaqri@school.ye', gender: 'female', birth: '2006-09-02', address: 'صنعاء — بيت بوس حي الشباب', classIdx: 7, phone: '777000134' },
    { name: 'كنان نبيل السياني', email: 'kinan.sayani@school.ye', gender: 'male', birth: '2006-12-11', address: 'صنعاء — الدائري تقاطع الجامعة الجديدة', classIdx: 7, phone: '777000135' },
  ];

  const studentInstances = [];
  for (const s of studentsList) {
    let [user] = await User.findOrCreate({
      where: { email: s.email },
      defaults: {
        name: s.name,
        email: s.email,
        password: passwordHash,
        role: 'student',
        status: 'active',
        phone: s.phone,
      },
    });

    const targetClass = classInstances[s.classIdx] || classInstances[0];
    let [student] = await Student.findOrCreate({
      where: { user_id: user.id },
      defaults: {
        class_id: targetClass.id,
        birth_date: s.birth,
        gender: s.gender,
        address: s.address,
        status: 'active',
        enrollment_date: '2025-08-25',
      },
    });
    studentInstances.push(student);
  }

  // 8. أولياء الأمور
  console.log('👨‍👩‍👦 7. إعداد أولياء الأمور والربط بالطلاب...');
  const parentsList = [
    { name: 'سالم أحمد باعباد', email: 'parent1@school.ye', occ: 'رجل أعمال ومدير شركات', phone: '777111222', sIdx: [0] },
    { name: 'د. أحمد قاسم الصعيدي', email: 'ahmed.osaidi@parent.ye', occ: 'طبيب استشاري جراحة', phone: '777222333', sIdx: [1] },
    { name: 'م. طارق الحبيشي', email: 'tareq.hubaishi@parent.ye', occ: 'مهندس اتصالات ونظم', phone: '777333444', sIdx: [2] },
    { name: 'أ. عبدالسلام الريمي', email: 'abdulsalam.raimi@parent.ye', occ: 'مدير تدقيق مالي ومحاسبي', phone: '777444555', sIdx: [3] },
    { name: 'الشيخ عبدالرحمن الشامي', email: 'abdulrahman.shami@parent.ye', occ: 'قانوني ومحكم تجاري', phone: '777555666', sIdx: [4] },
    { name: 'أ.د. عمار المخلافي', email: 'ammar.mikhlafi@parent.ye', occ: 'أستاذ جامعي بكلية الطب', phone: '777666777', sIdx: [5] },
    { name: 'د. خالد السقاف', email: 'khaled.saqqaf@parent.ye', occ: 'أكاديمي وباحث بيئي', phone: '777777888', sIdx: [8] },
    { name: 'العميد مجاهد القوسي', email: 'mujahid.qawsi@parent.ye', occ: 'متقاعد وإداري أمني', phone: '777888999', sIdx: [18] },
  ];

  for (const p of parentsList) {
    let [pUser] = await User.findOrCreate({
      where: { email: p.email },
      defaults: {
        name: p.name,
        email: p.email,
        password: passwordHash,
        role: 'parent',
        status: 'active',
        phone: p.phone,
      },
    });

    let [parent] = await Parent.findOrCreate({
      where: { user_id: pUser.id },
      defaults: { occupation: p.occ },
    });

    for (const idx of p.sIdx) {
      if (studentInstances[idx]) {
        await StudentParent.findOrCreate({
          where: { student_id: studentInstances[idx].id, parent_id: parent.id },
          defaults: { relationship: 'أب' },
        });
      }
    }
  }

  // 9. توزيع الحصص والجدول الأسبوعي
  console.log('📅 8. توزيع المقررات على المعلمين وإعداد الجدول المدرسي...');
  await TeacherSubject.destroy({ where: {} });
  const assignments = [];
  classInstances.forEach((cls, cIdx) => {
    subjectInstances.slice(0, 8).forEach((sub, sIdx) => {
      const teacher = teacherInstances[(cIdx + sIdx) % teacherInstances.length];
      assignments.push({
        class_id: cls.id,
        subject_id: sub.id,
        teacher_id: teacher.id,
        term_id: termId,
      });
    });
  });
  await TeacherSubject.bulkCreate(assignments);

  // جدول الحصص الأسبوعي
  await Schedule.destroy({ where: {} });
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const scheduleSlots = [];

  days.forEach((day, dIdx) => {
    [1, 2, 3, 5].forEach((order, pIdx) => {
      const period = allPeriods.find(p => p.order_num === order) || allPeriods[pIdx];
      classInstances.forEach((cls, cIdx) => {
        const sub = subjectInstances[(cIdx + pIdx + dIdx) % subjectInstances.length];
        const teacher = teacherInstances[(cIdx + pIdx + dIdx) % teacherInstances.length];

        scheduleSlots.push({
          class_id: cls.id,
          subject_id: sub.id,
          teacher_id: teacher.id,
          period_id: period.id,
          day,
          term_id: termId,
        });
      });
    });
  });
  await Schedule.bulkCreate(scheduleSlots);
  console.log(`✅ تم إنشاء ${scheduleSlots.length} فترة دراسية في الجدول الأسبوعي`);

  // 10. سجلات الحضور والغياب (14 يوماً واقعية تشمل اليوم)
  console.log('📋 9. إنشاء سجلات الحضور اليومية والتاريخية (مؤشر الحضور الحي)...');
  await Attendance.destroy({ where: {} });

  const adminUser = await User.findOne({ where: { role: 'admin' } });
  const recorderId = adminUser ? adminUser.id : 1;
  const attendanceRows = [];
  const today = new Date();

  // توليد الحضور لآخر 14 يوماً
  for (let offset = 14; offset >= 0; offset--) {
    const curDate = new Date();
    curDate.setDate(today.getDate() - offset);
    const dayOfWeek = curDate.getDay(); // 5 = Friday, 6 = Saturday (عطلة نهاية الأسبوع)
    if (dayOfWeek === 5 || dayOfWeek === 6) continue;

    const dateStr = curDate.toISOString().split('T')[0];

    studentInstances.forEach((st, idx) => {
      let status = 'present';
      let notes = null;

      // محاكاة غياب طبيعي بنسبة 5% - 8%
      const rand = (idx * 7 + offset * 13) % 100;
      if (rand < 4) {
        status = 'absent';
        notes = 'إجازة مرضية بعذر مسبق';
      } else if (rand === 5) {
        status = 'absent';
        notes = 'غياب بدون إشعار مسبق';
      } else if (rand === 6 || rand === 7) {
        status = 'late';
        notes = 'تأخر عن الطابور 10 دقائق';
      }

      // في يوم اليوم: نجعل نسبة الحضور مرتفعة جداً (94.3%) لتظهر في اللوحة بشكل متألق
      if (offset === 0) {
        if (idx === 3 || idx === 11) {
          status = 'absent';
          notes = 'مشاركة في مسابقة أولمبياد الرياضيات الوزارية';
        } else if (idx === 8) {
          status = 'late';
          notes = 'تأخر بسبب الازدحام المروري في شارع حدة';
        } else {
          status = 'present';
          notes = null;
        }
      }

      attendanceRows.push({
        student_id: st.id,
        period_id: period1.id,
        date: dateStr,
        status,
        notes,
        recorded_by: recorderId,
      });
    });
  }

  await Attendance.bulkCreate(attendanceRows);
  console.log(`✅ تم تسجيل ${attendanceRows.length} سجل حضور وغياب واقعي`);

  // 11. الرسوم الدراسية والمدفوعات بالريال اليمني
  console.log('💰 10. إعداد الرسوم الدراسية والمدفوعات بالريال اليمني (YER)...');
  await FeeStructure.destroy({ where: {} });
  await Payment.destroy({ where: {} });

  const feeStructures = await FeeStructure.bulkCreate([
    { grade_level: 'الصف السابع', amount: 280000, description: 'الرسوم السنوية الشاملة للصف السابع الأساسي', term_id: termId },
    { grade_level: 'الصف الثامن', amount: 290000, description: 'الرسوم السنوية الشاملة للصف الثامن الأساسي', term_id: termId },
    { grade_level: 'الصف التاسع', amount: 320000, description: 'الرسوم السنوية الشاملة لشهادة الصف التاسع', term_id: termId },
    { grade_level: 'الأول الثانوي', amount: 350000, description: 'الرسوم السنوية للصف الأول الثانوي', term_id: termId },
    { grade_level: 'الثاني الثانوي', amount: 380000, description: 'الرسوم السنوية للصف الثاني الثانوي علمي', term_id: termId },
    { grade_level: 'الثالث الثانوي', amount: 420000, description: 'الرسوم السنوية لشهادة الثانوية العامة الوزارية', term_id: termId },
  ]);

  const paymentsData = [];
  studentInstances.forEach((st, idx) => {
    // القسط الأول (مسدد للجميع)
    paymentsData.push({
      student_id: st.id,
      amount: 140000,
      paid_date: '2025-09-05',
      due_date: '2025-09-10',
      status: 'paid',
      payment_method: idx % 3 === 0 ? 'بنك الكريمي' : (idx % 3 === 1 ? 'نقد - الصندوق' : 'محفظة جيب'),
      notes: 'القسط الدراسي الأول - بداية العام 2025-2026',
      recorded_by: recorderId,
    });

    // رسوم الكتب والأنشطة المدرسية (مسدد)
    paymentsData.push({
      student_id: st.id,
      amount: 35000,
      paid_date: '2025-09-12',
      due_date: '2025-09-15',
      status: 'paid',
      payment_method: 'نقد - الصندوق',
      notes: 'قيمة الحقيبة المدرسية والكتب الوزارية والأنشطة',
      recorded_by: recorderId,
    });

    // القسط الثاني: بعض الطلاب سددوه وبعضهم معلق لمطابقة الرسم الدائري
    const isPaidSecond = (idx % 3 !== 0); // ثلثين سددوا والثلث معلق
    paymentsData.push({
      student_id: st.id,
      amount: 120000,
      paid_date: isPaidSecond ? '2025-10-15' : null,
      due_date: '2025-10-20',
      status: isPaidSecond ? 'paid' : (idx % 2 === 0 ? 'pending' : 'overdue'),
      payment_method: isPaidSecond ? 'بنك التضامن' : 'نقد - الصندوق',
      notes: isPaidSecond ? 'القسط الدراسي الثاني - مسدد بالكامل' : 'القسط الدراسي الثاني - إشعار سداد معلق',
      recorded_by: recorderId,
    });
  });

  await Payment.bulkCreate(paymentsData);
  console.log(`✅ تم تسجيل ${paymentsData.length} عملية دفع رسوم بإجمالي يتجاوز 8 مليون ريال يمني`);

  // 12. درجات الطلاب والكنترول المدرسي (Grades)
  console.log('📝 11. رصد درجات الكنترول والاختبارات الشهرية والنصفية...');
  await Grade.destroy({ where: {} });

  const gradesList = [];
  studentInstances.forEach((st, sIdx) => {
    // رصد 4 مواد رئيسية لكل طالب
    subjectInstances.slice(0, 4).forEach((sub, subIdx) => {
      // درجات شهرية (من 30)
      const baseMonthly = 22 + ((sIdx * 3 + subIdx * 5) % 9); // بين 22 و 30
      gradesList.push({
        student_id: st.id,
        subject_id: sub.id,
        term_id: termId,
        exam_type: 'monthly',
        score: baseMonthly,
        max_score: 30,
        notes: baseMonthly >= 28 ? 'أداء ممتاز ومتقن' : 'مستوى جيد ومواظبة مشرفة',
        entered_by: recorderId,
      });

      // امتحانات نصف فصلي (من 40)
      const baseMidterm = 30 + ((sIdx * 2 + subIdx * 4) % 11); // بين 30 و 40
      gradesList.push({
        student_id: st.id,
        subject_id: sub.id,
        term_id: termId,
        exam_type: 'midterm',
        score: baseMidterm,
        max_score: 40,
        notes: baseMidterm >= 38 ? 'درجة ممتازة وتقدم أكاديمي رائع' : 'استيعاب طيب للمقرر',
        entered_by: recorderId,
      });

      // واجبات ومشاريع (من 15)
      gradesList.push({
        student_id: st.id,
        subject_id: sub.id,
        term_id: termId,
        exam_type: 'homework',
        score: 13 + (sIdx % 3),
        max_score: 15,
        notes: 'حل الواجبات المدرسية أولاً بأول',
        entered_by: recorderId,
      });

      // مواظبة وسلوك ومشاركة صفية (من 15)
      gradesList.push({
        student_id: st.id,
        subject_id: sub.id,
        term_id: termId,
        exam_type: 'participation',
        score: 14 + (subIdx % 2),
        max_score: 15,
        notes: 'مشاركة فعالة وانضباط صفي عالي',
        entered_by: recorderId,
      });
    });
  });

  await Grade.bulkCreate(gradesList);
  console.log(`✅ تم رصد ${gradesList.length} درجة أكاديمية في نظام الكنترول`);

  // 13. النقل والمواصلات (خطوط السير والباصات)
  console.log('🚌 12. إعداد خطوط النقل المدرسي والحافلات واشتراكات الطلاب...');
  await BusSubscription.destroy({ where: {} });
  await Bus.destroy({ where: {} });
  await BusRoute.destroy({ where: {} });

  const routes = await BusRoute.bulkCreate([
    {
      name: 'خط حدة — المدينة السكنية — الحي السياسي',
      description: 'يمر عبر جولة المصباحي، شارع حدة الرئيسي، وبريد حدة حتى المدرسة',
      start_point: 'حدة المدينة السكنية',
      end_point: 'المدرسة - حدة',
      distance_km: 8.5,
      monthly_fee: 15000,
      yearly_fee: 120000,
    },
    {
      name: 'خط بيت بوس — الأصبحي — دار سلم',
      description: 'يمر عبر جولة سيتي ماكس، شارع 24، والمقالح',
      start_point: 'حي الشباب - بيت بوس',
      end_point: 'المدرسة - حدة',
      distance_km: 11.2,
      monthly_fee: 18000,
      yearly_fee: 145000,
    },
    {
      name: 'خط الدائري — عصر — مذبح والجامعة',
      description: 'يمر عبر جولة عصر، برج النعمان، شارع الستين، وتقاطع حدة',
      start_point: 'جولة عصر',
      end_point: 'المدرسة - حدة',
      distance_km: 9.8,
      monthly_fee: 16000,
      yearly_fee: 130000,
    },
  ]);

  const buses = await Bus.bulkCreate([
    { bus_number: 'باص 01', plate_number: '14-38295 أمانة العاصمة', driver_name: 'أبو بكيل ناصر الهمداني', driver_phone: '771445566', capacity: 30, route_id: routes[0].id, status: 'active' },
    { bus_number: 'باص 02', plate_number: '14-49120 أمانة العاصمة', driver_name: 'عبده محمد الكينعي', driver_phone: '772556677', capacity: 30, route_id: routes[1].id, status: 'active' },
    { bus_number: 'باص 03', plate_number: '14-55812 أمانة العاصمة', driver_name: 'حميد عباد المحويتي', driver_phone: '773667788', capacity: 28, route_id: routes[2].id, status: 'active' },
  ]);

  // اشتراكات 18 طالباً في الباصات
  const busSubs = [];
  studentInstances.slice(0, 18).forEach((st, idx) => {
    const route = routes[idx % routes.length];
    const bus = buses[idx % buses.length];
    busSubs.push({
      student_id: st.id,
      route_id: route.id,
      bus_id: bus.id,
      subscription_type: 'yearly',
      amount: route.yearly_fee,
      start_date: '2025-08-25',
      end_date: '2026-06-30',
      status: 'active',
      pickup_point: st.address ? st.address.split('—')[1] || 'أمام المنزل' : 'نقطة الحي',
      notes: 'اشتراك سنوي معتمد',
    });
  });
  await BusSubscription.bulkCreate(busSubs);
  console.log(`✅ تم تسجيل ${busSubs.length} اشتراك نقل مدرسي في 3 حافلات`);

  // 14. الأنشطة المدرسية اليمنية
  console.log('⚽ 13. إعداد الأنشطة والمسابقات المدرسية...');
  await ActivityParticipant.destroy({ where: {} });
  await Activity.destroy({ where: {} });
  await ActivityType.destroy({ where: {} });

  const actTypes = await ActivityType.bulkCreate([
    { name: 'أنشطة رياضية', description: 'دوريات كرة القدم وكرة الطائرة واللياقة', color: '#16a34a' },
    { name: 'مسابقات ثقافية وقرآنية', description: 'حفظ وتجويد القرآن الكريم، الإذاعة، والمناظرات', color: '#2563eb' },
    { name: 'ابتكار علمي وتكنولوجي', description: 'معارض العلوم والروبوت والذكاء الاصطناعي', color: '#0284c7' },
    { name: 'رحلات استكشافية وميدانية', description: 'زيارات معالم اليمن التاريخية والمرافق العلمية', color: '#d97706' },
  ]);

  const acts = await Activity.bulkCreate([
    {
      title: 'دوري مدرسة مستقبل اليمن لكرة القدم 2026',
      type_id: actTypes[0].id,
      description: 'بطولة الفصول المدرسية على كأس التميز والإخاء في ملعب المدرسة المعشب',
      location: 'الملعب الرياضي لمدرسة مستقبل اليمن',
      start_date: new Date('2025-11-10T08:00:00'),
      end_date: new Date('2025-11-25T11:00:00'),
      max_participants: 60,
      fee: 0,
      status: 'ongoing',
      supervisor_id: teacherInstances[9]?.id || 1,
      term_id: termId,
    },
    {
      title: 'مسابقة الأقصى الكبرى لحفظ وتلاوة القرآن الكريم',
      type_id: actTypes[1].id,
      description: 'مسابقة سنوية في حفظ أجزاء المصحف الشريف وأحكام الترتيل والتجويد',
      location: 'مسجد المدرسة وقاعة المؤتمرات الكبرى',
      start_date: new Date('2025-12-01T09:00:00'),
      end_date: new Date('2025-12-15T12:00:00'),
      max_participants: 40,
      fee: 0,
      status: 'upcoming',
      supervisor_id: teacherInstances[5]?.id || 1,
      term_id: termId,
    },
    {
      title: 'المعرض السنوي للعلوم والابتكار وتطبيقات الذكاء الاصطناعي',
      type_id: actTypes[2].id,
      description: 'مشاريع الطلاب المخبرية، ابتكارات الطاقة البديلة، ونماذج الروبوت والبرمجة',
      location: 'الصالة الرياضية والمعامل العلمية',
      start_date: new Date('2026-01-05T08:30:00'),
      end_date: new Date('2026-01-08T13:00:00'),
      max_participants: 50,
      fee: 0,
      status: 'upcoming',
      supervisor_id: teacherInstances[1]?.id || 1,
      term_id: termId,
    },
  ]);

  // تسجيل الطلاب في الأنشطة
  const participants = [];
  studentInstances.slice(0, 15).forEach((st, idx) => {
    participants.push({
      activity_id: acts[idx % acts.length].id,
      student_id: st.id,
      registration_date: new Date(),
      status: 'registered',
      notes: 'مشارك متحمس في النشاط',
    });
  });
  await ActivityParticipant.bulkCreate(participants);
  console.log(`✅ تم إنشاء ${acts.length} أنشطة مدرسية كبرى و ${participants.length} مشارك`);

  // 15. المستودع والكتب المدرسية
  console.log('📦 14. إعداد مستودع المدرسة والمناهج المدرسية...');
  await InventoryOrder.destroy({ where: {} });
  await InventoryItem.destroy({ where: {} });
  await InventoryCategory.destroy({ where: {} });
  await InventorySupplier.destroy({ where: {} });

  const invCats = await InventoryCategory.bulkCreate([
    { name: 'الكتب المدرسية والمناهج الوزارية', description: 'طبعات وزارة التربية والتعليم الرسمية لجميع المراحل' },
    { name: 'الزي المدرسي والشارات المعتمدة', description: 'الزي الرسمي للطلاب والطالبات مع شارة المدرسة المطرزة' },
    { name: 'أدوات المعامل والمختبرات', description: 'أجهزة قياس، مجاهر، مواد كيميائية مخبرية آمنة' },
    { name: 'القرطاسية والمطبوعات الإدارية', description: 'دفاتر التحضير، أوراق الامتحانات، السجلات الرسمية' },
  ]);

  const supplier = await InventorySupplier.create({
    name: 'مؤسسة الوحدة للمطبوعات والوسائل التعليمية',
    phone: '777443322',
    email: 'alwahda.books@ye-supplier.com',
    address: 'صنعاء — شارع التحرير',
    contact_person: 'أ. فؤاد مطهر القاسمي',
  });

  const invItems = await InventoryItem.bulkCreate([
    { name: 'كتاب الرياضيات — الصف السابع (طبعة 2025)', category_id: invCats[0].id, sku: 'BOOK-MTH-07', unit: 'نسخة', quantity: 120, min_quantity: 20, unit_price: 3500 },
    { name: 'كتاب العلوم العامة — الصف الثامن', category_id: invCats[0].id, sku: 'BOOK-SCI-08', unit: 'نسخة', quantity: 95, min_quantity: 15, unit_price: 3200 },
    { name: 'كتاب الفيزياء — الأول الثانوي', category_id: invCats[0].id, sku: 'BOOK-PHY-10', unit: 'نسخة', quantity: 70, min_quantity: 10, unit_price: 4000 },
    { name: 'الزي المدرسي الكحلي النموذجي (مقاس M)', category_id: invCats[1].id, sku: 'UNIFORM-M-NVY', unit: 'طقم', quantity: 85, min_quantity: 15, unit_price: 18000 },
    { name: 'الزي المدرسي الكحلي النموذجي (مقاس L)', category_id: invCats[1].id, sku: 'UNIFORM-L-NVY', unit: 'طقم', quantity: 60, min_quantity: 10, unit_price: 19000 },
    { name: 'مجهر ضوئي تعليمي للمختبر (1000x)', category_id: invCats[2].id, sku: 'LAB-MIC-01', unit: 'جهاز', quantity: 12, min_quantity: 2, unit_price: 140000 },
    { name: 'مجموعة أدوات تشريح ونماذج مجسمة', category_id: invCats[2].id, sku: 'LAB-MOD-BIO', unit: 'طقم', quantity: 8, min_quantity: 2, unit_price: 65000 },
    { name: 'رزم ورق امتحانات A4 فاخر (80 جرام)', category_id: invCats[3].id, sku: 'PAP-A4-80G', unit: 'كرتون', quantity: 45, min_quantity: 10, unit_price: 28000 },
  ]);

  console.log(`✅ تم تسجيل ${invItems.length} صنف ومادة في مستودع المدرسة`);

  // 16. قاعات الامتحانات وأرقام الجلوس
  console.log('🏛️ 15. إعداد قاعات الكنترول وأرقام جلوس الطلاب...');
  await ExamSchedule.destroy({ where: {} });
  await SeatNumber.destroy({ where: {} });
  await ExamHall.destroy({ where: {} });

  const halls = await ExamHall.bulkCreate([
    { name: 'قاعة الأقصى الكبرى', capacity: 40, building: 'المبنى الرئيسي - الجناح أ', floor_number: 1 },
    { name: 'قاعة صنعاء التاريخية', capacity: 35, building: 'المبنى الرئيسي - الجناح ب', floor_number: 2 },
    { name: 'قاعة بلقيس للمؤتمرات والامتحانات', capacity: 30, building: 'مبنى المرحلة الثانوية', floor_number: 1 },
  ]);

  const seatNumbers = [];
  studentInstances.forEach((st, idx) => {
    const hall = halls[idx % halls.length];
    seatNumbers.push({
      student_id: st.id,
      term_id: termId,
      seat_number: `YE-${1000 + idx + 1}`,
      secret_number: `SEC-${8500 + idx}`,
      hall_id: hall.id,
    });
  });
  await SeatNumber.bulkCreate(seatNumbers);
  console.log(`✅ تم إصدار ${seatNumbers.length} رقم جلوس رسمي في الكنترول الموزع على 3 قاعات`);

  // 17. إشعارات حقيقية للمستخدمين
  console.log('🔔 16. إطلاق باقة إشعارات واقعية لمستخدمي النظام...');
  await Notification.destroy({ where: {} });

  const notificationsData = [
    {
      user_id: adminUser ? adminUser.id : 1,
      title: '📊 اكتمال رصد حضور الطابور الصباحي',
      message: 'بلغت نسبة الحضور العام لليوم 94.3% مع تسجيل 33 طالباً حاضراً في كافة الشعب الدراسية.',
      type: 'attendance',
      is_read: false,
    },
    {
      user_id: adminUser ? adminUser.id : 1,
      title: '💳 توريد رسوم مدرسية جديدة',
      message: 'تم توريد رسوم القسط الأول بمبلغ 140,000 ر.ي للطالب محمد سالم باعباد عبر بنك الكريمي.',
      type: 'payment',
      is_read: false,
    },
    {
      user_id: adminUser ? adminUser.id : 1,
      title: '🏆 تفوق دراسي لافت في مادة الرياضيات',
      message: 'حققت شعبة الصف السابع (أ) متوسط درجات 91.5% في اختبارات الشهر الأول بإشراف أ. أحمد العرشي.',
      type: 'grade',
      is_read: true,
    },
    {
      user_id: adminUser ? adminUser.id : 1,
      title: '🚌 إشعار حركة الباصات المدرسية',
      message: 'اكتمل خط سير باص 01 (حدة - الحي السياسي) ووصول كافة الطلاب بسلام للمدرسة في تمام 07:15 صباحاً.',
      type: 'general',
      is_read: true,
    },
    {
      user_id: studentInstances[0].user_id,
      title: '🌟 تهنئة وتفوق أكاديمي',
      message: 'مبارك لك يا محمد سالم، لقد حصلت على الدرجة الكاملة في اختبار العلوم العامة وتكريمك في الطابور.',
      type: 'grade',
      is_read: false,
    },
    {
      user_id: studentInstances[0].user_id,
      title: '📅 موعد انطلاق دوري كرة القدم المدرسي',
      message: 'تنطلق أولى مباريات دوري المدرسة يوم الثلاثاء القادم، استعد مع فريق شعبتك!',
      type: 'announcement',
      is_read: true,
    },
  ];

  await Notification.bulkCreate(notificationsData);
  console.log(`✅ تم توليد ${notificationsData.length} إشعار ذكي وتفاعلي`);

  console.log('==============================================================================');
  console.log('🇾🇪 تم بحمد الله غرس وتعبئة قاعدة البيانات بالكامل ببيانات يمنية واقعية وفاخرة!');
  console.log('   • 35 طالباً وطالبة موزعين على كافة الصفوف الدراسية اليمنية.');
  console.log('   • 10 معلمين متخصصين في المناهج الوزارية.');
  console.log('   • 8 فصول وشعب دراسية.');
  console.log('   • آلاف سجلات الحضور لـ 14 يوماً مع معدل حضور اليوم 94.3%!');
  console.log('   • إيرادات محصلة تتجاوز 6.8 مليون ريال يمني مع مدفوعات معلقة واضحة.');
  console.log('   • أكثر من 500 درجة أكاديمية في الكنترول مع اختبارات شهرية ونصفية.');
  console.log('   • حركة باصات ونقل، مستودع وكتب وزارية، أنشطة مدرسية، وقاعات امتحانات.');
  console.log('==============================================================================');
  process.exit(0);
}

seedYemeniRealisticData().catch(err => {
  console.error('❌ خطأ أثناء غرس البيانات اليمنية:', err);
  process.exit(1);
});
