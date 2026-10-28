const { Op } = require('sequelize');
const sequelize = require('../../config/db');
const { BusRoute, Bus, BusSubscription } = require('./transportation.model');
const AppError = require('../../utils/AppError');

// ==================== خطوط السير ====================

/** GET /api/transportation/routes */
exports.getRoutes = async (req, res, next) => {
  try {
    const routes = await BusRoute.findAll({
      include: [{ model: Bus, as: 'buses', attributes: ['id', 'bus_number', 'driver_name', 'status'] }],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: routes });
  } catch (err) { next(err); }
};

/** POST /api/transportation/routes */
exports.createRoute = async (req, res, next) => {
  try {
    const route = await BusRoute.create(req.body);
    res.status(201).json({ success: true, data: route });
  } catch (err) { next(err); }
};

/** PUT /api/transportation/routes/:id */
exports.updateRoute = async (req, res, next) => {
  try {
    const route = await BusRoute.findByPk(req.params.id);
    if (!route) throw new AppError('خط السير غير موجود', 404);
    await route.update(req.body);
    res.json({ success: true, data: route });
  } catch (err) { next(err); }
};

/** DELETE /api/transportation/routes/:id */
exports.deleteRoute = async (req, res, next) => {
  try {
    const route = await BusRoute.findByPk(req.params.id);
    if (!route) throw new AppError('خط السير غير موجود', 404);
    await route.destroy();
    res.json({ success: true, message: 'تم حذف خط السير بنجاح' });
  } catch (err) { next(err); }
};

// ==================== الحافلات ====================

/** GET /api/transportation/buses */
exports.getBuses = async (req, res, next) => {
  try {
    const buses = await Bus.findAll({
      include: [{ model: BusRoute, as: 'route', attributes: ['id', 'name'] }],
      order: [['bus_number', 'ASC']],
    });
    res.json({ success: true, data: buses });
  } catch (err) { next(err); }
};

/** POST /api/transportation/buses */
exports.createBus = async (req, res, next) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json({ success: true, data: bus });
  } catch (err) { next(err); }
};

/** PUT /api/transportation/buses/:id */
exports.updateBus = async (req, res, next) => {
  try {
    const bus = await Bus.findByPk(req.params.id);
    if (!bus) throw new AppError('الحافلة غير موجودة', 404);
    await bus.update(req.body);
    res.json({ success: true, data: bus });
  } catch (err) { next(err); }
};

/** DELETE /api/transportation/buses/:id */
exports.deleteBus = async (req, res, next) => {
  try {
    const bus = await Bus.findByPk(req.params.id);
    if (!bus) throw new AppError('الحافلة غير موجودة', 404);
    await bus.destroy();
    res.json({ success: true, message: 'تم حذف الحافلة بنجاح' });
  } catch (err) { next(err); }
};

// ==================== الاشتراكات ====================

/** GET /api/transportation/subscriptions */
exports.getSubscriptions = async (req, res, next) => {
  try {
    const { student_id, route_id, status } = req.query;
    const where = {};
    if (student_id) where.student_id = student_id;
    if (route_id) where.route_id = route_id;
    if (status) where.status = status;

    const subs = await BusSubscription.findAll({
      where,
      include: [
        { model: BusRoute, as: 'route', attributes: ['id', 'name'] },
        { model: Bus, as: 'bus', attributes: ['id', 'bus_number', 'driver_name', 'driver_phone'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: subs });
  } catch (err) { next(err); }
};

/** POST /api/transportation/subscriptions */
exports.createSubscription = async (req, res, next) => {
  try {
    // التحقق من وجود اشتراك نشط للطالب على نفس الخط
    const existing = await BusSubscription.findOne({
      where: { student_id: req.body.student_id, status: 'active' },
    });
    if (existing) throw new AppError('الطالب لديه اشتراك نشط بالفعل', 400);

    const sub = await BusSubscription.create(req.body);
    res.status(201).json({ success: true, data: sub });
  } catch (err) { next(err); }
};

/** PUT /api/transportation/subscriptions/:id */
exports.updateSubscription = async (req, res, next) => {
  try {
    const sub = await BusSubscription.findByPk(req.params.id);
    if (!sub) throw new AppError('الاشتراك غير موجود', 404);
    await sub.update(req.body);
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
};

/** DELETE /api/transportation/subscriptions/:id */
exports.deleteSubscription = async (req, res, next) => {
  try {
    const sub = await BusSubscription.findByPk(req.params.id);
    if (!sub) throw new AppError('الاشتراك غير موجود', 404);
    await sub.destroy();
    res.json({ success: true, message: 'تم إلغاء الاشتراك بنجاح' });
  } catch (err) { next(err); }
};

/** GET /api/transportation/stats */
exports.getStats = async (req, res, next) => {
  try {
    const [totalRoutes, totalBuses, activeSubscriptions] = await Promise.all([
      BusRoute.count({ where: { is_active: true } }),
      Bus.count({ where: { status: 'active' } }),
      BusSubscription.count({ where: { status: 'active' } }),
    ]);

    // إجمالي الإيرادات الشهرية المتوقعة
    const revenueResult = await sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM bus_subscriptions WHERE status = 'active'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const monthlyRevenue = revenueResult[0]?.total || 0;

    res.json({
      success: true,
      data: { totalRoutes, totalBuses, activeSubscriptions, monthlyRevenue },
    });
  } catch (err) { next(err); }
};
