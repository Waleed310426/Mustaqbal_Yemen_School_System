-- =============================================
-- قاعدة بيانات نظام إدارة مدرسة مستقبل اليمن
-- schema.sql v1.0 - أغسطس 2026
-- =============================================

CREATE DATABASE IF NOT EXISTS mustaqbal_alyaman
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mustaqbal_alyaman;

-- =============================================
-- جدول الفصول الدراسية (Terms/Semesters)
-- =============================================
CREATE TABLE IF NOT EXISTS terms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT 'اسم الفصل الدراسي',
  academic_year VARCHAR(20) NOT NULL COMMENT 'السنة الدراسية مثل 2025-2026',
  is_current BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- جدول المستخدمين
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
  status ENUM('active', 'suspended') DEFAULT 'active',
  admin_level ENUM('super_admin', 'admin') DEFAULT NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- جدول الفصول الدراسية (Classes/Sections)
-- =============================================
CREATE TABLE IF NOT EXISTS classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grade_level VARCHAR(50) NOT NULL COMMENT 'الصف مثل: الأول، الثاني',
  section VARCHAR(10) NOT NULL COMMENT 'الشعبة مثل: أ، ب',
  capacity INT DEFAULT 40,
  term_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_class (grade_level, section, term_id),
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL
);

-- =============================================
-- جدول الطلاب
-- =============================================
CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  class_id INT,
  birth_date DATE,
  gender ENUM('male', 'female') DEFAULT 'male',
  address TEXT,
  status ENUM('active', 'transferred', 'graduated', 'withdrawn') DEFAULT 'active',
  enrollment_date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- =============================================
-- جدول الآباء / أولياء الأمور
-- =============================================
CREATE TABLE IF NOT EXISTS parents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  occupation VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- ربط الطالب بوليّ أمره (علاقة M:M)
-- =============================================
CREATE TABLE IF NOT EXISTS student_parents (
  student_id INT NOT NULL,
  parent_id INT NOT NULL,
  relationship VARCHAR(50) DEFAULT 'parent' COMMENT 'أب، أم، ولي أمر',
  PRIMARY KEY (student_id, parent_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

-- =============================================
-- جدول المدرسين
-- =============================================
CREATE TABLE IF NOT EXISTS teachers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  specialization VARCHAR(100),
  hire_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- جدول المواد الدراسية
-- =============================================
CREATE TABLE IF NOT EXISTS subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(50) COMMENT 'المرحلة التي تُدرَّس فيها',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ربط المدرس بالمادة والفصل
-- =============================================
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  class_id INT NOT NULL,
  term_id INT,
  UNIQUE KEY unique_assignment (teacher_id, subject_id, class_id, term_id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL
);

-- =============================================
-- جدول الحصص (Periods)
-- =============================================
CREATE TABLE IF NOT EXISTS periods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT 'الحصة الأولى، الثانية...',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  order_num INT DEFAULT 1
);

-- =============================================
-- جدول الجدول الدراسي الأسبوعي
-- =============================================
CREATE TABLE IF NOT EXISTS schedule (
  id INT PRIMARY KEY AUTO_INCREMENT,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  period_id INT NOT NULL,
  day ENUM('sunday','monday','tuesday','wednesday','thursday') NOT NULL,
  term_id INT,
  UNIQUE KEY unique_slot (class_id, period_id, day, term_id),
  UNIQUE KEY unique_teacher_slot (teacher_id, period_id, day, term_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL
);

-- =============================================
-- جدول الحضور والغياب
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  schedule_id INT,
  period_id INT,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
  notes TEXT,
  recorded_by INT NOT NULL COMMENT 'user_id للمدرس أو المدير',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance (student_id, period_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- =============================================
-- جدول الدرجات
-- =============================================
CREATE TABLE IF NOT EXISTS grades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  term_id INT,
  exam_type ENUM('monthly', 'midterm', 'final', 'homework', 'participation') NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) DEFAULT 100,
  notes TEXT,
  entered_by INT NOT NULL COMMENT 'user_id للمدرس',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL,
  FOREIGN KEY (entered_by) REFERENCES users(id)
);

-- =============================================
-- جدول الشهادات
-- =============================================
CREATE TABLE IF NOT EXISTS certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  term_id INT,
  type ENUM('completion', 'honor', 'participation', 'custom') DEFAULT 'completion',
  title VARCHAR(200),
  issue_date DATE DEFAULT (CURRENT_DATE),
  file_url VARCHAR(500),
  issued_by INT COMMENT 'user_id المدير',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL,
  FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- =============================================
-- هيكل الرسوم الدراسية
-- =============================================
CREATE TABLE IF NOT EXISTS fee_structures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grade_level VARCHAR(50),
  student_id INT DEFAULT NULL COMMENT 'رسوم مخصصة لطالب معين',
  term_id INT,
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL
);

