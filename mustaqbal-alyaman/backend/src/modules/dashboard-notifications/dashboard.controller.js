const { Op } = require('sequelize');
const sequelize = require('../../config/db');
const Notification = require('./notification.model');
const User = require('../auth/user.model');
const { Student, Class, Parent, StudentParent } = require('../students-classes/students.model');
const Attendance = require('../attendance/attendance.model');
const { Grade } = require('../grades-certificates/grades.model');
const { Payment } = require('../payments/payments.model');
const { Teacher, Subject, TeacherSubject, Period, Schedule } = require('../teachers-subjects-schedule/teachers.model');

let io;
const setIo = (socketIo) => { io = socketIo; };

// =================== NOTIFICATIONS ===================

const getNotifications = async (req, res, next) => {
  try {
    const notifs = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ success: true, data: notifs });
  } catch (err) { next(err); }
};

const markAsRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id, id: req.params.id } });
    res.json({ success: true, data: { message: 'تم تمييز الإشعار كمقروء.' } });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id } });
    res.json({ success: true, data: { message: 'تم تمييز كل الإشعارات كمقروءة.' } });
  } catch (err) { next(err); }
};

const sendBroadcast = async (req, res, next) => {
  try {
    const { title, message, target_role, user_ids } = req.body;
    let recipients = [];

    if (user_ids?.length) {
      recipients = user_ids;
    } else if (target_role) {
      const users = await User.findAll({ where: { role: target_role, status: 'active' }, attributes: ['id'] });
      recipients = users.map(u => u.id);
    } else {
      const users = await User.findAll({ where: { status: 'active' }, attributes: ['id'] });
      recipients = users.map(u => u.id);
    }

    const notifs = await Notification.bulkCreate(
      recipients.map(uid => ({
        user_id: uid,
        sender_id: req.user.id,
        title,
        message,
        type: 'announcement',
      }))
    );

    // Socket.io broadcast
    if (io) {
      if (target_role) {
        io.to(`role_${target_role}`).emit('notification', { title, message, type: 'announcement' });
      } else if (user_ids?.length) {
        user_ids.forEach(uid => io.to(`user_${uid}`).emit('notification', { title, message }));
      } else {
        io.emit('notification', { title, message, type: 'announcement' });
      }
    }

    res.status(201).json({ success: true, data: { sent: recipients.length } });
  } catch (err) { next(err); }
};

// =================== DASHBOARD STATS ===================

const getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = new Date().getDay();
    const todayDay = (todayIndex >= 0 && todayIndex <= 4) ? dayNames[todayIndex] : 'sunday';
    const todayStr = new Date().toISOString().split('T')[0];

    if (role === 'admin') {
      const [studentsCount, teachersCount, parentsCount] = await Promise.all([
        Student.count(),
        Teacher.count(),
        User.count({ where: { role: 'parent' } }),
      ]);

      // حضور اليوم
      const todayAttendance = await Attendance.findAll({ where: { date: todayStr } });
      const presentToday = todayAttendance.filter(a => a.status === 'present').length;
      const totalToday = todayAttendance.length;
      const attendanceRate = totalToday > 0 ? ((presentToday / totalToday) * 100).toFixed(1) : 0;

      // الإيرادات
      const payments = await Payment.findAll({ where: { status: 'paid' } });
      const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // رسوم معلقة
      const pendingPayments = await Payment.count({ where: { status: { [Op.in]: ['pending', 'overdue'] } } });

      // حضور آخر 7 أيام
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayAttendance = await Attendance.findAll({ where: { date: dateStr } });
        const rate = dayAttendance.length > 0
          ? ((dayAttendance.filter(a => a.status === 'present').length / dayAttendance.length) * 100).toFixed(0)
          : 0;
        last7Days.push({ date: dateStr, rate: parseInt(rate), total: dayAttendance.length });
      }

      res.json({
        success: true,
        data: {
          studentsCount, teachersCount, parentsCount,
          attendanceRate, presentToday, totalToday,
          totalRevenue, pendingPayments,
          attendanceChart: last7Days,
        },
      });
    } else if (role === 'teacher') {
      const teacher = await Teacher.findOne({
        where: { user_id: req.user.id },
        include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }],
      });

      if (!teacher) {
        return res.json({
          success: true,
          data: {
            teacher: null,
            classesCount: 0,
            subjectsCount: 0,
            studentsCount: 0,
            todaySchedule: [],
            assignedClasses: [],
          },
        });
      }

      // المواد والفصول المسندة
      const assignments = await TeacherSubject.findAll({
        where: { teacher_id: teacher.id },
        include: [
          { model: Class, as: 'class' },
          { model: Subject, as: 'subject' },
        ],
      });

      const classIds = [...new Set(assignments.map(a => a.class_id))];
      const subjectIds = [...new Set(assignments.map(a => a.subject_id))];

      // إجمالي الطلاب في الفصول المسندة للمدرس
      const studentsCount = classIds.length > 0 ? await Student.count({ where: { class_id: { [Op.in]: classIds } } }) : 0;

      // جدول حصص اليوم
      const todaySchedule = await Schedule.findAll({
        where: { teacher_id: teacher.id, day: todayDay },
        include: [
          { model: Subject, as: 'subject', attributes: ['name'] },
          { model: Period, as: 'period', attributes: ['name', 'start_time', 'end_time'] },
          { model: Class, as: 'class', attributes: ['grade_level', 'section'] },
        ],
        order: [[{ model: Period, as: 'period' }, 'order_num', 'ASC']],
      });

      // حضور فصول المدرس المسجل لليوم
      const todayAttendanceCount = classIds.length > 0 ? await Attendance.count({
        where: {
          date: todayStr,
          recorded_by: req.user.id,
        },
      }) : 0;

      res.json({
        success: true,
        data: {
          teacher: {
            id: teacher.id,
            name: teacher.user?.name,
            specialization: teacher.specialization,
            hireDate: teacher.hire_date,
          },
          classesCount: classIds.length,
          subjectsCount: subjectIds.length,
          studentsCount,
          todaySchedule,
          todayAttendanceCount,
          assignedClasses: assignments.map(a => ({
            id: a.id,
            className: `${a.class?.grade_level || ''} - ${a.class?.section || ''}`,
            subjectName: a.subject?.name,
          })),
        },
      });
    } else if (role === 'student') {
      const student = await Student.findOne({
        where: { user_id: req.user.id },
        include: [
          { model: User, as: 'user', attributes: ['name', 'email'] },
          { model: Class, as: 'class', attributes: ['id', 'grade_level', 'section'] },
        ],
      });

      if (!student) {
        return res.json({ success: true, data: { student: null } });
      }

      // الدرجات والمعدل
      const grades = await Grade.findAll({
        where: { student_id: student.id },
        include: [{ model: Subject, as: 'subject', attributes: ['name'] }],
        order: [['created_at', 'DESC']],
      });

      let totalScore = 0, totalMax = 0;
      grades.forEach(g => {
        totalScore += parseFloat(g.score);
        totalMax += parseFloat(g.max_score);
      });
      const gpa = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : 0;

      // الحضور والغياب
      const attendanceRecords = await Attendance.findAll({
        where: { student_id: student.id },
      });
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
      const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
      const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
      const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 100;

      // الرسوم والمدفوعات
      const payments = await Payment.findAll({
        where: { student_id: student.id },
      });
      const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const pendingAmount = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // جدول اليوم
      const todaySchedule = student.class_id ? await Schedule.findAll({
        where: { class_id: student.class_id, day: todayDay },
        include: [
          { model: Subject, as: 'subject', attributes: ['name'] },
          { model: Period, as: 'period', attributes: ['name', 'start_time', 'end_time'] },
          { model: Teacher, as: 'teacher', include: [{ model: User, as: 'user', attributes: ['name'] }] },
        ],
        order: [[{ model: Period, as: 'period' }, 'order_num', 'ASC']],
      }) : [];

      res.json({
        success: true,
        data: {
          student: {
            id: student.id,
            name: student.user?.name,
            class: student.class ? `${student.class.grade_level} - ${student.class.section}` : 'غير مسكن في فصل',
            birthDate: student.birth_date,
            status: student.status,
          },
          gpa,
          gradesCount: grades.length,
          recentGrades: grades.slice(0, 5).map(g => ({
            id: g.id,
            subject: g.subject?.name,
            score: g.score,
            max_score: g.max_score,
            exam_type: g.exam_type,
          })),
          attendance: {
            total: totalDays,
            present: presentDays,
            absent: absentDays,
            late: lateDays,
            rate: attendanceRate,
          },
          payments: {
            totalPaid,
            pendingAmount,
            paymentsCount: payments.length,
          },
          todaySchedule,
        },
      });
    } else if (role === 'parent') {
      const parent = await Parent.findOne({ where: { user_id: req.user.id } });
      if (!parent) {
        return res.json({ success: true, data: { children: [] } });
      }

      const studentParents = await StudentParent.findAll({
        where: { parent_id: parent.id },
        include: [{
          model: Student,
          as: 'student',
          include: [
            { model: User, as: 'user', attributes: ['name', 'email'] },
            { model: Class, as: 'class', attributes: ['grade_level', 'section'] },
          ],
        }],
      });

      const children = [];
      for (const sp of studentParents) {
        const s = sp.student;
        if (!s) continue;

        // معدل درجات الابن
        const grades = await Grade.findAll({ where: { student_id: s.id } });
        let totalScore = 0, totalMax = 0;
        grades.forEach(g => {
          totalScore += parseFloat(g.score);
          totalMax += parseFloat(g.max_score);
        });
        const gpa = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : 0;

        // حضور الابن
        const atts = await Attendance.findAll({ where: { student_id: s.id } });
        const totalDays = atts.length;
        const presentDays = atts.filter(a => a.status === 'present').length;
        const absentDays = atts.filter(a => a.status === 'absent').length;
        const rate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 100;

        // مدفوعات الابن
        const payments = await Payment.findAll({ where: { student_id: s.id } });
        const pendingAmount = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + parseFloat(p.amount), 0);

        children.push({
          id: s.id,
          name: s.user?.name,
          class: s.class ? `${s.class.grade_level} - ${s.class.section}` : '—',
          gpa,
          attendanceRate: rate,
          absentDays,
          pendingAmount,
        });
      }

      res.json({ success: true, data: { children } });
    }
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markAsRead, markAllRead, sendBroadcast, getDashboardStats, setIo };
