-- =============================================
-- بيانات تجريبية لنظام مدرسة مستقبل اليمن
-- seed.sql - كلمة مرور الجميع: Pass@1234
-- =============================================

USE mustaqbal_alyaman;

-- الفصل الدراسي الحالي
INSERT INTO terms (name, academic_year, is_current, start_date, end_date) VALUES
('الفصل الأول', '2025-2026', TRUE, '2025-09-01', '2026-01-31'),
('الفصل الثاني', '2025-2026', FALSE, '2026-02-01', '2026-06-30');

-- إعدادات المدرسة
INSERT INTO school_settings (school_name, phone, email, address, established_year, current_term_id) VALUES
('مدرسة مستقبل اليمن', '+967-1-234567', 'info@mustaqbal-alyaman.edu.ye', 'صنعاء، اليمن', 2010, 1);

-- الحصص الدراسية
INSERT INTO periods (name, start_time, end_time, order_num) VALUES
('الحصة الأولى', '07:30:00', '08:15:00', 1),
('الحصة الثانية', '08:20:00', '09:05:00', 2),
('الحصة الثالثة', '09:10:00', '09:55:00', 3),
('الحصة الرابعة', '10:10:00', '10:55:00', 4),
('الحصة الخامسة', '11:00:00', '11:45:00', 5),
('الحصة السادسة', '11:50:00', '12:35:00', 6);

-- المستخدمون (كلمة المرور: Pass@1234 = bcrypt hash)
-- ملاحظة: يجب تشغيل hashPasswords.js لتوليد الـ hash الصحيح
-- هذه قيم مؤقتة للتطوير
INSERT INTO users (name, email, password, role, status) VALUES
('المدير العام', 'admin@school.ye', '$2b$10$J48jhch/GeebdHfe2CkgbuZ4oCpCWizh2oOiCaLRQ8kgzFRYbfStC', 'admin', 'active'),
('أحمد محمد علي', 'ahmed.teacher@school.ye', '$2b$10$J48jhch/GeebdHfe2CkgbuZ4oCpCWizh2oOiCaLRQ8kgzFRYbfStC', 'teacher', 'active'),
('فاطمة عبدالله', 'fatima.teacher@school.ye', '$2b$10$J48jhch/GeebdHfe2CkgbuZ4oCpCWizh2oOiCaLRQ8kgzFRYbfStC', 'teacher', 'active'),
('محمد سالم', 'student1@school.ye', '$2b$10$J48jhch/GeebdHfe2CkgbuZ4oCpCWizh2oOiCaLRQ8kgzFRYbfStC', 'student', 'active'),
('نور أحمد', 'student2@school.ye', '$2b$10$J48jhch/GeebdHfe2CkgbuZ4oCpCWizh2oOiCaLRQ8kgzFRYbfStC', 'student', 'active'),
('عبدالله سالم', 'parent1@school.ye', '$2b$10$J48jhch/GeebdHfe2CkgbuZ4oCpCWizh2oOiCaLRQ8kgzFRYbfStC', 'parent', 'active');

-- الفصول
INSERT INTO classes (grade_level, section, capacity, term_id) VALUES
('الصف السابع', 'أ', 35, 1),
('الصف السابع', 'ب', 35, 1),
('الصف الثامن', 'أ', 35, 1),
('الصف التاسع', 'أ', 35, 1);

-- المدرسون
INSERT INTO teachers (user_id, specialization, hire_date) VALUES
(2, 'الرياضيات', '2020-09-01'),
(3, 'اللغة العربية', '2021-09-01');

-- الطلاب
INSERT INTO students (user_id, class_id, birth_date, gender) VALUES
(4, 1, '2012-03-15', 'male'),
(5, 1, '2012-07-22', 'female');

-- أولياء الأمور
INSERT INTO parents (user_id, occupation) VALUES
(6, 'موظف حكومي');

-- ربط الطالب بولي الأمر
INSERT INTO student_parents (student_id, parent_id, relationship) VALUES
(1, 1, 'أب');

-- المواد الدراسية
INSERT INTO subjects (name, grade_level) VALUES
('الرياضيات', 'الصف السابع'),
('اللغة العربية', 'الصف السابع'),
('العلوم', 'الصف السابع'),
('التربية الإسلامية', 'الصف السابع'),
('الرياضيات', 'الصف الثامن'),
('اللغة العربية', 'الصف الثامن');

-- إسناد المواد للمدرسين
INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, term_id) VALUES
(1, 1, 1, 1),
(1, 1, 2, 1),
(2, 2, 1, 1),
(2, 2, 2, 1);

-- هيكل الرسوم
INSERT INTO fee_structures (grade_level, term_id, amount, description) VALUES
('الصف السابع', 1, 50000, 'رسوم الفصل الأول - الصف السابع'),
('الصف الثامن', 1, 55000, 'رسوم الفصل الأول - الصف الثامن'),
('الصف التاسع', 1, 60000, 'رسوم الفصل الأول - الصف التاسع');
