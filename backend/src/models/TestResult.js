import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TestResult = sequelize.define('TestResult', {
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  passed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

export default TestResult;
