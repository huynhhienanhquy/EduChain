import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

export default function MyCoursesPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    client.get('/courses/my-courses').then((res) => setItems(res.data.data));
  }, []);

  return (
    <div className="stack">
      <div>
        <h1>Khóa học của tôi</h1>
        <p className="muted">Danh sách khóa học student đã thanh toán hoặc mở khóa.</p>
      </div>
      <div className="grid">
        {items.map((item) => (
          <div key={item.id} className="card">
            <h3>{item.course?.title}</h3>
            <p>Thanh toán: {item.paymentType}</p>
            <p>Trạng thái: {item.status}</p>
            <p className="muted">Số bài giảng: {item.course?.lessons?.length || 0}</p>
            <Link to={`/learn/${item.courseId}`}>Vào học</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
