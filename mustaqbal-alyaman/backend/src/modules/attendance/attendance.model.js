const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Attendance = sequelize.define('Attendance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  schedule_id: { type: DataTypes.INTEGER, defaultValue: null },
  period_id: { type: DataTypes.INTEGER, defaultValue: null },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
    allowNull: false,
    defaultValue: 'present',
  },
  notes: { type: DataTypes.TEXT },
  recorded_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'attendance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Attendance;
