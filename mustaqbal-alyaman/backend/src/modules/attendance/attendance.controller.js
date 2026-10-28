const sequelize = require('../../config/db');
const Attendance = require('./attendance.model');
const { Student } = require('../students-classes/students.model');
const { TeacherSubject } = require('../teachers-subjects-schedule/teachers.model');
const User = require('../auth/user.model');
const Notification = require('../dashboard-notifications/notification.model');
const { StudentParent } = require('../students-classes/students.model');
const { Parent } = require('../students-classes/students.model');

let io; // will be injected from server.js

const setIo = (socketIo) => { io = socketIo; };

/**
 * POST /api/attendance — تسجيل جماعي لحصة
 * body: { class_id, period_id, date, records: [{student_id, status, notes}] }
 */
const createAttendance = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { period_id, date, records } = req.body;
    if (!period_id || !date || !records?.length) {
      return res.status(400).json({ success: false, error: 'الحصة والتاريخ وسجلات الطلاب مطلوبة.' });
    }

    const created = [];
    const notifications = [];

    for (const record of records) {
      const entry = await Attendance.create({
        student_id: record.student_id,
        period_id,
        date,
        status: record.status || 'present',
        notes: record.notes,
        recorded_by: req.user.id,
      }, { transaction: t });
      created.push(entry);

      // إشعار عند الغياب
      if (record.status === 'absent' || record.status === 'late') {
        // البحث عن ولي أمر الطالب
        const studentParents = await StudentParent.findAll({
          where: { student_id: record.student_id },
          include: [{ model: Parent, as: 'parent' }],
          transaction: t,
        });

        for (const sp of studentParents) {
          const notif = await Notification.create({
            user_id: sp.parent.user_id,
            sender_id: req.user.id,
            title: record.status === 'absent' ? 'غياب الطالب' : 'تأخر الطالب',
            message: `تم تسجيل ${record.status === 'absent' ? 'غياب' : 'تأخر'} ابنك/ابنتك بتاريخ ${date}`,
            type: 'absence',
            reference_id: entry.id,
            reference_type: 'attendance',
          }, { transaction: t });
          notifications.push({ userId: sp.parent.user_id, notif });
        }
      }
    }

    await t.commit();

    // إرسال إشعارات Socket.io
    if (io) {
      for (const { userId, notif } of notifications) {
        io.to(`user_${userId}`).emit('notification', notif);
      }
    }

    res.status(201).json({ success: true, data: created });
  } catch (err) { await t.rollback(); next(err); }
};

/**
 * PUT /api/attendance/:id — تعديل سجل (Admin فقط)
 */
const updateAttendance = async (req, res, next) => {
  try {
    const entry = await Attendance.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ success: false, error: 'السجل غير موجود.' });
    await entry.update({ status: req.body.status, notes: req.body.notes });
    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/attendance/:id (Admin فقط)
 */
const deleteAttendance = async (req, res, next) => {
  try {
    const entry = await Attendance.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ success: false, error: 'السجل غير موجود.' });
    await entry.destroy();
    res.json({ success: true, data: { message: 'تم حذف سجل الحضور.' } });
  } catch (err) { next(err); }
};

/**
 * GET /api/attendance?class_id=&date=
 */
const getAttendance = async (req, res, next) => {
  try {
    let { date, period_id, student_id } = req.query;
    const where = {};

    if (req.user.role === 'student') {
      const studentRec = await Student.findOne({ where: { user_id: req.user.id } });
      if (studentRec) where.student_id = studentRec.id;
    } else if (student_id) {
      where.student_id = student_id;
    }

    if (date) where.date = date;
    if (period_id) where.period_id = period_id;

    const records = await Attendance.findAll({
      where,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name', 'id'] }] },
      ],
      order: [['date', 'DESC']],
    });
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
};

/**
 * GET /api/attendance/report?student_id=&from=&to=
 */
const getAttendanceReport = async (req, res, next) => {
  try {
    let { student_id, from, to } = req.query;
    const where = {};

    if (req.user.role === 'student') {
      const studentRec = await Student.findOne({ where: { user_id: req.user.id } });
      if (studentRec) where.student_id = studentRec.id;
    } else if (student_id) {
      where.student_id = student_id;
    }

    if (from && to) where.date = { [require('sequelize').Op.between]: [from, to] };

    const records = await Attendance.findAll({ where, order: [['date', 'ASC']] });

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    res.json({
      success: true, data: {
        records, summary: { total, present, absent, late, excused, attendanceRate },
      },
    });
  } catch (err) { next(err); }
};

module.exports = { createAttendance, updateAttendance, deleteAttendance, getAttendance, getAttendanceReport, setIo };
