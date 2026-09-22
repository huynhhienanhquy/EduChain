import { useState } from 'react';
import client from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  connectWalletAccount,
  getContractAddress,
  isBlockchainConfigured,
} from '../blockchain/educhain.js';
import { useToast } from '../components/ToastProvider.jsx';

function shortAddress(address) {
  if (!address) return 'Chưa kết nối';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ConnectWalletPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const walletAddress = user?.walletAddress || '';
  const isConnected = Boolean(walletAddress);

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      showToast('Đang mở MetaMask để kết nối ví...', 'info');

      const { walletAddress: connectedWallet, provider } = await connectWalletAccount();
      const challenge = await client.post('/auth/wallet-challenge', {
        walletAddress: connectedWallet,
      });
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(challenge.data.data.message);

      const res = await client.post('/auth/connect-wallet', {
        walletAddress: connectedWallet,
        challengeToken: challenge.data.data.challengeToken,
        signature,
      });

      updateUser(res.data.data);

      const successMessage = `Đã kết nối MetaMask với Ganache: ${connectedWallet}`;
      setMessage(successMessage);
      showToast('Kết nối ví thành công', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Kết nối ví thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <section className="panel hero">
        <div className="hero-content">
          <div>
            <span className={isConnected ? 'badge success-badge' : 'badge'}>
              {isConnected ? 'Wallet Connected' : 'MetaMask Local'}
            </span>

            <h1>
              {isConnected
                ? 'Ví quản trị đã được kết nối'
                : 'Kết nối ví quản trị'}
            </h1>

            <p className="hero-subtext">
              {isConnected
                ? 'Admin có thể dùng ví này để ký giao dịch tạo khóa học, cấp chứng chỉ và thao tác với smart contract trên Ganache.'
                : 'Admin dùng ví MetaMask trên mạng Ganache để ký giao dịch tạo khóa học và thao tác blockchain.'}
            </p>

            {!isConnected && (
              <div className="actions wrap">
                <button onClick={connectWallet} disabled={loading}>
                  {loading ? 'Đang kết nối...' : 'Kết nối ví MetaMask'}
                </button>
              </div>
            )}

            {isConnected && (
              <div className="card" style={{ marginTop: 20 }}>
                <span className="badge">Active Wallet</span>

                <h3>{shortAddress(walletAddress)}</h3>

                <p className="muted break-text">
                  Địa chỉ ví đầy đủ:
                  <br />
                  <strong>{walletAddress}</strong>
                </p>

                <p className="success">
                  Ví này đã được lưu vào tài khoản admin. Bạn không cần kết nối lại.
                </p>
              </div>
            )}
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="card">
                <span className="badge">
                  {isConnected ? 'Ready' : 'Waiting'}
                </span>

                <h3>Web3 Admin Console</h3>

                <p className="muted">
                  {isConnected
                    ? 'Sẵn sàng ký giao dịch với smart contract.'
                    : 'Kết nối MetaMask để kích hoạt thao tác on-chain.'}
                </p>

                <div className="actions wrap">
                  <span className="badge">Ganache</span>
                  <span className="badge">MetaMask</span>
                  <span className="badge">Smart Contract</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Trạng thái ví</h3>

          {isConnected ? (
            <>
              <p className="success">Đã kết nối</p>
              <p className="muted break-text">{walletAddress}</p>
            </>
          ) : (
            <p className="muted">Chưa kết nối ví MetaMask.</p>
          )}
        </div>

        <div className="card">
          <h3>Contract</h3>
          <p className="muted break-text">
            {isBlockchainConfigured()
              ? getContractAddress()
              : 'Chưa cấu hình VITE_CONTRACT_ADDRESS'}
          </p>
        </div>

        <div className="card">
          <h3>Network</h3>
          <p className="muted">
            Ganache local network qua MetaMask.
          </p>
        </div>
      </section>

      {message && (
        <div className="panel">
          <p className="success">{message}</p>
        </div>
      )}

      {error && (
        <div className="panel">
          <p className="error">{error}</p>
        </div>
      )}
    </div>
  );
}
