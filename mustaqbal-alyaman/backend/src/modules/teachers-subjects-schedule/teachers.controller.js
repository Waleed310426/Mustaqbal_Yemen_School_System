const { Op } = require('sequelize');
const sequelize = require('../../config/db');
const { Teacher, Subject, TeacherSubject, Period, Schedule } = require('./teachers.model');
const User = require('../auth/user.model');
const bcrypt = require('bcrypt');

// =================== TEACHERS ===================

const getTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.findAll({
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
      order: [[{ model: User, as: 'user' }, 'name', 'ASC']],
    });
    res.json({ success: true, data: teachers });
  } catch (err) { next(err); }
};

const createTeacher = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, email, password, specialization, hire_date, phone } = req.body;
    const hashed = await bcrypt.hash(password || 'Pass@1234', 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role: 'teacher', phone }, { transaction: t });
    const teacher = await Teacher.create({ user_id: user.id, specialization, hire_date }, { transaction: t });
    await t.commit();
    res.status(201).json({ success: true, data: teacher });
  } catch (err) { await t.rollback(); next(err); }
};

const updateTeacher = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const teacher = await Teacher.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
    if (!teacher) return res.status(404).json({ success: false, error: 'المدرس غير موجود.' });
    const { name, email, phone, specialization, hire_date } = req.body;
    if (name || email || phone) await teacher.user.update({ name, email, phone }, { transaction: t });
    await teacher.update({ specialization, hire_date }, { transaction: t });
    await t.commit();
    res.json({ success: true, data: teacher });
  } catch (err) { await t.rollback(); next(err); }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, error: 'المدرس غير موجود.' });
    await User.destroy({ where: { id: teacher.user_id } });
    res.json({ success: true, data: { message: 'تم حذف المدرس بنجاح.' } });
  } catch (err) { next(err); }
};

// =================== SUBJECTS ===================

const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: subjects });
  } catch (err) { next(err); }
};

const createSubject = async (req, res, next) => {
  try {
    const { name, grade_level, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'اسم المادة مطلوب.' });
    const subject = await Subject.create({ name, grade_level, description });
    res.status(201).json({ success: true, data: subject });
  } catch (err) { next(err); }
};

const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) return res.status(404).json({ success: false, error: 'المادة غير موجودة.' });
    await subject.update(req.body);
    res.json({ success: true, data: subject });
  } catch (err) { next(err); }
};

const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) return res.status(404).json({ success: false, error: 'المادة غير موجودة.' });
    await subject.destroy();
    res.json({ success: true, data: { message: 'تم حذف المادة.' } });
  } catch (err) { next(err); }
};

// =================== TEACHER SUBJECTS ASSIGNMENTS ===================

const assignTeacherSubject = async (req, res, next) => {
  try {
    const { teacher_id, subject_id, class_id, term_id } = req.body;
    const assignment = await TeacherSubject.create({ teacher_id, subject_id, class_id, term_id });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) { next(err); }
};

const removeTeacherSubject = async (req, res, next) => {
  try {
    await TeacherSubject.destroy({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'تم إلغاء الإسناد.' } });
  } catch (err) { next(err); }
};

// =================== PERIODS ===================

const getPeriods = async (req, res, next) => {
  try {
    const periods = await Period.findAll({ order: [['order_num', 'ASC']] });
    res.json({ success: true, data: periods });
  } catch (err) { next(err); }
};

// =================== SCHEDULE ===================

const getScheduleByClass = async (req, res, next) => {
  try {
    let { class_id, term_id, teacher_id } = req.query;
    const where = {};

    if (req.user.role === 'student') {
      const { Student } = require('../students-classes/students.model');
      const student = await Student.findOne({ where: { user_id: req.user.id } });
      if (student && student.class_id) {
        where.class_id = student.class_id;
      }
    } else if (req.user.role === 'teacher' && !class_id && !teacher_id) {
      const teacher = await Teacher.findOne({ where: { user_id: req.user.id } });
      if (teacher) {
        where.teacher_id = teacher.id;
      }
    } else {
      if (class_id) where.class_id = class_id;
      if (teacher_id) where.teacher_id = teacher_id;
    }

    if (term_id) where.term_id = term_id;

    const { Class } = require('../students-classes/students.model');
    const schedule = await Schedule.findAll({
      where,
      include: [
        { model: Subject, as: 'subject' },
        { model: Teacher, as: 'teacher', include: [{ model: User, as: 'user', attributes: ['name'] }] },
        { model: Period, as: 'period' },
        { model: Class, as: 'class' },
      ],
      order: [['day', 'ASC'], [{ model: Period, as: 'period' }, 'order_num', 'ASC']],
    });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
};

const createScheduleEntry = async (req, res, next) => {
  try {
    const { class_id, subject_id, teacher_id, period_id, day, term_id } = req.body;
    const entry = await Schedule.create({ class_id, subject_id, teacher_id, period_id, day, term_id });
    res.status(201).json({ success: true, data: entry });
  } catch (err) { next(err); }
};

const deleteScheduleEntry = async (req, res, next) => {
  try {
    await Schedule.destroy({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'تم حذف الحصة من الجدول.' } });
  } catch (err) { next(err); }
};

module.exports = {
  getTeachers, createTeacher, updateTeacher, deleteTeacher,
  getSubjects, createSubject, updateSubject, deleteSubject,
  assignTeacherSubject, removeTeacherSubject,
  getPeriods,
  getScheduleByClass, createScheduleEntry, deleteScheduleEntry,
};
