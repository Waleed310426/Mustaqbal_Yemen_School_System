const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Grade = sequelize.define('Grade', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  term_id: { type: DataTypes.INTEGER, defaultValue: null },
  exam_type: {
    type: DataTypes.ENUM('monthly', 'midterm', 'final', 'homework', 'participation'),
    allowNull: false,
  },
  score: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  max_score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 100 },
  notes: { type: DataTypes.TEXT },
  entered_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'grades',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

const Certificate = sequelize.define('Certificate', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  term_id: { type: DataTypes.INTEGER, defaultValue: null },
  type: {
    type: DataTypes.ENUM('completion', 'honor', 'participation', 'custom'),
    defaultValue: 'completion',
  },
  title: { type: DataTypes.STRING(200) },
  issue_date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  file_url: { type: DataTypes.STRING(500) },
  issued_by: { type: DataTypes.INTEGER },
}, {
  tableName: 'certificates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = { Grade, Certificate };
