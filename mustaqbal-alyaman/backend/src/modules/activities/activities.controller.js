const { ActivityType, Activity, ActivityParticipant } = require('./activities.model');
const AppError = require('../../utils/AppError');

// ---- أنواع الأنشطة ----
exports.getTypes = async (req, res, next) => {
  try {
    const types = await ActivityType.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: types });
  } catch (err) { next(err); }
};

exports.createType = async (req, res, next) => {
  try {
    const t = await ActivityType.create(req.body);
    res.status(201).json({ success: true, data: t });
  } catch (err) { next(err); }
};

exports.updateType = async (req, res, next) => {
  try {
    const t = await ActivityType.findByPk(req.params.id);
    if (!t) throw new AppError('النوع غير موجود', 404);
    await t.update(req.body);
    res.json({ success: true, data: t });
  } catch (err) { next(err); }
};

exports.deleteType = async (req, res, next) => {
  try {
    const t = await ActivityType.findByPk(req.params.id);
    if (!t) throw new AppError('النوع غير موجود', 404);
    await t.destroy();
    res.json({ success: true, message: 'تم الحذف' });
  } catch (err) { next(err); }
};

// ---- الأنشطة ----
exports.getActivities = async (req, res, next) => {
  try {
    const { status, term_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (term_id) where.term_id = term_id;

    const activities = await Activity.findAll({
      where,
      include: [
        { model: ActivityType, as: 'type', attributes: ['id', 'name', 'color'] },
        { model: ActivityParticipant, as: 'participants', attributes: ['id', 'status'] },
      ],
      order: [['start_date', 'DESC']],
    });

    const result = activities.map(a => ({
      ...a.toJSON(),
      participants_count: a.participants?.length || 0,
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.getActivityById = async (req, res, next) => {
  try {
    const a = await Activity.findByPk(req.params.id, {
      include: [
        { model: ActivityType, as: 'type' },
        { model: ActivityParticipant, as: 'participants' },
      ],
    });
    if (!a) throw new AppError('النشاط غير موجود', 404);
    res.json({ success: true, data: a });
  } catch (err) { next(err); }
};

exports.createActivity = async (req, res, next) => {
  try {
    const a = await Activity.create(req.body);
    res.status(201).json({ success: true, data: a });
  } catch (err) { next(err); }
};

exports.updateActivity = async (req, res, next) => {
  try {
    const a = await Activity.findByPk(req.params.id);
    if (!a) throw new AppError('النشاط غير موجود', 404);
    await a.update(req.body);
    res.json({ success: true, data: a });
  } catch (err) { next(err); }
};

exports.deleteActivity = async (req, res, next) => {
  try {
    const a = await Activity.findByPk(req.params.id);
    if (!a) throw new AppError('النشاط غير موجود', 404);
    await a.update({ status: 'cancelled' });
    res.json({ success: true, message: 'تم إلغاء النشاط' });
  } catch (err) { next(err); }
};

// ---- المشاركون ----
exports.getParticipants = async (req, res, next) => {
  try {
    const { activity_id } = req.params;
    const participants = await ActivityParticipant.findAll({
      where: { activity_id },
      order: [['registration_date', 'ASC']],
    });
    res.json({ success: true, data: participants });
  } catch (err) { next(err); }
};

exports.addParticipant = async (req, res, next) => {
  try {
    const { activity_id } = req.params;
    const activity = await Activity.findByPk(activity_id);
    if (!activity) throw new AppError('النشاط غير موجود', 404);

    // التحقق من عدد المشاركين الأقصى
    if (activity.max_participants > 0) {
      const count = await ActivityParticipant.count({ where: { activity_id, status: ['registered', 'attended'] } });
      if (count >= activity.max_participants) throw new AppError('تم الوصول للحد الأقصى للمشاركين', 400);
    }

    const [p, created] = await ActivityParticipant.findOrCreate({
      where: { activity_id, student_id: req.body.student_id },
      defaults: req.body,
    });
    if (!created) throw new AppError('الطالب مسجل بالفعل في هذا النشاط', 409);

    res.status(201).json({ success: true, data: p });
  } catch (err) { next(err); }
};

exports.updateParticipant = async (req, res, next) => {
  try {
    const p = await ActivityParticipant.findByPk(req.params.id);
    if (!p) throw new AppError('المشاركة غير موجودة', 404);
    await p.update(req.body);
    res.json({ success: true, data: p });
  } catch (err) { next(err); }
};

exports.removeParticipant = async (req, res, next) => {
  try {
    const p = await ActivityParticipant.findByPk(req.params.id);
    if (!p) throw new AppError('المشاركة غير موجودة', 404);
    await p.destroy();
    res.json({ success: true, message: 'تم إلغاء تسجيل الطالب' });
  } catch (err) { next(err); }
};
