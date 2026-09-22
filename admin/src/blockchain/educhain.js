import { BrowserProvider, Contract, parseEther, getAddress, formatEther } from 'ethers';

const EDUCHAIN_ABI = [
  'function buyCourse(uint256 courseId) external payable',
  'function issueCertificate(address student, uint256 courseId, string certHash) external',
  'function certificateHashes(address student, uint256 courseId) view returns (string)',
  'function createCourse(string title, uint256 priceWei, uint256 coinRequired) external returns (uint256)',
  'function nextCourseId() view returns (uint256)',
  'function owner() view returns (address)',
  'event CourseCreated(uint256 indexed courseId, string title, uint256 priceWei, uint256 coinRequired)',
  'event CourseBought(address indexed student, uint256 indexed courseId, uint256 paidWei)',
  'event CertificateIssued(address indexed student, uint256 indexed courseId, string certHash)',
];

const GANACHE_CHAIN_ID = String(import.meta.env.VITE_GANACHE_CHAIN_ID || '1337');
const GANACHE_CHAIN_HEX = `0x${Number(GANACHE_CHAIN_ID).toString(16)}`;
const GANACHE_RPC_URL = import.meta.env.VITE_GANACHE_RPC_URL || 'http://127.0.0.1:7545';
const GANACHE_CURRENCY_SYMBOL = import.meta.env.VITE_GANACHE_CURRENCY_SYMBOL || 'ETH';
const CONTRACT_ADDRESS_RAW = import.meta.env.VITE_CONTRACT_ADDRESS || '';

function getSafeContractAddress() {
  if (!CONTRACT_ADDRESS_RAW) {
    throw new Error('Thiếu VITE_CONTRACT_ADDRESS trong file .env');
  }

  return getAddress(CONTRACT_ADDRESS_RAW);
}

export function isBlockchainConfigured() {
  return Boolean(CONTRACT_ADDRESS_RAW);
}

export function getContractAddress() {
  try {
    return getSafeContractAddress();
  } catch {
    return CONTRACT_ADDRESS_RAW;
  }
}

export async function getBrowserProvider() {
  if (!window.ethereum) {
    throw new Error('Bạn cần cài MetaMask trước');
  }

  return new BrowserProvider(window.ethereum);
}

export async function switchToGanacheNetwork() {
  if (!window.ethereum) {
    throw new Error('Bạn cần cài MetaMask trước');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: GANACHE_CHAIN_HEX }],
    });
  } catch (error) {
    if (error.code !== 4902) {
      throw error;
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: GANACHE_CHAIN_HEX,
          chainName: 'Ganache Local',
          rpcUrls: [GANACHE_RPC_URL],
          nativeCurrency: {
            name: 'Ganache ETH',
            symbol: GANACHE_CURRENCY_SYMBOL,
            decimals: 18,
          },
        },
      ],
    });
  }
}

export async function connectWalletAccount() {
  await switchToGanacheNetwork();

  const provider = await getBrowserProvider();
  const accounts = await provider.send('eth_requestAccounts', []);

  return {
    provider,
    walletAddress: accounts[0],
  };
}

export async function getEduChainContract() {
  await switchToGanacheNetwork();

  const provider = await getBrowserProvider();
  await provider.send('eth_requestAccounts', []);

  const network = await provider.getNetwork();

  if (String(network.chainId) !== GANACHE_CHAIN_ID) {
    throw new Error(`Sai mạng. Hãy chuyển MetaMask sang chainId ${GANACHE_CHAIN_ID}`);
  }

  const signer = await provider.getSigner();
  const contractAddress = getSafeContractAddress();

  return new Contract(contractAddress, EDUCHAIN_ABI, signer);
}

export async function createCourseOnChain({ title, price, coinRequired }) {
  if (!title || !String(title).trim()) {
    throw new Error('Thiếu tên khóa học');
  }

  const priceNumber = Number(price);
  const coinNumber = Number(coinRequired);

  if (Number.isNaN(priceNumber) || priceNumber <= 0) {
    throw new Error('Giá ETH không hợp lệ');
  }

  if (Number.isNaN(coinNumber) || coinNumber < 0) {
    throw new Error('Coin required không hợp lệ');
  }

  const contract = await getEduChainContract();

  const tx = await contract.createCourse(
    String(title).trim(),
    parseEther(String(priceNumber)),
    BigInt(coinNumber)
  );

  const receipt = await tx.wait();

  const courseCreatedLog = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((log) => log?.name === 'CourseCreated');

  const courseId =
    courseCreatedLog?.args?.courseId ||
    (await contract.nextCourseId()) - 1n;

  return {
    courseId: String(courseId),
    txHash: receipt.hash,
  };
}

export async function issueCertificateOnChain({
  studentWallet,
  onChainCourseId,
  certificateHash,
}) {
  if (!studentWallet) {
    throw new Error('Sinh viên chưa có walletAddress');
  }

  if (!onChainCourseId) {
    throw new Error('Khóa học chưa có onChainCourseId');
  }

  if (!certificateHash || !String(certificateHash).trim()) {
    throw new Error('Thiếu certificateHash');
  }

  const contract = await getEduChainContract();

  const signer = contract.runner;
  const signerAddress = await signer.getAddress();

  try {
    const contractOwner = await contract.owner();

    if (contractOwner.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error(
        `Ví hiện tại không phải owner deploy contract. Owner: ${contractOwner}, ví đang dùng: ${signerAddress}`
      );
    }
  } catch (err) {
    if (String(err.message).includes('Ví hiện tại không phải owner')) {
      throw err;
    }
  }

  const tx = await contract.issueCertificate(
    getAddress(studentWallet),
    BigInt(Number(onChainCourseId)),
    String(certificateHash).trim()
  );

  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
  };
}

