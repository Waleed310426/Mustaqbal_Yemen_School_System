const { Op } = require('sequelize');
const sequelize = require('../../config/db');
const { Student, Class, Parent, StudentParent } = require('./students.model');
const User = require('../auth/user.model');
const bcrypt = require('bcrypt');

// =================== CLASSES ===================

const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.findAll({ order: [['grade_level', 'ASC'], ['section', 'ASC']] });
    res.json({ success: true, data: classes });
  } catch (err) { next(err); }
};

const createClass = async (req, res, next) => {
  try {
    const { grade_level, section, capacity, term_id } = req.body;
    if (!grade_level || !section) return res.status(400).json({ success: false, error: 'الصف والشعبة مطلوبان.' });
    const cls = await Class.create({ grade_level, section, capacity, term_id });
    res.status(201).json({ success: true, data: cls });
  } catch (err) { next(err); }
};

const updateClass = async (req, res, next) => {
  try {
    const cls = await Class.findByPk(req.params.id);
    if (!cls) return res.status(404).json({ success: false, error: 'الفصل غير موجود.' });
    await cls.update(req.body);
    res.json({ success: true, data: cls });
  } catch (err) { next(err); }
};

const deleteClass = async (req, res, next) => {
  try {
    const cls = await Class.findByPk(req.params.id);
    if (!cls) return res.status(404).json({ success: false, error: 'الفصل غير موجود.' });
    await cls.destroy();
    res.json({ success: true, data: { message: 'تم حذف الفصل بنجاح.' } });
  } catch (err) { next(err); }
};

// =================== STUDENTS ===================

const getStudents = async (req, res, next) => {
  try {
    const { class_id, status, search } = req.query;
    const where = {};
    if (class_id) where.class_id = class_id;
    if (status) where.status = status;

    const userWhere = {};
    if (search) userWhere.name = { [Op.like]: `%${search}%` };

    const students = await Student.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] }, where: userWhere },
        { model: Class, as: 'class', required: false },
      ],
      order: [[{ model: User, as: 'user' }, 'name', 'ASC']],
    });
    res.json({ success: true, data: students });
  } catch (err) { next(err); }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: Class, as: 'class', required: false },
      ],
    });
    if (!student) return res.status(404).json({ success: false, error: 'الطالب غير موجود.' });
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
};

const createStudent = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, email, password, class_id, birth_date, gender, address } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: 'الاسم والبريد وكلمة المرور مطلوبة.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role: 'student' }, { transaction: t });
    const student = await Student.create({ user_id: user.id, class_id, birth_date, gender, address }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, data: { ...student.toJSON(), user: { id: user.id, name: user.name, email: user.email } } });
  } catch (err) { await t.rollback(); next(err); }
};

const updateStudent = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const student = await Student.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
    if (!student) return res.status(404).json({ success: false, error: 'الطالب غير موجود.' });

    const { name, email, phone, avatar_url, class_id, birth_date, gender, address, status } = req.body;

    if (name || email || phone) {
      await student.user.update({ name, email, phone, avatar_url }, { transaction: t });
    }
    await student.update({ class_id, birth_date, gender, address, status }, { transaction: t });
    await t.commit();
    res.json({ success: true, data: student });
  } catch (err) { await t.rollback(); next(err); }
};

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ success: false, error: 'الطالب غير موجود.' });
    await User.destroy({ where: { id: student.user_id } }); // cascades to student
    res.json({ success: true, data: { message: 'تم حذف الطالب بنجاح.' } });
  } catch (err) { next(err); }
};

const transferStudent = async (req, res, next) => {
  try {
    const { class_id } = req.body;
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ success: false, error: 'الطالب غير موجود.' });
    await student.update({ class_id });
    res.json({ success: true, data: { message: 'تم نقل الطالب بنجاح.' } });
  } catch (err) { next(err); }
};

// =================== USERS MANAGEMENT (Admin) ===================
const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const where = {};
    if (role) where.role = role;
    const users = await User.findAll({ where, attributes: { exclude: ['password'] }, order: [['created_at', 'DESC']] });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ success: false, error: 'جميع الحقول مطلوبة.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role, phone });
    res.status(201).json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'المستخدم غير موجود.' });
    await user.update({ status });
    res.json({ success: true, data: { message: `تم تحديث حالة المستخدم إلى ${status}.` } });
  } catch (err) { next(err); }
};

module.exports = {
  getClasses, createClass, updateClass, deleteClass,
  getStudents, getStudentById, createStudent, updateStudent, deleteStudent, transferStudent,
  getUsers, createUser, updateUserStatus,
};
