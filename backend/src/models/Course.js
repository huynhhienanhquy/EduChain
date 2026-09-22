import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Course = sequelize.define('Course', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  price: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  },

  coinRequired: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },

  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  onChainCourseId: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ✅ THÊM MÔN HỌC Ở ĐÂY
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Chưa phân loại',
  },

}, {
  tableName: 'courses',
  timestamps: true,
});

export default Course;