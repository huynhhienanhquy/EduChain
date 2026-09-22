import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Test = sequelize.define('Test', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  passScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 70,
  },
});

export default Test;