-- =============================================
-- جدول الدفعات
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  fee_structure_id INT,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  paid_date DATE,
  status ENUM('pending', 'paid', 'partial', 'overdue') DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'cash',
  receipt_url VARCHAR(500),
  notes TEXT,
  recorded_by INT COMMENT 'user_id المسجِّل',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- =============================================
-- جدول الإشعارات
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT 'المستقبِل',
  sender_id INT COMMENT 'المُرسِل',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('absence', 'grade', 'payment', 'announcement', 'general') DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  reference_id INT COMMENT 'معرف السجل المرتبط',
  reference_type VARCHAR(50) COMMENT 'attendance, grade, payment...',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- سجل النشاط (Activity Log)
-- =============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT COMMENT 'من قام بالفعل',
  action VARCHAR(100) NOT NULL COMMENT 'create, update, delete, login...',
  target_table VARCHAR(100),
  target_id INT,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- إعدادات المدرسة
-- =============================================
CREATE TABLE IF NOT EXISTS school_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_name VARCHAR(200) DEFAULT 'مدرسة مستقبل اليمن',
  logo_url VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(150),
  address TEXT,
  established_year INT,
  current_term_id INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (current_term_id) REFERENCES terms(id) ON DELETE SET NULL
);

-- =============================================
-- إدارة المواصلات - خطوط السير
-- =============================================
CREATE TABLE IF NOT EXISTS bus_routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL COMMENT 'اسم خط السير',
  description TEXT,
  start_point VARCHAR(200) COMMENT 'نقطة البداية',
  end_point VARCHAR(200) COMMENT 'نقطة النهاية',
  distance_km DECIMAL(6,2) COMMENT 'المسافة بالكيلومتر',
  monthly_fee DECIMAL(10,2) DEFAULT 0 COMMENT 'الرسوم الشهرية',
  yearly_fee DECIMAL(10,2) DEFAULT 0 COMMENT 'الرسوم السنوية',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- إدارة المواصلات - الحافلات
-- =============================================
CREATE TABLE IF NOT EXISTS buses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bus_number VARCHAR(50) NOT NULL COMMENT 'رقم الحافلة',
  plate_number VARCHAR(50) COMMENT 'رقم اللوحة',
  driver_name VARCHAR(150) COMMENT 'اسم السائق',
  driver_phone VARCHAR(30) COMMENT 'هاتف السائق',
  capacity INT DEFAULT 40 COMMENT 'السعة',
  route_id INT COMMENT 'خط السير المرتبط',
  status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES bus_routes(id) ON DELETE SET NULL
);

-- =============================================
-- إدارة المواصلات - اشتراكات الطلاب
-- =============================================
CREATE TABLE IF NOT EXISTS bus_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  route_id INT NOT NULL,
  bus_id INT,
  subscription_type ENUM('daily', 'monthly', 'yearly') DEFAULT 'monthly',
  amount DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  pickup_point VARCHAR(200) COMMENT 'نقطة الالتقاط',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES bus_routes(id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL
);

-- =============================================
-- مخازن المدرسة - فئات الأصناف
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL COMMENT 'اسم الفئة: كتب، قرطاسية، أزياء...',
  parent_id INT DEFAULT NULL COMMENT 'فئة أب (هرمي)',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES inventory_categories(id) ON DELETE SET NULL
);

-- =============================================
-- مخازن المدرسة - الأصناف
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL COMMENT 'اسم الصنف',
  category_id INT,
  sku VARCHAR(50) UNIQUE COMMENT 'رمز الصنف',
  unit VARCHAR(50) DEFAULT 'قطعة' COMMENT 'وحدة القياس',
  quantity INT DEFAULT 0 COMMENT 'الكمية المتوفرة',
  min_quantity INT DEFAULT 5 COMMENT 'الحد الأدنى للتنبيه',
  unit_price DECIMAL(10,2) DEFAULT 0 COMMENT 'سعر الوحدة',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES inventory_categories(id) ON DELETE SET NULL
);

-- =============================================
-- مخازن المدرسة - الموردين
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_suppliers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150),
  address TEXT,
  contact_person VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- مخازن المدرسة - أوامر المخزون (توريد/صرف)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_type ENUM('in', 'out') NOT NULL COMMENT 'توريد أو صرف',
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  supplier_id INT DEFAULT NULL,
  recipient VARCHAR(200) COMMENT 'المستلم (في حالة الصرف)',
  order_date DATE DEFAULT (CURRENT_DATE),
  notes TEXT,
  recorded_by INT COMMENT 'user_id',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES inventory_suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- الأنشطة الطلابية - أنواع الأنشطة
