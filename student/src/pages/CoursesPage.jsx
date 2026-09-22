import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/courses')
      .then((res) => setCourses(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = courses.filter((course) => {
    const keyword = search.toLowerCase();
    return (
      course.title?.toLowerCase().includes(keyword) ||
      course.description?.toLowerCase().includes(keyword) ||
      course.subject?.toLowerCase().includes(keyword)
    );
  });

  const groupedCourses = filteredCourses.reduce((acc, course) => {
    const subject = course.subject || 'Chưa phân loại';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(course);
    return acc;
  }, {});

  return (
    <div className="stack">
      <section className="panel hero">
        <div className="hero-content">
          <div>
            <span className="badge">Course Marketplace</span>
            <h1>Khám phá khóa học Web3 trên EduChain</h1>
            <p className="hero-subtext">Tìm khóa học theo tên, mô tả hoặc môn học. Các khóa đã mua sẽ hiển thị trạng thái sở hữu.</p>
          </div>
          <div className="hero-visual"><div className="visual-card" /></div>
        </div>
      </section>

      <div className="panel search-box">
        <input
          placeholder="Tìm khóa học theo tên, mô tả hoặc môn học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <LoadingSkeleton rows={4} />}

      {!loading && Object.keys(groupedCourses).length === 0 && (
        <div className="panel"><p className="muted">Không tìm thấy khóa học phù hợp.</p></div>
      )}

      {!loading && Object.keys(groupedCourses).map((subject) => (
        <section key={subject} className="stack">
          <div className="course-header">
            <h2>📚 {subject}</h2>
            <span className="badge">{groupedCourses[subject].length} khóa học</span>
          </div>

          <div className="grid">
            {groupedCourses[subject].map((course) => (
              <article key={course.id} className="card course-card">
                {course.thumbnail ? (
                            <img
                              className="course-thumbnail"
                              src={course.thumbnail}
                              alt={course.title}
                            />
                          ) : (
                            <div className="course-thumbnail placeholder-thumbnail">
                              <span>EduChain</span>
                            </div>
                          )}
                <div className="course-header">
                  <h3>{course.title}</h3>
                  {course.isOwned && <span className="badge success-badge">Đã mua</span>}
                </div>
                <p>{course.description}</p>
                <p>Giá: <strong>{course.price} ETH</strong></p>
                <p>Coin mở khóa: <strong>{course.coinRequired}</strong></p>
                <p className="muted">Tạo bởi: {course.creator?.fullName || 'Admin'}</p>
                <Link className="button-link secondary" to={`/courses/${course.id}`}>Xem chi tiết</Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
