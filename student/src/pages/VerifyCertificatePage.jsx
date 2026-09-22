import { useState } from 'react';
import client from '../api/client.js';
import {
  findCertificateIssuedEventByHash,
  getCertificateHashOnChain,
  verifyCertificateHashOnChain,
} from '../blockchain/educhain.js';
import { useToast } from '../components/ToastProvider.jsx';

function shortAddress(address) {
  if (!address) return 'Chưa có ví';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function VerifyCertificatePage() {
  const [blockchainOnlyResult, setBlockchainOnlyResult] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [certificateData, setCertificateData] = useState(null);
  const [onChainResult, setOnChainResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [checkingChain, setCheckingChain] = useState(false);
  const [error, setError] = useState('');

  const { showToast } = useToast();

const verify = async (e) => {
  e.preventDefault();

  const input = keyword.trim();

  if (!input) {
    setError('Vui lòng nhập mã chứng chỉ hoặc certificate hash');
    showToast('Vui lòng nhập mã chứng chỉ hoặc certificate hash', 'error');
    return;
  }

  try {
    setLoading(true);
    setError('');
    setCertificateData(null);
    setOnChainResult(null);
    setBlockchainOnlyResult(null);

    // Bước 1: kiểm tra MySQL trước để lấy đầy đủ thông tin student/course/issuer.
    const res = await client.get('/certificates/verify-public', {
      params: {
        keyword: input,
      },
    });

    const data = res.data.data;
    const cert = data?.certificate;

    setCertificateData(data);
    showToast('Tìm thấy chứng chỉ trong hệ thống', 'success');

    // Bước 2: nếu DB còn record nhưng certificateHash bị xóa/null,
    // vẫn thử lấy hash từ blockchain bằng studentWallet + onChainCourseId.
    if (
      cert &&
      !cert.certificateHash &&
      cert.student?.walletAddress &&
      cert.course?.onChainCourseId
    ) {
      const chainResult = await getCertificateHashOnChain({
        studentWallet: cert.student.walletAddress,
        onChainCourseId: cert.course.onChainCourseId,
      });

      setOnChainResult({
        checked: chainResult.checked,
        matched: false,
        onChainHash: chainResult.onChainHash,
        message: chainResult.exists
          ? 'DB đang thiếu certificateHash, nhưng blockchain vẫn còn lưu hash chứng chỉ'
          : chainResult.message,
      });

      if (chainResult.exists) {
        showToast('Blockchain vẫn còn lưu certificate hash', 'success');
      }
    }
  } catch (err) {
    // Bước 3: nếu MySQL không tìm thấy nhưng input là hash 0x...,
    // tìm trực tiếp trên event CertificateIssued của blockchain.
    const looksLikeWeb3Hash = input.startsWith('0x') && input.length === 66;

    if (looksLikeWeb3Hash) {
      try {
        const chainResult = await findCertificateIssuedEventByHash(input);

        if (chainResult.found) {
          setBlockchainOnlyResult(chainResult);
          showToast('Tìm thấy chứng chỉ trên blockchain', 'success');
          return;
        }

        setError('Không tìm thấy chứng chỉ trong DB hoặc blockchain');
        showToast('Không tìm thấy chứng chỉ trong DB hoặc blockchain', 'error');
        return;
      } catch (chainErr) {
        const msg =
          chainErr.message || 'Không tìm thấy trong DB và kiểm tra blockchain thất bại';
        setError(msg);
        showToast(msg, 'error');
        return;
      }
    }

    const msg =
      err.response?.data?.message ||
      'Không tìm thấy trong CSDL. Nếu muốn kiểm tra trực tiếp blockchain, hãy nhập certificateHash dạng 0x...';

    setError(msg);
    showToast(msg, 'error');
  } finally {
    setLoading(false);
  }
};

  const checkOnChain = async () => {
    try {
      setCheckingChain(true);
      setError('');
      setOnChainResult(null);

      const cert = certificateData?.certificate;

      const result = await verifyCertificateHashOnChain({
        studentWallet: cert?.student?.walletAddress,
        onChainCourseId: cert?.course?.onChainCourseId,
        certificateHash: cert?.certificateHash,
      });

      setOnChainResult(result);

      showToast(result.message, result.matched ? 'success' : 'error');
    } catch (err) {
      const msg = err.message || 'Kiểm tra on-chain thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setCheckingChain(false);
    }
  };

  const cert = certificateData?.certificate;


  return (
    <div className="stack">
      <section className="panel hero">
        <div className="hero-content">
          <div>
            <span className="badge">Public Verification</span>

            <h1>Xác minh chứng chỉ EduChain</h1>

            <p className="hero-subtext">
              Nhập mã chứng chỉ hoặc certificate hash để kiểm tra chứng chỉ có tồn tại trong hệ thống
              và có khớp dữ liệu blockchain hay không.
            </p>
          </div>

          <div className="hero-visual">
            <div className="profile-card">
              <div className="profile-avatar">✓</div>
              <h3>Trusted Certificate</h3>
              <p className="muted">
                Verify certificate by database record and blockchain hash.
              </p>
            </div>
          </div>
        </div>
      </section>

      <form className="panel form" onSubmit={verify}>
        <span className="badge">Certificate Lookup</span>

        <h2>Nhập thông tin cần xác minh</h2>

        <label className="field-label">Certificate Code hoặc Certificate Hash</label>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Ví dụ: CERT-177... hoặc CERT-HASH-..."
        />

        <div className="actions wrap">
          <button type="submit" disabled={loading}>
            {loading ? 'Đang xác minh...' : 'Xác minh chứng chỉ'}
          </button>

          <button
            type="button"
            className="button-link secondary"
            onClick={() => {
              setKeyword('');
              setCertificateData(null);
              setOnChainResult(null);
              setError('');
            }}
          >
            Xóa
          </button>
        </div>

        <p className="muted">
          Trang này không yêu cầu đăng nhập. Bất kỳ ai có mã chứng chỉ đều có thể kiểm tra tính hợp lệ.
        </p>
      </form>

      {cert && (
        <section className="certificate-verify-card">
          <div className="certificate-ribbon">VERIFIED</div>

          <div className="certificate-header">
            <div>
              <span className={onChainResult?.matched ? 'badge success-badge' : 'badge'}>
  {onChainResult?.matched ? 'Valid On-chain Certificate' : 'Database Record Found'}
</span>

<h2>
  {onChainResult?.matched
    ? 'Chứng chỉ hợp lệ trên blockchain'
    : 'Chứng chỉ chưa được xác thực hợp lệ'}
</h2>

<p className="muted">
  {onChainResult?.matched
    ? 'Certificate hash trong database khớp với dữ liệu đã lưu trên blockchain.'
    : 'Chứng chỉ được tìm thấy trong database nhưng cần kiểm tra blockchain để xác thực.'}
</p>
            </div>

            <div className="certificate-seal">EC</div>
          </div>

          <div className="certificate-grid">
            <div>
              <p className="muted">Mã chứng chỉ</p>
              <h3>{cert.certificateCode}</h3>
            </div>

            <div>
              <p className="muted">Học viên</p>
              <h3>{cert.student?.fullName}</h3>
              <p className="muted">{cert.student?.email}</p>
            </div>

            <div>
              <p className="muted">Khóa học</p>
              <h3>{cert.course?.title}</h3>
              <p className="muted">{cert.course?.subject}</p>
            </div>

            <div>
              <p className="muted">Người cấp</p>
              <h3>{cert.issuer?.fullName}</h3>
              <p className="muted">{cert.issuer?.email}</p>
            </div>

            <div>
              <p className="muted">Ngày cấp</p>
              <h3>
                {cert.issuedAt
                  ? new Date(cert.issuedAt).toLocaleString('vi-VN')
                  : 'Không rõ'}
              </h3>
            </div>

            <div>
              <p className="muted">Ví học viên</p>
              <h3>{shortAddress(cert.student?.walletAddress)}</h3>
            </div>
          </div>

          <div className="certificate-hash-box">
            <p className="muted">Certificate Hash</p>
            <strong>{cert.certificateHash || 'Chưa có certificate hash'}</strong>
          </div>

          <div className="certificate-hash-box">
            <p className="muted">On-chain Course ID</p>
            <strong>{cert.course?.onChainCourseId || 'Khóa học chưa có on-chain ID'}</strong>
          </div>

          <div className="actions wrap">
            <button
              type="button"
              onClick={checkOnChain}
              disabled={checkingChain || !certificateData.blockchainCheck?.canCheckOnChain}
            >
              {checkingChain ? 'Đang kiểm tra blockchain...' : 'Kiểm tra on-chain'}
            </button>

            {!certificateData.blockchainCheck?.canCheckOnChain && (
              <span className="badge">
                Không đủ dữ liệu để check on-chain
              </span>
            )}
          </div>

          {onChainResult && (
            <div className="card">
              <span className={onChainResult.matched ? 'badge success-badge' : 'badge'}>
                Blockchain Result
              </span>

              <h3>
                {onChainResult.matched
                  ? 'Hash khớp với blockchain'
                  : 'Hash không khớp blockchain'}
              </h3>

              <p className={onChainResult.matched ? 'success' : 'error'}>
                {onChainResult.message}
              </p>

              <p className="muted break-text">
                On-chain hash:
                <br />
                <strong>{onChainResult.onChainHash || 'Không có dữ liệu'}</strong>
              </p>
            </div>
          )}
        </section>
      )}
    {blockchainOnlyResult && (
  <section className="certificate-verify-card">
    <div className="certificate-ribbon">ON-CHAIN</div>

    <div className="certificate-header">
      <div>
        <span className="badge success-badge">Blockchain Verified</span>

        <h2>Chứng chỉ tồn tại trên Blockchain</h2>

        <p className="muted">
          Không tìm thấy bản ghi đầy đủ trong MySQL, nhưng certificateHash này vẫn tồn tại
          trong event CertificateIssued của smart contract.
        </p>
      </div>

      <div className="certificate-seal">EC</div>
    </div>

    <div className="certificate-grid">
      <div>
        <p className="muted">Student Wallet</p>
        <h3 className="break-text">{blockchainOnlyResult.studentWallet}</h3>
      </div>

      <div>
        <p className="muted">On-chain Course ID</p>
        <h3>{blockchainOnlyResult.onChainCourseId}</h3>
      </div>

      <div>
        <p className="muted">Block Number</p>
        <h3>{blockchainOnlyResult.blockNumber}</h3>
      </div>

      <div>
        <p className="muted">Issuer Wallet</p>
        <h3 className="break-text">{blockchainOnlyResult.issuerWallet}</h3>
      </div>

      <div>
        <p className="muted">Thời gian</p>
        <h3>{blockchainOnlyResult.time || 'Không rõ'}</h3>
      </div>

      <div>
        <p className="muted">Trạng thái giao dịch</p>
        <h3>{blockchainOnlyResult.status}</h3>
      </div>
    </div>

    <div className="certificate-hash-box">
      <p className="muted">Certificate Hash</p>
      <strong>{blockchainOnlyResult.certificateHash}</strong>
    </div>

    <div className="certificate-hash-box">
      <p className="muted">Transaction Hash</p>
      <strong>{blockchainOnlyResult.txHash}</strong>
    </div>

    <p className="success">{blockchainOnlyResult.message}</p>
  </section>
)}
      {error && (
        <section className="panel">
          <p className="error">{error}</p>
        </section>
      )}
    </div>
  );
}
