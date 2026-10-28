const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

// ==================== فئات الأصناف ====================
const InventoryCategory = sequelize.define('InventoryCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  parent_id: { type: DataTypes.INTEGER, defaultValue: null },
  description: { type: DataTypes.TEXT },
}, {
  tableName: 'inventory_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ==================== الأصناف ====================
const InventoryItem = sequelize.define('InventoryItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  category_id: { type: DataTypes.INTEGER },
  sku: { type: DataTypes.STRING(50), unique: true },
  unit: { type: DataTypes.STRING(50), defaultValue: 'قطعة' },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  min_quantity: { type: DataTypes.INTEGER, defaultValue: 5 },
  unit_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  description: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'inventory_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ==================== الموردون ====================
const InventorySupplier = sequelize.define('InventorySupplier', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  phone: { type: DataTypes.STRING(30) },
  email: { type: DataTypes.STRING(150) },
  address: { type: DataTypes.TEXT },
  contact_person: { type: DataTypes.STRING(150) },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'inventory_suppliers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ==================== أوامر المخزون ====================
const InventoryOrder = sequelize.define('InventoryOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_type: { type: DataTypes.ENUM('in', 'out'), allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  supplier_id: { type: DataTypes.INTEGER },
  recipient: { type: DataTypes.STRING(200) },
  order_date: { type: DataTypes.DATEONLY },
  notes: { type: DataTypes.TEXT },
  recorded_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'inventory_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// العلاقات
InventoryCategory.hasMany(InventoryItem, { foreignKey: 'category_id', as: 'items' });
InventoryItem.belongsTo(InventoryCategory, { foreignKey: 'category_id', as: 'category' });

InventoryCategory.hasMany(InventoryCategory, { foreignKey: 'parent_id', as: 'children' });
InventoryCategory.belongsTo(InventoryCategory, { foreignKey: 'parent_id', as: 'parent' });

InventoryItem.hasMany(InventoryOrder, { foreignKey: 'item_id', as: 'orders' });
InventoryOrder.belongsTo(InventoryItem, { foreignKey: 'item_id', as: 'item' });

InventorySupplier.hasMany(InventoryOrder, { foreignKey: 'supplier_id', as: 'orders' });
InventoryOrder.belongsTo(InventorySupplier, { foreignKey: 'supplier_id', as: 'supplier' });

module.exports = { InventoryCategory, InventoryItem, InventorySupplier, InventoryOrder };