export async function getBlockchainTransactions({ walletAddress = '', onlyMine = false } = {}) {
  if (!isBlockchainConfigured()) {
    throw new Error('Chưa cấu hình VITE_CONTRACT_ADDRESS');
  }

  const provider = await getBrowserProvider();
  await provider.send('eth_requestAccounts', []);

  const contractAddress = getSafeContractAddress();
  const contract = new Contract(contractAddress, EDUCHAIN_ABI, provider);

  const latestBlock = await provider.getBlockNumber();
  const safeWallet = walletAddress ? getAddress(walletAddress).toLowerCase() : '';

  const transactions = [];

  async function getBlockTime(blockNumber) {
    const block = await provider.getBlock(blockNumber);
    return block?.timestamp
      ? new Date(block.timestamp * 1000).toLocaleString('vi-VN')
      : '';
  }

  function pushTx(item) {
    if (onlyMine && safeWallet) {
      const from = item.from?.toLowerCase() || '';
      const to = item.to?.toLowerCase() || '';
      const student = item.studentWallet?.toLowerCase() || '';

      if (![from, to, student].includes(safeWallet)) {
        return;
      }
    }

    transactions.push(item);
  }

  const courseCreatedEvents = await contract.queryFilter(
    contract.filters.CourseCreated(),
    0,
    latestBlock
  );

  const courseBoughtEvents = await contract.queryFilter(
    contract.filters.CourseBought(),
    0,
    latestBlock
  );

  const certificateEvents = await contract.queryFilter(
    contract.filters.CertificateIssued(),
    0,
    latestBlock
  );

  for (const event of courseCreatedEvents) {
    const receipt = await provider.getTransactionReceipt(event.transactionHash);
    const tx = await provider.getTransaction(event.transactionHash);

    pushTx({
      type: 'COURSE_CREATED',
      title: 'Tạo khóa học on-chain',
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
      status: receipt?.status === 1 ? 'Success' : 'Failed',
      time: await getBlockTime(event.blockNumber),
      from: tx?.from || '',
      to: contractAddress,
      courseId: String(event.args.courseId),
      courseTitle: event.args.title,
      valueEth: '0',
    });
  }

  for (const event of courseBoughtEvents) {
    const receipt = await provider.getTransactionReceipt(event.transactionHash);
    const tx = await provider.getTransaction(event.transactionHash);

    pushTx({
      type: 'COURSE_BOUGHT',
      title: 'Mua khóa học bằng MetaMask',
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
      status: receipt?.status === 1 ? 'Success' : 'Failed',
      time: await getBlockTime(event.blockNumber),
      from: tx?.from || '',
      to: contractAddress,
      studentWallet: event.args.student,
      courseId: String(event.args.courseId),
      valueEth: formatEther(event.args.paidWei),
    });
  }

  for (const event of certificateEvents) {
    const receipt = await provider.getTransactionReceipt(event.transactionHash);
    const tx = await provider.getTransaction(event.transactionHash);

    pushTx({
      type: 'CERTIFICATE_ISSUED',
      title: 'Cấp chứng chỉ on-chain',
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
      status: receipt?.status === 1 ? 'Success' : 'Failed',
      time: await getBlockTime(event.blockNumber),
      from: tx?.from || '',
      to: contractAddress,
      studentWallet: event.args.student,
      courseId: String(event.args.courseId),
      certificateHash: event.args.certHash,
      valueEth: '0',
    });
  }

  for (let blockNumber = 0; blockNumber <= latestBlock; blockNumber += 1) {
    const block = await provider.getBlock(blockNumber, true);
    const blockTransactions = block?.prefetchedTransactions || block?.transactions || [];

    for (const txItem of blockTransactions) {
      let tx = txItem;

      if (typeof txItem === 'string') {
        tx = await provider.getTransaction(txItem);
      }

      if (!tx) continue;

      const to = tx.to || '';
      const from = tx.from || '';

      if (!to) continue;

      if (to.toLowerCase() === contractAddress.toLowerCase()) {
        continue;
      }

      const valueEthNumber = Number(formatEther(tx.value || 0n));

      if (valueEthNumber <= 0) {
        continue;
      }

      const fromMatch = safeWallet && from.toLowerCase() === safeWallet;
      const toMatch = safeWallet && to.toLowerCase() === safeWallet;

      if (onlyMine && !fromMatch && !toMatch) {
        continue;
      }

      const receipt = await provider.getTransactionReceipt(tx.hash);

      transactions.push({
        type: 'ETH_TRANSFER',
        title: 'Chuyển ETH trực tiếp',
        txHash: tx.hash,
        blockNumber,
        status: receipt?.status === 1 ? 'Success' : 'Failed',
        time: block?.timestamp
          ? new Date(block.timestamp * 1000).toLocaleString('vi-VN')
          : '',
        from,
        to,
        valueEth: String(valueEthNumber),
      });
    }
  }

  return transactions.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
}