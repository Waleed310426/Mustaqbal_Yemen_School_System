const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const FeeStructure = sequelize.define('FeeStructure', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  grade_level: { type: DataTypes.STRING(50), defaultValue: null },
  student_id: { type: DataTypes.INTEGER, defaultValue: null },
  term_id: { type: DataTypes.INTEGER, defaultValue: null },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: { type: DataTypes.STRING(255) },
}, {
  tableName: 'fee_structures',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  fee_structure_id: { type: DataTypes.INTEGER, defaultValue: null },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  due_date: { type: DataTypes.DATEONLY },
  paid_date: { type: DataTypes.DATEONLY, defaultValue: null },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'partial', 'overdue'),
    defaultValue: 'pending',
  },
  payment_method: { type: DataTypes.STRING(50), defaultValue: 'cash' },
  receipt_url: { type: DataTypes.STRING(500), defaultValue: null },
  notes: { type: DataTypes.TEXT },
  recorded_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = { FeeStructure, Payment };
