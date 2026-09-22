import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
  }
);

export async function connectDb() {
  await sequelize.authenticate();
  console.log('MySQL connected');
}

export async function syncDb() {
  await import('../models/index.js');
  await sequelize.sync(process.env.NODE_ENV === 'production' ? {} : { alter: true });
  console.log('Database synced');
}
