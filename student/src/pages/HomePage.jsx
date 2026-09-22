import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useEffect, useState } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

export default function HomePage() {
  const { user } = useAuth();
  const [walletAddress, setWalletAddress] = useState('');
  const [ethBalance, setEthBalance] = useState('');
  const [walletError, setWalletError] = useState('');

  useEffect(() => {
    const loadWalletBalance = async () => {
      try {
        setWalletError('');

        if (!window.ethereum) {
          setWalletError('Chưa cài MetaMask');
          return;
        }

        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);

        if (!accounts.length) {
          return;
        }

        const address = accounts[0];
        setWalletAddress(address);

        const balanceWei = await provider.getBalance(address);
        setEthBalance(Number(formatEther(balanceWei)).toFixed(4));
      } catch (error) {
        setWalletError('Không lấy được số dư ví');
      }
    };

    loadWalletBalance();

    if (window.ethereum) {
      const handleAccountsChanged = () => loadWalletBalance();
      const handleChainChanged = () => loadWalletBalance();

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
    : '';

  return (
    <div className="stack home-page">
      <section className="panel hero hero-upgraded">
        <div className="hero-content">
          <div className="hero-text">
            <span className="badge">Learning DApp</span>

            <h1>Học trực tuyến kết hợp Blockchain, MetaMask và chứng chỉ số</h1>

            <p className="hero-subtext">
              EduChain hỗ trợ người học mua khóa học bằng ETH, truy cập bài giảng,
              làm bài test cuối khóa và nhận chứng chỉ sau khi hoàn thành. Giao diện
              được thiết kế để mô phỏng đầy đủ luồng học tập cho đồ án.
            </p>

            <div className="hero-points">
              <div className="mini-point">
                <span className="mini-icon">📘</span>
                <div>
                  <strong>Khóa học trực tuyến</strong>
                  <p>Xem danh sách khóa học, thông tin chi tiết và trạng thái đã sở hữu.</p>
                </div>
              </div>

              <div className="mini-point">
                <span className="mini-icon">💳</span>
                <div>
                  <strong>Thanh toán bằng MetaMask</strong>
                  <p>Mua khóa học bằng ETH trên môi trường blockchain local Ganache.</p>
                </div>
              </div>

              <div className="mini-point">
                <span className="mini-icon">🎓</span>
                <div>
                  <strong>Kiểm tra và chứng chỉ</strong>
                  <p>Làm bài test, theo dõi kết quả và nhận chứng chỉ số khi đạt yêu cầu.</p>
                </div>
              </div>
            </div>

            <div className="actions wrap">
              <Link className="button-link" to="/courses">
                Xem khóa học
              </Link>

              <Link className="button-link secondary" to={user ? '/my-courses' : '/login'}>
                {user ? ' Khóa học của tôi' : 'Đăng nhập student'}
              </Link>

              {user && (
                <Link className="button-link secondary" to="/connect-wallet">
                  Kết nối ví
                </Link>
              )}
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
              alt="Student learning online"
              className="hero-image"
            />
          </div>
        </div>
      </section>

      <section className="grid dashboard-summary">
        <div className="card stat-card">
          <h3>Ví MetaMask</h3>

          {walletAddress ? (
            <>
              <p><strong>Địa chỉ:</strong> {shortWallet}</p>
              <p><strong>Số dư:</strong> {ethBalance} ETH</p>
              <p className="muted">
                Hệ thống đang đọc trực tiếp số dư ví hiện tại từ MetaMask.
              </p>
            </>
          ) : walletError ? (
            <>
              <p>{walletError}</p>
              <p className="muted">Hãy cài MetaMask hoặc mở extension để tiếp tục.</p>
            </>
          ) : (
            <>
              <p>Chưa kết nối ví MetaMask</p>
              <p className="muted">Đăng nhập và kết nối ví để thanh toán khóa học.</p>
            </>
          )}
        </div>

        <div className="card stat-card">
          <h3>Học tập</h3>
          <p>Truy cập bài giảng, theo dõi tiến độ và học nội dung theo từng khóa học đã mua.</p>
          <p className="muted">Các bài giảng chỉ mở khi người học đã sở hữu khóa học.</p>
        </div>

        <div className="card stat-card">
          <h3>Bài test cuối khóa</h3>
          <p>Người học có thể làm bài test, nộp bài và hệ thống sẽ lưu kết quả để đối chiếu.</p>
          <p className="muted">Điểm số được dùng làm điều kiện để cấp chứng chỉ số.</p>
        </div>
      </section>

      <section className="grid feature-grid">
        <div className="card feature-card">
          <div className="feature-icon">🌐</div>
          <h3>Web2 + Web3</h3>
          <p>
            Kết hợp React, Node.js, MySQL với Ethereum, MetaMask và smart contract
            để tạo hệ thống học tập lai giữa Web2 và Web3.
          </p>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">📚</div>
          <h3>Nội dung khóa học</h3>
          <p>
            Mỗi khóa học có thể bao gồm nhiều bài giảng, nhiều bài test và được phân
            loại theo môn học để dễ quản lý và tìm kiếm.
          </p>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">📝</div>
          <h3>Tương tác học tập</h3>
          <p>
            Student có thể mua khóa học, học bài giảng, làm bài test và kiểm tra trạng
            thái hoàn thành trên cùng một nền tảng.
          </p>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Chứng chỉ số</h3>
          <p>
            Sau khi đạt yêu cầu, hệ thống hỗ trợ claim chứng chỉ nhằm tăng tính minh
            bạch và giá trị xác thực cho quá trình học tập.
          </p>
        </div>
      </section>

      <section className="panel workflow-panel">
        <div className="workflow-header">
          <h2>Luồng học tập của người dùng</h2>
          <p className="muted">
            Giao diện mô phỏng sát quy trình học tập thực tế trong đề tài EduChain LMS.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-step">
            <span>1</span>
            <h4>Đăng ký / Đăng nhập</h4>
            <p>Người dùng tạo tài khoản và truy cập vào hệ thống.</p>
          </div>

          <div className="workflow-step">
            <span>2</span>
            <h4>Kết nối MetaMask</h4>
            <p>Liên kết ví để xác thực thanh toán và thao tác blockchain.</p>
          </div>

          <div className="workflow-step">
            <span>3</span>
            <h4>Mua khóa học</h4>
            <p>Thanh toán bằng ETH và lưu trạng thái sở hữu khóa học.</p>
          </div>

          <div className="workflow-step">
            <span>4</span>
            <h4>Học và làm bài test</h4>
            <p>Truy cập bài giảng, chọn bài test và nộp bài.</p>
          </div>

          <div className="workflow-step">
            <span>5</span>
            <h4>Nhận chứng chỉ</h4>
            <p>Khi đạt yêu cầu, người học có thể claim chứng chỉ hoàn thành.</p>
          </div>
        </div>
      </section>
    </div>
  );
}