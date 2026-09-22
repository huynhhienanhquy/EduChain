import dotenv from 'dotenv';
import app from './app.js';
import { connectDb, syncDb } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDb();
  await syncDb();
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
