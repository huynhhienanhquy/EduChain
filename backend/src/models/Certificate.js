import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Certificate = sequelize.define('Certificate', {
  certificateCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  certificateHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nftTokenId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  issuedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

export default Certificate;
