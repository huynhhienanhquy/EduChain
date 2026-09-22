import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { buyCourseOnChain, isBlockchainConfigured } from '../blockchain/educhain.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { showToast } = useToast();

  const loadCourse = async () => {
    try {
      setPageLoading(true);
      setError('');

      const res = await client.get(`/courses/${id}`);
      let courseData = res.data.data;

      // Dự phòng: nếu backend chưa trả isOwned đúng thì kiểm tra thêm từ /courses/my-courses
      if (user) {
        try {
          const myCoursesRes = await client.get('/courses/my-courses');
          const enrollments = myCoursesRes.data.data || [];

          const owned = enrollments.some((enrollment) => {
            const ownedCourseId = enrollment.courseId || enrollment.course?.id;
            return String(ownedCourseId) === String(id);
          });

          courseData = {
            ...courseData,
            isOwned: Boolean(courseData.isOwned || owned),
          };
        } catch {
          // Không chặn trang detail nếu check my-courses lỗi
        }
      }

      setCourse(courseData);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được khóa học');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [id, user?.id]);

  const buy = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      showToast('Đang chuẩn bị giao dịch thanh toán...', 'info');

      let finalTxHash = txHash;

      if (isBlockchainConfigured()) {
        if (!course?.onChainCourseId) {
          throw new Error('Khóa học này chưa có onChainCourseId nên chưa thể mua bằng MetaMask');
        }

        showToast('MetaMask sẽ mở để xác nhận giao dịch mua khóa học', 'warning');

        const chainResult = await buyCourseOnChain({
          courseId: course.onChainCourseId,
          price: course.price,
        });

        finalTxHash = chainResult.txHash;
        setTxHash(chainResult.txHash);
      }

      const res = await client.post('/enrollments/buy-course', {
        courseId: Number(id),
        txHash: finalTxHash,
        paymentType: 'eth',
      });

      setCourse((prev) => ({
        ...prev,
        isOwned: true,
      }));

      setMessage(`${res.data.message}. Bây giờ bạn có thể vào học.`);
      showToast('Mua khóa học thành công', 'success');
      setConfirmOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Mua khóa học thất bại';

      // Nếu backend báo đã mua rồi thì vẫn cập nhật UI thành đã sở hữu
      if (String(msg).toLowerCase().includes('already bought')) {
        setCourse((prev) => ({
          ...prev,
          isOwned: true,
        }));

        setMessage('Bạn đã sở hữu khóa học này.');
        setConfirmOpen(false);
        showToast('Bạn đã sở hữu khóa học này', 'success');
        return;
      }

      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="panel">
        <LoadingSkeleton rows={3} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="panel">
        <p className="error">{error || 'Không tìm thấy khóa học'}</p>
      </div>
    );
  }

  const isOwned = Boolean(course.isOwned);

  return (
    <div className="stack">
      <section className="panel hero">
        <div className="hero-content">
          <div>
            <span className="badge">{course.subject || 'EduChain Course'}</span>

            <h1>{course.title}</h1>

            <p className="hero-subtext">{course.description}</p>

            <div className="actions wrap">
              <span className="badge">{course.lessonCount || 0} bài giảng</span>
              <span className="badge">{course.price} ETH</span>
              <span className="badge">{course.coinRequired} coin mở khóa</span>

              {isOwned && (
                <span className="badge success-badge">
                  Đã sở hữu
                </span>
              )}
            </div>
          </div>

          <div className="hero-visual">
            {course.thumbnail ? (
              <img className="hero-image" src={course.thumbnail} alt={course.title} />
            ) : (
              <div className="visual-card" />
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="course-header">
          <div>
            <h2>{isOwned ? 'Bạn đã sở hữu khóa học' : 'Thanh toán khóa học'}</h2>

            <p className="muted">
              {isOwned
                ? 'Khóa học đã được mở khóa. Bạn có thể vào học ngay hoặc xem trong danh sách khóa học của tôi.'
                : 'Bài giảng chi tiết chỉ mở sau khi student sở hữu khóa học.'}
            </p>
          </div>

          <span className={isOwned ? 'badge success-badge' : 'badge'}>
            {isOwned ? 'Learning unlocked' : 'Secure checkout'}
          </span>
        </div>

        {user ? (
          isOwned ? (
            <div className="owned-course-box">
              <div className="card">
                <span className="badge success-badge">Đã mua</span>

                <h3>Khóa học đã được kích hoạt</h3>

                <p className="muted">
                  Bạn không cần mua lại khóa học này. Hãy tiếp tục học, làm bài test và chờ admin cấp chứng chỉ khi đủ điều kiện.
                </p>

                <div className="actions wrap">
                  <Link className="button-link" to={`/learn/${id}`}>
                    Vào học ngay
                  </Link>

                  <Link className="button-link secondary" to="/my-courses">
                    Xem khóa học của tôi
                  </Link>

                  <Link className="button-link secondary" to="/transactions">
                    Xem giao dịch
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {!isBlockchainConfigured() ? (
                <input
                  placeholder="Nhập txHash sau khi thanh toán MetaMask demo"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                />
              ) : null}

              <div className="actions wrap">
                <button onClick={() => setConfirmOpen(true)} disabled={loading}>
                  {loading ? 'Đang thanh toán...' : 'Mua khóa học bằng MetaMask'}
                </button>

                <Link className="button-link secondary" to="/my-courses">
                  Xem khóa học của tôi
                </Link>
              </div>

              <p className="muted">
                {isBlockchainConfigured()
                  ? 'Nút mua sẽ mở MetaMask, gửi giao dịch lên Ganache và tự lấy txHash để lưu vào backend.'
                  : 'Chưa cấu hình contract address nên đang ở chế độ nhập txHash thủ công.'}
              </p>
            </>
          )
        ) : (
          <Link className="button-link" to="/login">
            Đăng nhập để mua khóa học
          </Link>
        )}

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      {course.tests?.length ? (
        <section className="panel">
          <h2>Danh sách bài test</h2>

          <div className="grid">
            {course.tests.map((test) => (
              <div key={test.id} className="card">
                <span className="badge">Final Test</span>

                <h3>{test.title}</h3>

                <p>
                  Điểm đạt: <strong>{test.passScore}</strong>
                </p>

                <p>
                  Số câu hỏi: <strong>{test.questions?.length || 0}</strong>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="panel">
          <p>Khóa học này chưa có bài test.</p>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Xác nhận thanh toán MetaMask"
        description={`Bạn sắp mua khóa học ${course.title} với giá ${course.price} ETH trên mạng Ganache local. Hãy kiểm tra ví trước khi xác nhận.`}
        confirmText="Xác nhận mua"
        loading={loading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={buy}
      />
    </div>
  );
}