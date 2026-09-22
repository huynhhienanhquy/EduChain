import { getAddress, Interface, JsonRpcProvider, parseEther } from 'ethers';

const contractInterface = new Interface([
  'event CourseBought(address indexed student, uint256 indexed courseId, uint256 paidWei)',
]);

export class InvalidPaymentError extends Error {}

function invalid(message) {
  throw new InvalidPaymentError(message);
}

export async function verifyCoursePayment({ txHash, walletAddress, course, provider: suppliedProvider }) {
  if (!process.env.CHAIN_RPC_URL || !process.env.CHAIN_ID || !process.env.CONTRACT_ADDRESS) {
    throw new Error('Blockchain payment verification is not configured');
  }

  const contractAddress = getAddress(process.env.CONTRACT_ADDRESS);
  const buyerAddress = getAddress(walletAddress);
  const provider = suppliedProvider || new JsonRpcProvider(process.env.CHAIN_RPC_URL);
  const network = await provider.getNetwork();

  if (network.chainId !== BigInt(process.env.CHAIN_ID)) {
    throw new Error('Configured RPC is connected to the wrong chain');
  }

  const [transaction, receipt] = await Promise.all([
    provider.getTransaction(txHash),
    provider.getTransactionReceipt(txHash),
  ]);

  if (!transaction || !receipt || receipt.status !== 1) {
    invalid('Payment transaction has not succeeded');
  }
  if (!transaction.to || getAddress(transaction.to) !== contractAddress ||
      getAddress(transaction.from) !== buyerAddress) {
    invalid('Payment transaction does not match the linked wallet and contract');
  }
  if (!course.onChainCourseId) {
    invalid('This course has no on-chain ID');
  }

  const expectedCourseId = BigInt(course.onChainCourseId);
  const minimumPayment = parseEther(String(course.price));
  const matchingEvent = receipt.logs
    .filter((log) => getAddress(log.address) === contractAddress)
    .map((log) => {
      try {
        return contractInterface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event) => event?.name === 'CourseBought' &&
      getAddress(event.args.student) === buyerAddress &&
      event.args.courseId === expectedCourseId &&
      event.args.paidWei >= minimumPayment);

  if (!matchingEvent) {
    invalid('Payment event does not match this course or amount');
  }

  const requiredConfirmations = Number(process.env.CHAIN_CONFIRMATIONS || 1);
  if (!Number.isInteger(requiredConfirmations) || requiredConfirmations < 1) {
    throw new Error('CHAIN_CONFIRMATIONS must be a positive integer');
  }
  if (requiredConfirmations > 1) {
    const currentBlock = await provider.getBlockNumber();
    if (currentBlock - receipt.blockNumber + 1 < requiredConfirmations) {
      invalid('Payment transaction needs more confirmations');
    }
  }
}
