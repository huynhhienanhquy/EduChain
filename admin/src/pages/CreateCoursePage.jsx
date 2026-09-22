import { useState } from 'react';
import client from '../api/client.js';
import { createCourseOnChain, isBlockchainConfigured } from '../blockchain/educhain.js';
import { useToast } from '../components/ToastProvider.jsx';

const DEFAULT_THUMBNAILS = {
  Blockchain:
    'https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&w=1200&q=80',
  AI:
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
  Web:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  Mobile:
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
  Data:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
  DevOps:
    'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80',
};

const initialForm = {
  title: '',
  description: '',
  price: '',
  coinRequired: '',
  subject: 'Blockchain',
};

export default function CreateCoursePage() {
  const [form, setForm] = useState(initialForm);
  const [createdOnChainId, setCreatedOnChainId] = useState('');
  const [createdTxHash, setCreatedTxHash] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const selectedThumbnail =
    DEFAULT_THUMBNAILS[form.subject] || DEFAULT_THUMBNAILS.Blockchain;

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Vui lòng nhập tiêu đề khóa học';
    if (!form.description.trim()) return 'Vui lòng nhập mô tả khóa học';

    if (!form.price || Number(form.price) <= 0) {
      return 'Vui lòng nhập giá ETH lớn hơn 0';
    }

    if (form.coinRequired === '' || Number(form.coinRequired) < 0) {
      return 'Vui lòng nhập số coin required hợp lệ';
    }

    return '';
  };

  const submit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showToast(validationError, 'error');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      setCreatedOnChainId('');
      setCreatedTxHash('');

      showToast('Đang xử lý tạo khóa học...', 'info');

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject,
        thumbnail: selectedThumbnail,
        price: Number(form.price),
        coinRequired: Number(form.coinRequired),
        onChainCourseId: null,
      };

      let onChainNote = '';

      if (isBlockchainConfigured()) {
        showToast('MetaMask sẽ mở để ký giao dịch tạo khóa học on-chain', 'warning');

        const chainResult = await createCourseOnChain({
          title: payload.title,
          price: payload.price,
          coinRequired: payload.coinRequired,
        });

        payload.onChainCourseId = String(chainResult.courseId);

        setCreatedOnChainId(String(chainResult.courseId));
        setCreatedTxHash(chainResult.txHash);

        onChainNote = ` | on-chain courseId: ${chainResult.courseId} | tx: ${chainResult.txHash}`;
      }

      const res = await client.post('/courses', payload);

      setMessage(`${res.data.message}${onChainNote}`);
      showToast('Tạo khóa học thành công', 'success');

      setForm(initialForm);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Tạo khóa học thất bại';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="panel form" onSubmit={submit}>
      <span className="badge">Course Builder</span>

      <h1>Tạo khóa học</h1>
      <label className="field-label">Tiêu đề khóa học</label>
      <input
        placeholder="Ví dụ: Blockchain cơ bản"
        value={form.title}
        onChange={(e) => updateField('title', e.target.value)}
      />

      <label className="field-label">Mô tả khóa học</label>
      <textarea
        placeholder="Mô tả nội dung khóa học"
        value={form.description}
        onChange={(e) => updateField('description', e.target.value)}
      />

      <label className="field-label">Chủ đề khóa học</label>
      <select
        value={form.subject}
        onChange={(e) => updateField('subject', e.target.value)}
      >
        <option value="Blockchain">Blockchain</option>
        <option value="AI">AI</option>
        <option value="Web">Web</option>
        <option value="Mobile">Mobile</option>
        <option value="Data">Data</option>
        <option value="DevOps">DevOps</option>
      </select>

      <div className="card">
        <img
          className="hero-image"
          src={selectedThumbnail}
          alt={`Thumbnail ${form.subject}`}
        />
      </div>

      <label className="field-label">Giá ETH</label>
      <input
        type="number"
        min="0"
        step="0.0001"
        placeholder="Ví dụ: 0.01"
        value={form.price}
        onChange={(e) => updateField('price', e.target.value)}
      />

      <label className="field-label">Coin required</label>
      <input
        type="number"
        min="0"
        step="1"
        placeholder="Ví dụ: 10"
        value={form.coinRequired}
        onChange={(e) => updateField('coinRequired', e.target.value)}
      />

      <div className="card">
        <span className="badge">Blockchain info</span>

        <p className="muted">
          On-chain course ID không cần nhập tay. Sau khi admin xác nhận MetaMask,
          smart contract sẽ trả về courseId và hệ thống tự lưu vào database.
        </p>

        <p>
          Trạng thái:{' '}
          <strong>
            {isBlockchainConfigured()
              ? 'Đã cấu hình contract, sẽ ghi lên blockchain'
              : 'Chưa cấu hình contract, chỉ lưu vào database'}
          </strong>
        </p>

        {createdOnChainId ? (
          <p className="success">
            On-chain course ID vừa tạo: <strong>{createdOnChainId}</strong>
          </p>
        ) : null}

        {createdTxHash ? (
          <p className="muted break-text">
            Tx hash: <strong>{createdTxHash}</strong>
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Lưu khóa học'}
      </button>

      <p className="muted">
        Khi bấm lưu, nếu đã có contract address, MetaMask sẽ mở để admin ký giao dịch trên Ganache.
        Sau đó dữ liệu khóa học mới được lưu vào MySQL.
      </p>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}