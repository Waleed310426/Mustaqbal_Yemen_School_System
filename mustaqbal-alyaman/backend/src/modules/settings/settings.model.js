const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Term = sequelize.define('Term', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  academic_year: { type: DataTypes.STRING(20), allowNull: false },
  is_current: { type: DataTypes.BOOLEAN, defaultValue: false },
  start_date: { type: DataTypes.DATEONLY },
  end_date: { type: DataTypes.DATEONLY },
}, {
  tableName: 'terms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

const SchoolSetting = sequelize.define('SchoolSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  school_name: { type: DataTypes.STRING(200), defaultValue: 'مدرسة مستقبل اليمن' },
  logo_url: { type: DataTypes.STRING(500) },
  phone: { type: DataTypes.STRING(50) },
  email: { type: DataTypes.STRING(150) },
  address: { type: DataTypes.TEXT },
  established_year: { type: DataTypes.INTEGER },
  current_term_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'school_settings',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

SchoolSetting.belongsTo(Term, { foreignKey: 'current_term_id', as: 'currentTerm' });

module.exports = { Term, SchoolSetting };
