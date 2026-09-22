import { useEffect, useMemo, useState } from 'react';
import { BrowserProvider, parseEther } from 'ethers';
import client from '../api/client.js';
import { useToast } from '../components/ToastProvider.jsx';

function shortAddress(address) {
  if (!address) return 'Chưa kết nối ví';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function SendEthPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('');

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [sending, setSending] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const { showToast } = useToast();

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.id) === String(selectedStudentId)),
    [students, selectedStudentId]
  );

  const studentsWithWallet = useMemo(
    () => students.filter((student) => Boolean(student.walletAddress)),
    [students]
  );

  const studentsWithoutWallet = useMemo(
    () => students.filter((student) => !student.walletAddress),
    [students]
  );

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      setError('');

      const res = await client.get('/users/students');
      setStudents(res.data.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không tải được danh sách sinh viên';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const validateBeforeSend = () => {
    if (!selectedStudent) {
      return 'Vui lòng chọn sinh viên';
    }

    if (!selectedStudent.walletAddress) {
      return 'Sinh viên này chưa kết nối ví';
    }

    if (!amount || Number(amount) <= 0) {
      return 'Số ETH không hợp lệ';
    }

    if (!window.ethereum) {
      return 'Chưa cài MetaMask';
    }

    return '';
  };

  const sendEth = async () => {
    const validationError = validateBeforeSend();

    if (validationError) {
      setError(validationError);
      showToast(validationError, 'error');
      return;
    }

    try {
      setSending(true);
      setError('');
      setMessage('');
      setTxHash('');

      showToast('Đang mở MetaMask để xác nhận gửi ETH...', 'info');

      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: selectedStudent.walletAddress,
        value: parseEther(String(amount)),
      });

      showToast('Giao dịch đã gửi, đang chờ xác nhận...', 'info');

      const receipt = await tx.wait();

      setTxHash(receipt.hash);
      setMessage(`Đã gửi ${amount} ETH cho ${selectedStudent.fullName}`);
      showToast('Gửi ETH thành công', 'success');
    } catch (err) {
      const msg = err.message || 'Gửi ETH thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="stack">
      <section className="panel">
        <span className="badge">ETH Faucet</span>

        <h1>Tặng ETH cho sinh viên</h1>

        <p className="muted">
          Admin chọn sinh viên đã kết nối ví, nhập số ETH cần gửi và xác nhận giao dịch bằng MetaMask.
          Giao dịch này là chuyển ETH trực tiếp trên Ganache, không đi qua smart contract.
        </p>

        <div className="actions wrap">
          <button type="button" onClick={loadStudents} disabled={loadingStudents || sending}>
            {loadingStudents ? 'Đang tải...' : 'Làm mới danh sách'}
          </button>

          <span className="badge">
            Có ví: {studentsWithWallet.length}
          </span>

          <span className="badge">
            Chưa có ví: {studentsWithoutWallet.length}
          </span>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Tổng sinh viên</h3>
          <p className="metric">{students.length}</p>
          <p className="muted">Tất cả tài khoản role student.</p>
        </div>

        <div className="card">
          <h3>Đã kết nối ví</h3>
          <p className="metric">{studentsWithWallet.length}</p>
          <p className="muted">Có thể nhận ETH từ admin.</p>
        </div>

        <div className="card">
          <h3>Chưa kết nối ví</h3>
          <p className="metric">{studentsWithoutWallet.length}</p>
          <p className="muted">Không thể gửi ETH cho các tài khoản này.</p>
        </div>
      </section>

      <section className="panel form">
        <label className="field-label">Chọn sinh viên nhận ETH</label>

        <select
          value={selectedStudentId}
          onChange={(e) => {
            setSelectedStudentId(e.target.value);
            setMessage('');
            setError('');
            setTxHash('');
          }}
          disabled={loadingStudents || sending}
        >
          <option value="">
            {loadingStudents ? 'Đang tải sinh viên...' : 'Chọn sinh viên đã kết nối ví'}
          </option>

          {studentsWithWallet.map((student) => (
            <option key={student.id} value={student.id}>
              #{student.id} - {student.fullName} - {student.email} - {shortAddress(student.walletAddress)}
            </option>
          ))}
        </select>

        {selectedStudent && (
          <div className="card">
            <span className="badge">Selected Student</span>

            <h3>{selectedStudent.fullName}</h3>

            <p className="muted">{selectedStudent.email}</p>

            <p>
              Ví nhận ETH:{' '}
              <strong>{shortAddress(selectedStudent.walletAddress)}</strong>
            </p>

            <p className="muted break-text">
              {selectedStudent.walletAddress}
            </p>
          </div>
        )}

        <label className="field-label">Số ETH cần gửi</label>

        <input
          type="number"
          min="0"
          step="0.0001"
          placeholder="Ví dụ: 0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={sending}
        />

        <button
          type="button"
          onClick={sendEth}
          disabled={sending || !selectedStudent?.walletAddress}
        >
          {sending ? 'Đang gửi ETH...' : 'Gửi ETH bằng MetaMask'}
        </button>

        <p className="muted">
          Sau khi bấm gửi, MetaMask sẽ mở để admin xác nhận giao dịch. Transaction hash sẽ được ghi nhận trên Ganache
          và có thể xem lại ở trang Lịch sử giao dịch.
        </p>

        {txHash && (
          <p className="success break-text">
            Tx hash: <strong>{txHash}</strong>
          </p>
        )}

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      {studentsWithoutWallet.length > 0 && (
        <section className="panel">
          <h2>Sinh viên chưa kết nối ví</h2>

          <p className="muted">
            Các sinh viên này chưa có walletAddress nên admin chưa thể gửi ETH.
          </p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Trạng thái ví</th>
                </tr>
              </thead>

              <tbody>
                {studentsWithoutWallet.map((student) => (
                  <tr key={student.id}>
                    <td>#{student.id}</td>
                    <td>{student.fullName}</td>
                    <td>{student.email}</td>
                    <td>
                      <span className="error">Chưa kết nối ví</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}