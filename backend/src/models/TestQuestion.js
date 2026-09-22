import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TestQuestion = sequelize.define('TestQuestion', {
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  optionA: DataTypes.STRING,
  optionB: DataTypes.STRING,
  optionC: DataTypes.STRING,
  optionD: DataTypes.STRING,
  correctAnswer: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: false,
  },
});

export default TestQuestion;
