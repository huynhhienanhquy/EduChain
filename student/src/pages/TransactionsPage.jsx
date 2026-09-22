import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBlockchainTransactions } from '../blockchain/educhain.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import { useToast } from '../components/ToastProvider.jsx';

function shortHash(value) {
  if (!value) return '';
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function shortAddress(value) {
  if (!value) return 'N/A';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function typeLabel(type) {
  const labels = {
    COURSE_CREATED: 'Tạo khóa học',
    COURSE_BOUGHT: 'Mua khóa học',
    CERTIFICATE_ISSUED: 'Cấp chứng chỉ',
    ETH_TRANSFER: 'Nhận/Gửi ETH',
  };

  return labels[type] || type;
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user?.walletAddress) {
        throw new Error('Bạn cần kết nối ví trước để xem lịch sử giao dịch');
      }

      const data = await getBlockchainTransactions({
        walletAddress: user.walletAddress,
        onlyMine: true,
      });

      setTransactions(data);
      showToast('Đã tải lịch sử giao dịch của ví', 'success');
    } catch (err) {
      const msg = err.message || 'Không tải được lịch sử giao dịch';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const visibleTransactions =
    filter === 'ALL'
      ? transactions
      : transactions.filter((tx) => tx.type === filter);

  return (
    <div className="stack">
      <div className="panel">
        <span className="badge">My Blockchain Activity</span>
        <h1>Lịch sử giao dịch của tôi</h1>
        <p className="muted">
          Trang này chỉ hiển thị giao dịch liên quan đến ví của bạn: mua khóa học,
          được cấp chứng chỉ hoặc nhận/gửi ETH.
        </p>

        <div className="actions wrap">
        <button
            type="button"
            className="button-link secondary"
            onClick={() => navigate(-1)}
        >
            ← Quay lại
        </button>

        <button type="button" onClick={loadTransactions} disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới'}
        </button>

          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">Tất cả</option>
            <option value="COURSE_BOUGHT">Mua khóa học</option>
            <option value="CERTIFICATE_ISSUED">Cấp chứng chỉ</option>
            <option value="ETH_TRANSFER">Nhận/Gửi ETH</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="panel">
          <LoadingSkeleton rows={6} />
        </div>
      ) : error ? (
        <div className="panel">
          <p className="error">{error}</p>
        </div>
      ) : visibleTransactions.length === 0 ? (
        <div className="panel">
          <p className="muted">Ví của bạn chưa có giao dịch nào trên EduChain.</p>
        </div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Tx Hash</th>
                  <th>Block</th>
                  <th>Thời gian</th>
                  <th>From</th>
                  <th>To / Student</th>
                  <th>Course</th>
                  <th>ETH</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {visibleTransactions.map((tx) => (
                  <tr key={`${tx.txHash}-${tx.type}`}>
                    <td>
                      <span className="badge">{typeLabel(tx.type)}</span>
                    </td>
                    <td className="break-text">
                      <strong>{shortHash(tx.txHash)}</strong>
                    </td>
                    <td>{tx.blockNumber}</td>
                    <td>{tx.time}</td>
                    <td>{shortAddress(tx.from)}</td>
                    <td>{shortAddress(tx.studentWallet || tx.to)}</td>
                    <td>{tx.courseId || '-'}</td>
                    <td>{tx.valueEth || '0'}</td>
                    <td>
                      <span className={tx.status === 'Success' ? 'success' : 'error'}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}