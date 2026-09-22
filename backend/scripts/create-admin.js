import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize, connectDb, syncDb } from '../src/config/database.js';
import { User } from '../src/models/index.js';

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const fullName = String(process.env.ADMIN_NAME || '').trim();
const password = process.env.ADMIN_PASSWORD || '';

async function main() {
  if (!email || !fullName || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD (at least 12 characters)');
  }

  await connectDb();
  await syncDb();

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  await User.create({
    email,
    fullName,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'admin',
  });
  console.log(`Admin account created: ${email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
