import dotenv from 'dotenv';
import { getAddress, ZeroAddress } from 'ethers';
import app from './app.js';
import { connectDb, syncDb } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 ||
        process.env.JWT_SECRET.startsWith('replace_with_')) {
      throw new Error('JWT_SECRET must contain at least 32 characters in production');
    }
    if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD.startsWith('replace_with_')) {
      throw new Error('DB_PASSWORD must be set in production');
    }
    if (!/^[1-9]\d*$/.test(process.env.CHAIN_ID || '') ||
        !Number.isSafeInteger(Number(process.env.CHAIN_ID)) ||
        process.env.CHAIN_ID !== process.env.EXPECTED_BROWSER_CHAIN_ID) {
      throw new Error('Server and browser chain IDs must match');
    }
    const contractAddress = getAddress(process.env.CONTRACT_ADDRESS || '');
    if (contractAddress === ZeroAddress ||
        contractAddress !== getAddress(process.env.EXPECTED_BROWSER_CONTRACT_ADDRESS || '')) {
      throw new Error('Server and browser contract addresses must match a deployed contract');
    }
    const rpcUrl = new URL(process.env.CHAIN_RPC_URL || '');
    if (!['http:', 'https:'].includes(rpcUrl.protocol) || rpcUrl.hostname.endsWith('.example')) {
      throw new Error('CHAIN_RPC_URL must point to a reachable HTTP RPC endpoint');
    }
  }
  await connectDb();
  await syncDb();
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
