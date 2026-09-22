import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Enrollment = sequelize.define('Enrollment', {
  paymentType: {
    type: DataTypes.ENUM('eth', 'coin', 'free'),
    defaultValue: 'eth',
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'active'),
    defaultValue: 'active',
  },
  txHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  enrolledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

export default Enrollment;
