import { useEffect, useState } from 'react';
import client from '../api/client.js';

export default function CertificatesPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    client.get('/certificates/my').then((res) => setItems(res.data.data));
  }, []);

  return (
    <div className="stack">
      <div>
        <h1>Chứng chỉ của tôi</h1>
        <p className="muted">Có thể mở rộng thành lưu hash hoặc mint NFT certificate trên blockchain.</p>
      </div>
      <div className="grid">
        {items.map((item) => (
          <div key={item.id} className="card">
            <h3>{item.course?.title}</h3>
            <p>Mã chứng chỉ: <strong>{item.certificateCode}</strong></p>
            <p>Người cấp: {item.issuer?.fullName || 'System'}</p>
            <p>Hash: {item.certificateHash || 'Chưa có'}</p>
            <p>NFT Token: {item.nftTokenId || 'Chưa có'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
