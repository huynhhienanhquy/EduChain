import assert from 'node:assert/strict';
import test from 'node:test';
import { Interface, parseEther } from 'ethers';
import { InvalidPaymentError, verifyCoursePayment } from '../src/utils/verifyCoursePayment.js';

const contractAddress = '0x1111111111111111111111111111111111111111';
const buyerAddress = '0x2222222222222222222222222222222222222222';
const otherAddress = '0x3333333333333333333333333333333333333333';
const txHash = `0x${'a'.repeat(64)}`;
const eventInterface = new Interface([
  'event CourseBought(address indexed student, uint256 indexed courseId, uint256 paidWei)',
]);

process.env.CHAIN_RPC_URL = 'http://127.0.0.1:8545';
process.env.CHAIN_ID = '11155111';
process.env.CONTRACT_ADDRESS = contractAddress;
process.env.CHAIN_CONFIRMATIONS = '1';

function paymentProvider({ buyer = buyerAddress, courseId = 7n, amount = parseEther('0.1'), chainId = 11155111n } = {}) {
  const encoded = eventInterface.encodeEventLog('CourseBought', [buyer, courseId, amount]);
  return {
    getNetwork: async () => ({ chainId }),
    getTransaction: async () => ({ to: contractAddress, from: buyer, hash: txHash }),
    getTransactionReceipt: async () => ({
      status: 1,
      blockNumber: 100,
      logs: [{ address: contractAddress, topics: encoded.topics, data: encoded.data }],
    }),
    getBlockNumber: async () => 100,
  };
}

const payment = {
  txHash,
  walletAddress: buyerAddress,
  course: { onChainCourseId: '7', price: '0.1' },
};

test('accepts a mined payment event from the linked wallet for the right course and amount', async () => {
  await assert.doesNotReject(verifyCoursePayment({ ...payment, provider: paymentProvider() }));
});

test('rejects another wallet, course, or insufficient payment', async () => {
  for (const provider of [
    paymentProvider({ buyer: otherAddress }),
    paymentProvider({ courseId: 8n }),
    paymentProvider({ amount: parseEther('0.01') }),
  ]) {
    await assert.rejects(
      verifyCoursePayment({ ...payment, provider }),
      InvalidPaymentError
    );
  }
});

test('rejects a mismatched RPC network', async () => {
  await assert.rejects(
    verifyCoursePayment({ ...payment, provider: paymentProvider({ chainId: 1n }) }),
    /wrong chain/
  );
});
