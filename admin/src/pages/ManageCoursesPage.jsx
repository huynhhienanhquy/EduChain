import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    client.get('/courses').then((res) => setCourses(res.data.data));
  }, []);

  // ✅ FILTER THEO SEARCH
  const filteredCourses = courses.filter((course) => {
    const keyword = search.toLowerCase();
    return (
      course.title?.toLowerCase().includes(keyword) ||
      course.description?.toLowerCase().includes(keyword) ||
      course.subject?.toLowerCase().includes(keyword)
    );
  });

  // ✅ GROUP THEO SUBJECT SAU KHI FILTER
  const groupedCourses = filteredCourses.reduce((acc, course) => {
    const subject = course.subject || 'Chưa phân loại';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(course);
    return acc;
  }, {});

  return (
    <div className="stack">
      <div>
        <h1>Quản lý khóa học</h1>
        <p className="muted">
          Mỗi course có thể quản lý lesson, danh sách student và bài test riêng.
        </p>
      </div>

      {/* 🔍 SEARCH */}
      <div className="panel">
        <input
          placeholder="🔍 Tìm khóa học theo tên, mô tả hoặc môn học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ❌ KHÔNG CÓ KẾT QUẢ */}
      {Object.keys(groupedCourses).length === 0 && (
        <p className="muted">Không tìm thấy khóa học phù hợp.</p>
      )}

      {/* ✅ HIỂN THỊ THEO MÔN */}
      {Object.keys(groupedCourses).map((subject) => (
        <div key={subject} className="stack">
          <h2>📚 {subject}</h2>

          <div className="grid">
            {groupedCourses[subject].map((course) => (
              <div key={course.id} className="card">
                <h3>{course.title}</h3>
                <p>{course.description}</p>

                <p>Giá: {course.price} ETH</p>
                <p>Coin required: {course.coinRequired}</p>

                <div className="actions wrap">
                  <Link to={`/manage-courses/${course.id}/lessons`}>
                    Bài giảng
                  </Link>
                  <Link to={`/manage-courses/${course.id}/students`}>
                    Sinh viên
                  </Link>
                  <Link to={`/manage-courses/${course.id}/tests`}>
                    Bài test
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}