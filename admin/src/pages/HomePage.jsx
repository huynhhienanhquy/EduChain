import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useEffect, useState } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

export default function HomePage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState('');
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    const loadWallet = async () => {
      try {
        if (!window.ethereum) return;

        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);

        if (!accounts.length) return;

        const address = accounts[0];
        setWallet(address);

        const bal = await provider.getBalance(address);
        setBalance(formatEther(bal));
      } catch (err) {
        console.error(err);
      }
    };

    loadWallet();
  }, []);

  const shortWallet = wallet
    ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}`
    : '';

  return (
    <div className="stack home-page">
      <section className="panel hero hero-upgraded">
        <div className="hero-content">
          <div className="hero-text">
            <span className="badge">Admin Dashboard</span>
            <h1>Quản trị hệ thống học tập Blockchain trên một dashboard hiện đại</h1>
            <p className="hero-subtext">
              Theo dõi khóa học, học viên, bài test, chứng chỉ và ví MetaMask trong
              cùng một giao diện trực quan. Phù hợp để demo đồ án và phát triển tiếp
              thành hệ thống thực tế.
            </p>

            <div className="hero-points">
              <div className="mini-point">
                <span className="mini-icon">📘</span>
                <div>
                  <strong>Quản lý khóa học</strong>
                  <p>Tạo course, lesson, test và phân loại theo môn học.</p>
                </div>
              </div>

              <div className="mini-point">
                <span className="mini-icon">⛓️</span>
                <div>
                  <strong>Tích hợp Blockchain</strong>
                  <p>Mua khóa học bằng MetaMask, theo dõi ETH và trạng thái ví.</p>
                </div>
              </div>

              <div className="mini-point">
                <span className="mini-icon">🎓</span>
                <div>
                  <strong>Chứng chỉ số</strong>
                  <p>Cấp chứng chỉ sau khi student hoàn thành bài test.</p>
                </div>
              </div>
            </div>

            <div className="actions wrap">
              <Link className="button-link" to={user ? '/manage-courses' : '/login'}>
                Quản lý khóa học
              </Link>

              <Link className="button-link secondary" to="/create-course">
                Tạo khóa học mới
              </Link>

              <Link className="button-link secondary" to="/send-eth">
                Tặng ETH cho sinh viên
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
              alt="Education dashboard"
              className="hero-image"
            />
          </div>
        </div>
      </section>

      <section className="grid dashboard-summary">
        <div className="card stat-card">
          <h3>Ví MetaMask</h3>
          {wallet ? (
            <>
              <p><strong>Địa chỉ:</strong> {shortWallet}</p>
              <p><strong>Số dư:</strong> {Number(balance).toFixed(4)} ETH</p>
              <p className="muted">Số dư được lấy trực tiếp từ ví đang kết nối.</p>
            </>
          ) : (
            <>
              <p>Chưa kết nối ví MetaMask</p>
              <p className="muted">Hãy mở MetaMask để hiển thị địa chỉ và số dư ETH.</p>
            </>
          )}
        </div>

        <div className="card stat-card">
          <h3>Course Management</h3>
          <p>Tạo khóa học, thêm bài giảng, quản lý môn học và theo dõi bài test.</p>
          <p className="muted">Admin có thể tổ chức nội dung theo từng môn như AI, Web, Blockchain.</p>
        </div>

        <div className="card stat-card">
          <h3>Student & Results</h3>
          <p>Xem danh sách sinh viên theo từng khóa, theo dõi kết quả làm bài và trạng thái đạt.</p>
          <p className="muted">Có thể dùng để demo luồng học tập hoàn chỉnh từ đăng ký đến chứng chỉ.</p>
        </div>
      </section>

      <section className="grid feature-grid">
        <div className="card feature-card">
          <div className="feature-icon">📚</div>
          <h3>Quản lý nội dung học tập</h3>
          <p>
            Tạo khóa học mới, cập nhật bài giảng, sắp xếp lesson theo thứ tự và phân loại
            theo môn học để dashboard rõ ràng hơn.
          </p>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">💳</div>
          <h3>Thanh toán bằng ETH</h3>
          <p>
            Student có thể mua khóa học qua MetaMask, còn admin có thể theo dõi ví và thực
            hiện các thao tác blockchain ngay trên giao diện.
          </p>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">📝</div>
          <h3>Bài test cuối khóa</h3>
          <p>
            Tạo nhiều bài test cho một khóa học, quản lý câu hỏi trắc nghiệm và theo dõi
            kết quả của từng sinh viên.
          </p>
        </div>

        <div className="card feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Chứng chỉ số</h3>
          <p>
            Hệ thống hỗ trợ cấp chứng chỉ sau khi student đạt yêu cầu, phù hợp với mô hình
            đào tạo trực tuyến tích hợp blockchain.
          </p>
        </div>
      </section>

      <section className="panel workflow-panel">
        <div className="workflow-header">
          <h2>Luồng hoạt động của hệ thống</h2>
          <p className="muted">
            Giao diện này mô phỏng đầy đủ luồng quản trị và học tập trong đề tài EduChain LMS.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-step">
            <span>1</span>
            <h4>Admin tạo course</h4>
            <p>Tạo khóa học, chọn môn học, thêm lesson và bài test.</p>
          </div>

          <div className="workflow-step">
            <span>2</span>
            <h4>Student kết nối ví</h4>
            <p>Đăng nhập, liên kết MetaMask và chuẩn bị thanh toán.</p>
          </div>

          <div className="workflow-step">
            <span>3</span>
            <h4>Mua khóa học</h4>
            <p>Thanh toán bằng ETH, lưu trạng thái sở hữu khóa học.</p>
          </div>

          <div className="workflow-step">
            <span>4</span>
            <h4>Học và làm test</h4>
            <p>Xem lesson, chọn bài test, nộp bài và chấm điểm.</p>
          </div>

          <div className="workflow-step">
            <span>5</span>
            <h4>Nhận chứng chỉ</h4>
            <p>Student đạt yêu cầu sẽ được cấp chứng chỉ số.</p>
          </div>
        </div>
      </section>
    </div>
  );
}