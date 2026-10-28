const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(150), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('admin', 'teacher', 'student', 'parent'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended'),
    defaultValue: 'active',
  },
  admin_level: {
    type: DataTypes.ENUM('super_admin', 'admin'),
    defaultValue: null,
  },
  avatar_url: { type: DataTypes.STRING(255), defaultValue: null },
  phone: { type: DataTypes.STRING(30), defaultValue: null },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
