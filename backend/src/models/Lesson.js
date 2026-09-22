import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Lesson = sequelize.define('Lesson', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lessonOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

export default Lesson;
