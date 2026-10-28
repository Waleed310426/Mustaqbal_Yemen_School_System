const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

// ==================== قاعات الامتحانات ====================
const ExamHall = sequelize.define('ExamHall', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  capacity: { type: DataTypes.INTEGER, defaultValue: 30 },
  building: { type: DataTypes.STRING(100) },
  floor_number: { type: DataTypes.INTEGER, defaultValue: 1 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'exam_halls', timestamps: true, createdAt: 'created_at', updatedAt: false });

// ==================== أرقام الجلوس ====================
const SeatNumber = sequelize.define('SeatNumber', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  term_id: { type: DataTypes.INTEGER },
  seat_number: { type: DataTypes.STRING(20), allowNull: false },
  secret_number: { type: DataTypes.STRING(20) },
  hall_id: { type: DataTypes.INTEGER },
}, { tableName: 'seat_numbers', timestamps: true, createdAt: 'created_at', updatedAt: false });

// ==================== جدول الامتحانات ====================
const ExamSchedule = sequelize.define('ExamSchedule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  class_id: { type: DataTypes.INTEGER, allowNull: false },
  term_id: { type: DataTypes.INTEGER },
  exam_type: { type: DataTypes.ENUM('monthly', 'midterm', 'final'), allowNull: false },
  exam_date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME },
  end_time: { type: DataTypes.TIME },
  hall_id: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'exam_schedule', timestamps: true, createdAt: 'created_at', updatedAt: false });

ExamHall.hasMany(SeatNumber, { foreignKey: 'hall_id', as: 'seats' });
SeatNumber.belongsTo(ExamHall, { foreignKey: 'hall_id', as: 'hall' });

ExamHall.hasMany(ExamSchedule, { foreignKey: 'hall_id', as: 'exams' });
ExamSchedule.belongsTo(ExamHall, { foreignKey: 'hall_id', as: 'hall' });

module.exports = { ExamHall, SeatNumber, ExamSchedule };
