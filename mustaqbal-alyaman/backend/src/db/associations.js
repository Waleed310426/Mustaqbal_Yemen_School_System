const User = require('../modules/auth/user.model');
const { Student, Class, Parent, StudentParent } = require('../modules/students-classes/students.model');
const { Teacher, Subject, TeacherSubject, Period, Schedule } = require('../modules/teachers-subjects-schedule/teachers.model');
const Attendance = require('../modules/attendance/attendance.model');
const { Grade, Certificate } = require('../modules/grades-certificates/grades.model');
const { FeeStructure, Payment } = require('../modules/payments/payments.model');

function setupAssociations() {
  // User <-> Student
  User.hasOne(Student, { foreignKey: 'user_id', as: 'student' });
  Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Student <-> Class
  Class.hasMany(Student, { foreignKey: 'class_id', as: 'students' });
  Student.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });

  // User <-> Parent
  User.hasOne(Parent, { foreignKey: 'user_id', as: 'parent' });
  Parent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Student <-> Parent (M:N)
  Student.belongsToMany(Parent, { through: StudentParent, foreignKey: 'student_id', otherKey: 'parent_id', as: 'parents' });
  Parent.belongsToMany(Student, { through: StudentParent, foreignKey: 'parent_id', otherKey: 'student_id', as: 'students' });
  StudentParent.belongsTo(Parent, { foreignKey: 'parent_id', as: 'parent' });
  StudentParent.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

  // User <-> Teacher
  User.hasOne(Teacher, { foreignKey: 'user_id', as: 'teacher' });
  Teacher.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Teacher <-> TeacherSubject <-> Subject / Class
  Teacher.hasMany(TeacherSubject, { foreignKey: 'teacher_id', as: 'assignments' });
  TeacherSubject.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
  Subject.hasMany(TeacherSubject, { foreignKey: 'subject_id', as: 'teacherSubjects' });
  TeacherSubject.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
  Class.hasMany(TeacherSubject, { foreignKey: 'class_id', as: 'teacherSubjects' });
  TeacherSubject.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });

  // Schedule
  Schedule.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
  Schedule.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
  Schedule.belongsTo(Period, { foreignKey: 'period_id', as: 'period' });
  Schedule.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
  Class.hasMany(Schedule, { foreignKey: 'class_id', as: 'schedules' });

  // Attendance
  Student.hasMany(Attendance, { foreignKey: 'student_id', as: 'attendanceRecords' });
  Attendance.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
  Attendance.belongsTo(Period, { foreignKey: 'period_id', as: 'period' });

  // Grade & Certificate
  Student.hasMany(Grade, { foreignKey: 'student_id', as: 'grades' });
  Grade.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
  Subject.hasMany(Grade, { foreignKey: 'subject_id', as: 'grades' });
  Grade.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

  Student.hasMany(Certificate, { foreignKey: 'student_id', as: 'certificates' });
  Certificate.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

  // Payments & Fees
  Student.hasMany(Payment, { foreignKey: 'student_id', as: 'payments' });
  Payment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
  FeeStructure.hasMany(Payment, { foreignKey: 'fee_structure_id', as: 'payments' });
  Payment.belongsTo(FeeStructure, { foreignKey: 'fee_structure_id', as: 'feeStructure' });
}

module.exports = setupAssociations;
