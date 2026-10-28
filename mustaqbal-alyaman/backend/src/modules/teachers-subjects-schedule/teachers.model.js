const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Teacher = sequelize.define('Teacher', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  specialization: { type: DataTypes.STRING(100) },
  hire_date: { type: DataTypes.DATEONLY },
}, {
  tableName: 'teachers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

const Subject = sequelize.define('Subject', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  grade_level: { type: DataTypes.STRING(50) },
  description: { type: DataTypes.TEXT },
}, {
  tableName: 'subjects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

const TeacherSubject = sequelize.define('TeacherSubject', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  class_id: { type: DataTypes.INTEGER, allowNull: false },
  term_id: { type: DataTypes.INTEGER, defaultValue: null },
}, {
  tableName: 'teacher_subjects',
  timestamps: false,
});

const Period = sequelize.define('Period', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
  order_num: { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  tableName: 'periods',
  timestamps: false,
});

const Schedule = sequelize.define('Schedule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  class_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  period_id: { type: DataTypes.INTEGER, allowNull: false },
  day: {
    type: DataTypes.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday'),
    allowNull: false,
  },
  term_id: { type: DataTypes.INTEGER, defaultValue: null },
}, {
  tableName: 'schedule',
  timestamps: false,
});

module.exports = { Teacher, Subject, TeacherSubject, Period, Schedule };