-- =============================================
CREATE TABLE IF NOT EXISTS activity_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL COMMENT 'رحلة، مسابقة، ورشة عمل...',
  description TEXT,
  color VARCHAR(20) DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- الأنشطة الطلابية - الأنشطة
-- =============================================
CREATE TABLE IF NOT EXISTS activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(300) NOT NULL,
  type_id INT,
  description TEXT,
  location VARCHAR(200),
  start_date DATETIME NOT NULL,
  end_date DATETIME,
  max_participants INT DEFAULT 0 COMMENT '0 = غير محدود',
  fee DECIMAL(10,2) DEFAULT 0,
  status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
  supervisor_id INT COMMENT 'user_id المشرف',
  term_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES activity_types(id) ON DELETE SET NULL,
  FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL
);

-- =============================================
-- الأنشطة الطلابية - اشتراك الطلاب
-- =============================================
CREATE TABLE IF NOT EXISTS activity_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  activity_id INT NOT NULL,
  student_id INT NOT NULL,
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('registered', 'attended', 'absent', 'cancelled') DEFAULT 'registered',
  notes TEXT,
  UNIQUE KEY unique_participation (activity_id, student_id),
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- =============================================
-- الكنترول - أماكن اللجان
-- =============================================
CREATE TABLE IF NOT EXISTS exam_halls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT 'القاعة أ، القاعة ب...',
  capacity INT DEFAULT 30,
  building VARCHAR(100) COMMENT 'المبنى',
  floor_number INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- الكنترول - أرقام الجلوس
-- =============================================
CREATE TABLE IF NOT EXISTS seat_numbers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  term_id INT,
  seat_number VARCHAR(20) NOT NULL COMMENT 'رقم الجلوس',
  secret_number VARCHAR(20) COMMENT 'الرقم السري',
  hall_id INT COMMENT 'القاعة',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_seat (student_id, term_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL,
  FOREIGN KEY (hall_id) REFERENCES exam_halls(id) ON DELETE SET NULL
);

-- =============================================
-- الكنترول - جدول الامتحانات
-- =============================================
CREATE TABLE IF NOT EXISTS exam_schedule (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  class_id INT NOT NULL,
  term_id INT,
  exam_type ENUM('monthly', 'midterm', 'final') NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  hall_id INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL,
  FOREIGN KEY (hall_id) REFERENCES exam_halls(id) ON DELETE SET NULL
);

-- =============================================
-- المخالفات والسلوكيات
-- =============================================
CREATE TABLE IF NOT EXISTS violations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  violation_type VARCHAR(100) NOT NULL COMMENT 'نوع المخالفة',
  severity ENUM('minor', 'moderate', 'major') DEFAULT 'minor',
  description TEXT,
  action_taken TEXT COMMENT 'الإجراء المتخذ',
  violation_date DATE DEFAULT (CURRENT_DATE),
  recorded_by INT COMMENT 'user_id',
  parent_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- وثائق الطالب (الأرشفة الإلكترونية)
-- =============================================
CREATE TABLE IF NOT EXISTS student_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  document_type VARCHAR(100) NOT NULL COMMENT 'شهادة ميلاد، هوية، صورة...',
  title VARCHAR(200),
  file_url VARCHAR(500) NOT NULL,
  file_size INT COMMENT 'حجم الملف بالبايت',
  uploaded_by INT COMMENT 'user_id',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- قوالب الرسائل
-- =============================================
CREATE TABLE IF NOT EXISTS message_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL COMMENT 'اسم القالب',
  category ENUM('attendance', 'payment', 'grade', 'activity', 'general') DEFAULT 'general',
  subject VARCHAR(300),
  body TEXT NOT NULL,
  variables JSON COMMENT 'المتغيرات المتاحة في القالب',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ترفيع الطلاب
-- =============================================
CREATE TABLE IF NOT EXISTS student_promotions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  from_class_id INT NOT NULL,
  to_class_id INT NOT NULL,
  from_term_id INT NOT NULL,
  to_term_id INT NOT NULL,
  promotion_type ENUM('promoted', 'retained', 'transferred') DEFAULT 'promoted',
  gpa DECIMAL(4,2) COMMENT 'المعدل التراكمي',
  notes TEXT,
  promoted_by INT COMMENT 'user_id',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (from_class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (to_class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (from_term_id) REFERENCES terms(id) ON DELETE CASCADE,
  FOREIGN KEY (to_term_id) REFERENCES terms(id) ON DELETE CASCADE,
  FOREIGN KEY (promoted_by) REFERENCES users(id) ON DELETE SET NULL
);
