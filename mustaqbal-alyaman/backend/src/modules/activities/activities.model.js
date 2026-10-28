const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ActivityType = sequelize.define('ActivityType', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  color: { type: DataTypes.STRING(20), defaultValue: '#3b82f6' },
}, { tableName: 'activity_types', timestamps: true, createdAt: 'created_at', updatedAt: false });

const Activity = sequelize.define('Activity', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(300), allowNull: false },
  type_id: { type: DataTypes.INTEGER },
  description: { type: DataTypes.TEXT },
  location: { type: DataTypes.STRING(200) },
  start_date: { type: DataTypes.DATE, allowNull: false },
  end_date: { type: DataTypes.DATE },
  max_participants: { type: DataTypes.INTEGER, defaultValue: 0 },
  fee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'upcoming',
  },
  supervisor_id: { type: DataTypes.INTEGER },
  term_id: { type: DataTypes.INTEGER },
}, { tableName: 'activities', timestamps: true, createdAt: 'created_at', updatedAt: false });

const ActivityParticipant = sequelize.define('ActivityParticipant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  activity_id: { type: DataTypes.INTEGER, allowNull: false },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  registration_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: {
    type: DataTypes.ENUM('registered', 'attended', 'absent', 'cancelled'),
    defaultValue: 'registered',
  },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'activity_participants', timestamps: false });

ActivityType.hasMany(Activity, { foreignKey: 'type_id', as: 'activities' });
Activity.belongsTo(ActivityType, { foreignKey: 'type_id', as: 'type' });
Activity.hasMany(ActivityParticipant, { foreignKey: 'activity_id', as: 'participants' });
ActivityParticipant.belongsTo(Activity, { foreignKey: 'activity_id', as: 'activity' });

module.exports = { ActivityType, Activity, ActivityParticipant };
