const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  sender_id: { type: DataTypes.INTEGER, defaultValue: null },
  title: { type: DataTypes.STRING(255), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: {
    type: DataTypes.ENUM('absence', 'grade', 'payment', 'announcement', 'general'),
    defaultValue: 'general',
  },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  reference_id: { type: DataTypes.INTEGER, defaultValue: null },
  reference_type: { type: DataTypes.STRING(50), defaultValue: null },
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Notification;
