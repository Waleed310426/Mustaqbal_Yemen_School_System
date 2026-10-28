const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Class = sequelize.define('Class', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  grade_level: { type: DataTypes.STRING(50), allowNull: false },
  section: { type: DataTypes.STRING(10), allowNull: false },
  capacity: { type: DataTypes.INTEGER, defaultValue: 40 },
  term_id: { type: DataTypes.INTEGER, defaultValue: null },
}, {
  tableName: 'classes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

const Student = sequelize.define('Student', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  class_id: { type: DataTypes.INTEGER, defaultValue: null },
  birth_date: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.ENUM('male', 'female'), defaultValue: 'male' },
  address: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('active', 'transferred', 'graduated', 'withdrawn'),
    defaultValue: 'active',
  },
  enrollment_date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
}, {
  tableName: 'students',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

const Parent = sequelize.define('Parent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  occupation: { type: DataTypes.STRING(100) },
}, {
  tableName: 'parents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

const StudentParent = sequelize.define('StudentParent', {
  student_id: { type: DataTypes.INTEGER, primaryKey: true },
  parent_id: { type: DataTypes.INTEGER, primaryKey: true },
  relationship: { type: DataTypes.STRING(50), defaultValue: 'parent' },
}, {
  tableName: 'student_parents',
  timestamps: false,
});

module.exports = { Class, Student, Parent, StudentParent };
