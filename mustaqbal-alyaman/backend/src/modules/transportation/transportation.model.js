const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

// ==================== خطوط السير ====================
const BusRoute = sequelize.define('BusRoute', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  start_point: { type: DataTypes.STRING(200) },
  end_point: { type: DataTypes.STRING(200) },
  distance_km: { type: DataTypes.DECIMAL(6, 2) },
  monthly_fee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  yearly_fee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'bus_routes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ==================== الحافلات ====================
const Bus = sequelize.define('Bus', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bus_number: { type: DataTypes.STRING(50), allowNull: false },
  plate_number: { type: DataTypes.STRING(50) },
  driver_name: { type: DataTypes.STRING(150) },
  driver_phone: { type: DataTypes.STRING(30) },
  capacity: { type: DataTypes.INTEGER, defaultValue: 40 },
  route_id: { type: DataTypes.INTEGER },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'buses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ==================== اشتراكات الطلاب ====================
const BusSubscription = sequelize.define('BusSubscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  route_id: { type: DataTypes.INTEGER, allowNull: false },
  bus_id: { type: DataTypes.INTEGER },
  subscription_type: {
    type: DataTypes.ENUM('daily', 'monthly', 'yearly'),
    defaultValue: 'monthly',
  },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled'),
    defaultValue: 'active',
  },
  pickup_point: { type: DataTypes.STRING(200) },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'bus_subscriptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// العلاقات
BusRoute.hasMany(Bus, { foreignKey: 'route_id', as: 'buses' });
Bus.belongsTo(BusRoute, { foreignKey: 'route_id', as: 'route' });

BusRoute.hasMany(BusSubscription, { foreignKey: 'route_id', as: 'subscriptions' });
BusSubscription.belongsTo(BusRoute, { foreignKey: 'route_id', as: 'route' });

Bus.hasMany(BusSubscription, { foreignKey: 'bus_id', as: 'subscriptions' });
BusSubscription.belongsTo(Bus, { foreignKey: 'bus_id', as: 'bus' });

module.exports = { BusRoute, Bus, BusSubscription };
