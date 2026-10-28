const sequelize = require('../../config/db');
const { ExamHall, SeatNumber, ExamSchedule } = require('./exams.model');
const AppError = require('../../utils/AppError');

// ==================== قاعات الامتحانات ====================
exports.getHalls = async (req, res, next) => {
  try {
    const halls = await ExamHall.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
    res.json({ success: true, data: halls });
  } catch (err) { next(err); }
};

exports.createHall = async (req, res, next) => {
  try {
    const hall = await ExamHall.create(req.body);
    res.status(201).json({ success: true, data: hall });
  } catch (err) { next(err); }
};

exports.updateHall = async (req, res, next) => {
  try {
    const hall = await ExamHall.findByPk(req.params.id);
    if (!hall) throw new AppError('القاعة غير موجودة', 404);
    await hall.update(req.body);
    res.json({ success: true, data: hall });
  } catch (err) { next(err); }
};

exports.deleteHall = async (req, res, next) => {
  try {
    const hall = await ExamHall.findByPk(req.params.id);
    if (!hall) throw new AppError('القاعة غير موجودة', 404);
    await hall.update({ is_active: false });
    res.json({ success: true, message: 'تم حذف القاعة' });
  } catch (err) { next(err); }
};

// ==================== أرقام الجلوس ====================
exports.getSeatNumbers = async (req, res, next) => {
  try {
    const { term_id, class_id } = req.query;
    const where = {};
    if (term_id) where.term_id = term_id;

    const seats = await SeatNumber.findAll({
      where,
      include: [{ model: ExamHall, as: 'hall', attributes: ['id', 'name'] }],
      order: [['seat_number', 'ASC']],
    });
    res.json({ success: true, data: seats });
  } catch (err) { next(err); }
};

/** توليد أرقام جلوس تلقائياً لفصل/فترة */
exports.generateSeatNumbers = async (req, res, next) => {
  try {
    const { term_id, class_id, prefix = 'S', start_from = 1 } = req.body;

    // جلب طلاب الفصل
    const students = await sequelize.query(
      `SELECT id FROM students WHERE class_id = :class_id AND status = 'active' ORDER BY id`,
      { replacements: { class_id }, type: sequelize.QueryTypes.SELECT }
    );

    if (students.length === 0) throw new AppError('لا يوجد طلاب في هذا الفصل', 404);

    const halls = await ExamHall.findAll({ where: { is_active: true }, order: [['id', 'ASC']] });
    let hallIndex = 0, seatInHall = 0;
    const results = [];

    for (let i = 0; i < students.length; i++) {
      const seatNum = `${prefix}${String(parseInt(start_from) + i).padStart(4, '0')}`;
      const secretNum = String(Math.floor(10000 + Math.random() * 90000));

      // توزيع على القاعات
      if (halls.length > 0) {
        const currentHall = halls[hallIndex];
        seatInHall++;
        if (seatInHall >= currentHall.capacity && hallIndex < halls.length - 1) {
          hallIndex++;
          seatInHall = 0;
        }
      }

      // إضافة أو تحديث رقم الجلوس
      const [seat] = await SeatNumber.upsert({
        student_id: students[i].id,
        term_id,
        seat_number: seatNum,
        secret_number: secretNum,
        hall_id: halls[hallIndex]?.id || null,
      });
      results.push(seat);
    }

    res.json({ success: true, data: results, count: results.length });
  } catch (err) { next(err); }
};

exports.updateSeat = async (req, res, next) => {
  try {
    const seat = await SeatNumber.findByPk(req.params.id);
    if (!seat) throw new AppError('رقم الجلوس غير موجود', 404);
    await seat.update(req.body);
    res.json({ success: true, data: seat });
  } catch (err) { next(err); }
};

exports.deleteSeat = async (req, res, next) => {
  try {
    const seat = await SeatNumber.findByPk(req.params.id);
    if (!seat) throw new AppError('رقم الجلوس غير موجود', 404);
    await seat.destroy();
    res.json({ success: true, message: 'تم حذف رقم الجلوس' });
  } catch (err) { next(err); }
};

// ==================== جدول الامتحانات ====================
exports.getExamSchedule = async (req, res, next) => {
  try {
    const { term_id, class_id, exam_type } = req.query;
    const where = {};
    if (term_id) where.term_id = term_id;
    if (class_id) where.class_id = class_id;
    if (exam_type) where.exam_type = exam_type;

    const exams = await ExamSchedule.findAll({
      where,
      include: [{ model: ExamHall, as: 'hall', attributes: ['id', 'name'] }],
      order: [['exam_date', 'ASC'], ['start_time', 'ASC']],
    });
    res.json({ success: true, data: exams });
  } catch (err) { next(err); }
};

exports.createExam = async (req, res, next) => {
  try {
    const exam = await ExamSchedule.create(req.body);
    res.status(201).json({ success: true, data: exam });
  } catch (err) { next(err); }
};

exports.updateExam = async (req, res, next) => {
  try {
    const exam = await ExamSchedule.findByPk(req.params.id);
    if (!exam) throw new AppError('الامتحان غير موجود', 404);
    await exam.update(req.body);
    res.json({ success: true, data: exam });
  } catch (err) { next(err); }
};

exports.deleteExam = async (req, res, next) => {
  try {
    const exam = await ExamSchedule.findByPk(req.params.id);
    if (!exam) throw new AppError('الامتحان غير موجود', 404);
    await exam.destroy();
    res.json({ success: true, message: 'تم حذف الامتحان' });
  } catch (err) { next(err); }
};

// ==================== كشف المناداة ====================
exports.getAttendanceSheet = async (req, res, next) => {
  try {
    const { term_id, class_id } = req.query;

    const rows = await sequelize.query(
      `SELECT sn.seat_number, sn.secret_number, sn.hall_id,
              u.name AS student_name, eh.name AS hall_name
       FROM seat_numbers sn
       JOIN students s ON sn.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN exam_halls eh ON sn.hall_id = eh.id
       WHERE sn.term_id = :term_id
         AND s.class_id = :class_id
       ORDER BY sn.seat_number`,
      { replacements: { term_id, class_id }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};
