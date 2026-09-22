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

      const { walletAddress: connectedWallet } = await connectWalletAccount();

      const res = await client.post('/auth/connect-wallet', {
        walletAddress: connectedWallet,
      });

      updateUser(res.data.data);

      const successMessage = `Đã kết nối MetaMask với Ganache: ${connectedWallet}`;
      setMessage(successMessage);
      showToast('Kết nối ví thành công', 'success');
    } catch (err) {
      const msg = err.message || 'Kết nối ví thất bại';
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
              {isConnected ? 'Wallet Connected' : 'Student Wallet'}
            </span>

            <h1>
              {isConnected
                ? 'Ví học viên đã được kết nối'
                : 'Kết nối MetaMask để học và thanh toán'}
            </h1>

            <p className="hero-subtext">
              {isConnected
                ? 'Ví này sẽ được dùng để mua khóa học bằng ETH, ghi nhận txHash và nhận chứng chỉ on-chain khi admin cấp.'
                : 'Ví của bạn sẽ được lưu vào hệ thống để mua khóa học bằng ETH trên Ganache local.'}
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
                  Ví này đã được lưu vào tài khoản của bạn. Bạn có thể mua khóa học và xem lịch sử giao dịch.
                </p>
              </div>
            )}
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="card">
                <span className="badge">
                  {isConnected ? 'Payment Ready' : 'Waiting'}
                </span>

                <h3>EduChain Student Wallet</h3>

                <p className="muted">
                  {isConnected
                    ? 'Sẵn sàng thanh toán khóa học bằng MetaMask.'
                    : 'Kết nối MetaMask để kích hoạt thanh toán Web3.'}
                </p>

                <div className="actions wrap">
                  <span className="badge">ETH Payment</span>
                  <span className="badge">TxHash</span>
                  <span className="badge">Certificate</span>
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
          <h3>Payment</h3>
          <p className="muted">
            Thanh toán khóa học qua MetaMask, txHash được lưu vào backend.
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