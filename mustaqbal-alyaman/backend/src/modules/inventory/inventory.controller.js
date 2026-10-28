const sequelize = require('../../config/db');
const { InventoryCategory, InventoryItem, InventorySupplier, InventoryOrder } = require('./inventory.model');
const AppError = require('../../utils/AppError');

// ==================== الفئات ====================
exports.getCategories = async (req, res, next) => {
  try {
    const cats = await InventoryCategory.findAll({
      where: { parent_id: null },
      include: [{ model: InventoryCategory, as: 'children' }],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: cats });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const cat = await InventoryCategory.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const cat = await InventoryCategory.findByPk(req.params.id);
    if (!cat) throw new AppError('الفئة غير موجودة', 404);
    await cat.update(req.body);
    res.json({ success: true, data: cat });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const cat = await InventoryCategory.findByPk(req.params.id);
    if (!cat) throw new AppError('الفئة غير موجودة', 404);
    await cat.destroy();
    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (err) { next(err); }
};

// ==================== الأصناف ====================
exports.getItems = async (req, res, next) => {
  try {
    const { category_id, low_stock } = req.query;
    const where = { is_active: true };
    if (category_id) where.category_id = category_id;

    let items = await InventoryItem.findAll({
      where,
      include: [{ model: InventoryCategory, as: 'category', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });

    // فلترة الأصناف منخفضة المخزون
    if (low_stock === 'true') {
      items = items.filter(i => i.quantity <= i.min_quantity);
    }

    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

exports.getItemById = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id, {
      include: [
        { model: InventoryCategory, as: 'category' },
        {
          model: InventoryOrder, as: 'orders',
          include: [{ model: InventorySupplier, as: 'supplier', attributes: ['id', 'name'] }],
          limit: 20,
          order: [['created_at', 'DESC']],
        },
      ],
    });
    if (!item) throw new AppError('الصنف غير موجود', 404);
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

exports.createItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) throw new AppError('الصنف غير موجود', 404);
    await item.update(req.body);
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) throw new AppError('الصنف غير موجود', 404);
    await item.update({ is_active: false }); // soft delete
    res.json({ success: true, message: 'تم إلغاء تفعيل الصنف' });
  } catch (err) { next(err); }
};

// ==================== الموردون ====================
exports.getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await InventorySupplier.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: suppliers });
  } catch (err) { next(err); }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const s = await InventorySupplier.create(req.body);
    res.status(201).json({ success: true, data: s });
  } catch (err) { next(err); }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const s = await InventorySupplier.findByPk(req.params.id);
    if (!s) throw new AppError('المورد غير موجود', 404);
    await s.update(req.body);
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const s = await InventorySupplier.findByPk(req.params.id);
    if (!s) throw new AppError('المورد غير موجود', 404);
    await s.destroy();
    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (err) { next(err); }
};

// ==================== أوامر المخزون ====================
exports.getOrders = async (req, res, next) => {
  try {
    const { item_id, order_type } = req.query;
    const where = {};
    if (item_id) where.item_id = item_id;
    if (order_type) where.order_type = order_type;

    const orders = await InventoryOrder.findAll({
      where,
      include: [
        { model: InventoryItem, as: 'item', attributes: ['id', 'name', 'unit'] },
        { model: InventorySupplier, as: 'supplier', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

exports.createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { item_id, quantity, unit_price, order_type } = req.body;

    // حساب الإجمالي
    req.body.total_price = (quantity * unit_price) || 0;
    req.body.recorded_by = req.user?.id;

    const order = await InventoryOrder.create(req.body, { transaction: t });

    // تحديث الكمية في المخزن
    const item = await InventoryItem.findByPk(item_id, { transaction: t });
    if (!item) throw new AppError('الصنف غير موجود', 404);

    const delta = order_type === 'in' ? quantity : -quantity;
    const newQty = item.quantity + delta;
    if (newQty < 0) throw new AppError('الكمية المطلوبة أكبر من المخزون المتاح', 400);

    await item.update({ quantity: newQty }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, data: order, newQuantity: newQty });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// ==================== إحصائيات ====================
exports.getStats = async (req, res, next) => {
  try {
    const [totalItems, totalCategories, totalSuppliers, lowStockItems] = await Promise.all([
      InventoryItem.count({ where: { is_active: true } }),
      InventoryCategory.count(),
      InventorySupplier.count(),
      InventoryItem.count({
        where: { is_active: true },
      }),
    ]);

    // قيمة المخزون الإجمالية
    const valueResult = await sequelize.query(
      `SELECT COALESCE(SUM(quantity * unit_price), 0) as total_value FROM inventory_items WHERE is_active = 1`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // أصناف تحت الحد الأدنى
    const lowStock = await sequelize.query(
      `SELECT id, name, quantity, min_quantity FROM inventory_items WHERE quantity <= min_quantity AND is_active = 1`,
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      data: {
        totalItems,
        totalCategories,
        totalSuppliers,
        totalValue: valueResult[0]?.total_value || 0,
        lowStockItems: lowStock,
      },
    });
  } catch (err) { next(err); }
};
