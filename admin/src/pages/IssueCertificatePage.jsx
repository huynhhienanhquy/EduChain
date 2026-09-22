import { useEffect, useMemo, useState } from 'react';
import { getAddress, keccak256, toUtf8Bytes } from 'ethers';
import client from '../api/client.js';
import {
  isBlockchainConfigured,
  issueCertificateOnChain,
} from '../blockchain/educhain.js';
import { useToast } from '../components/ToastProvider.jsx';

function shortAddress(address) {
  if (!address) return 'Chưa kết nối ví';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function createCertificateHash({
  studentId,
  courseId,
  onChainCourseId,
  studentWallet,
}) {
  const safeWallet = getAddress(studentWallet);

  const issuedAt = new Date().toISOString();

  const rawData = [
    'EduChain-Certificate-v1',
    `studentId:${studentId}`,
    `databaseCourseId:${courseId}`,
    `onChainCourseId:${onChainCourseId}`,
    `studentWallet:${safeWallet}`,
    `issuedAt:${issuedAt}`,
  ].join('|');

  return keccak256(toUtf8Bytes(rawData));
}

export default function IssueCertificatePage() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);

  const [courseId, setCourseId] = useState('');
  const [studentId, setStudentId] = useState('');

  const [certificateHash, setCertificateHash] = useState('');
  const [txHash, setTxHash] = useState('');

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === String(courseId)),
    [courses, courseId]
  );

  const selectedStudent = useMemo(
    () => students.find((item) => String(item.student?.id) === String(studentId))?.student,
    [students, studentId]
  );

  const selectedResult = useMemo(() => {
    if (!studentId) return null;

    return results.find((result) => String(result.student?.id) === String(studentId));
  }, [results, studentId]);

  const eligibleStudents = useMemo(() => {
    const passedStudentIds = new Set(
      results
        .filter((result) => result.passed)
        .map((result) => String(result.student?.id))
    );

    return students.filter((item) => passedStudentIds.has(String(item.student?.id)));
  }, [students, results]);

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoadingCourses(true);
        const res = await client.get('/courses');
        setCourses(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được danh sách khóa học');
      } finally {
        setLoadingCourses(false);
      }
    }

    loadCourses();
  }, []);

  useEffect(() => {
    if (!courseId) {
      setStudents([]);
      setResults([]);
      setStudentId('');
      return;
    }

    async function loadCourseData() {
      try {
        setLoadingStudents(true);
        setError('');
        setMessage('');
        setStudentId('');
        setCertificateHash('');
        setTxHash('');

        const [studentsRes, resultsRes] = await Promise.all([
          client.get(`/courses/${courseId}/students`),
          client.get(`/courses/${courseId}/results`),
        ]);

        setStudents(studentsRes.data.data || []);
        setResults(resultsRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được dữ liệu khóa học');
      } finally {
        setLoadingStudents(false);
      }
    }

    loadCourseData();
  }, [courseId]);

      useEffect(() => {
        if (!selectedCourse || !selectedStudent) {
          setCertificateHash('');
          return;
        }

        if (!selectedStudent.walletAddress || !selectedCourse.onChainCourseId) {
          setCertificateHash('');
          return;
        }

        const hash = createCertificateHash({
          studentId: selectedStudent.id,
          courseId: selectedCourse.id,
          onChainCourseId: selectedCourse.onChainCourseId,
          studentWallet: selectedStudent.walletAddress,
        });

        setCertificateHash(hash);
      }, [selectedCourse, selectedStudent]);

  const validateBeforeIssue = () => {
    if (!selectedCourse) return 'Vui lòng chọn khóa học';
    if (!selectedStudent) return 'Vui lòng chọn sinh viên';

    if (!selectedResult?.passed) {
      return 'Sinh viên này chưa đạt bài test cuối khóa';
    }

    if (!selectedStudent.walletAddress) {
      return 'Sinh viên chưa kết nối ví, không thể cấp chứng chỉ on-chain';
    }

    if (!selectedCourse.onChainCourseId) {
      return 'Khóa học này chưa có onChainCourseId, hãy tạo khóa học on-chain trước';
    }

    if (!certificateHash) {
      return 'Không tạo được certificate hash';
    }

    return '';
  };

  const submit = async (e) => {
  e.preventDefault();

  const validationError = validateBeforeIssue();
  if (validationError) {
    setError(validationError);
    showToast(validationError, 'error');
    return;
  }

  try {
    setIssuing(true);
    setError('');
    setMessage('');
    setTxHash('');

    const payload = {
      studentId: Number(selectedStudent.id),
      courseId: Number(selectedCourse.id),
      certificateHash,
      nftTokenId: null,
    };

    // Bước 1: kiểm tra điều kiện ở backend trước.
    // Nếu student chưa pass, backend trả lỗi và dừng luôn.
    // Không mở MetaMask trước bước này.
    showToast('Đang kiểm tra điều kiện cấp chứng chỉ...', 'info');

    await client.post('/certificates/verify-eligibility', {
      studentId: payload.studentId,
      courseId: payload.courseId,
    });

    showToast('Sinh viên đủ điều kiện, đang mở MetaMask...', 'info');

    let onChainTxHash = '';

    // Bước 2: chỉ gọi blockchain sau khi backend xác nhận đủ điều kiện.
    if (isBlockchainConfigured()) {
      const chainResult = await issueCertificateOnChain({
        studentWallet: selectedStudent.walletAddress,
        onChainCourseId: selectedCourse.onChainCourseId,
        certificateHash,
      });

      onChainTxHash = chainResult.txHash;
      setTxHash(onChainTxHash);
    }

    // Bước 3: chỉ lưu certificate vào MySQL sau khi on-chain thành công.
    const res = await client.post('/certificates/issue', payload);

    setMessage(
      `${res.data.message}: ${res.data.data.certificateCode}${
        onChainTxHash ? ` | tx: ${onChainTxHash}` : ''
      }`
    );

    showToast('Cấp chứng chỉ thành công', 'success');
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Cấp chứng chỉ thất bại';
    setError(msg);
    showToast(msg, 'error');
  } finally {
    setIssuing(false);
  }
};

  return (
    <div className="stack">
      <div className="panel">
        <span className="badge">Certificate Console</span>
        <h1>Cấp chứng chỉ</h1>
        <p className="muted">
          Chỉ cấp chứng chỉ cho sinh viên đã mua khóa học, đã làm bài test đạt yêu cầu và đã kết nối ví.
          Hệ thống sẽ tự tạo certificate hash và ghi chứng chỉ lên smart contract.
        </p>
      </div>

      <form className="panel form" onSubmit={submit}>
        <label className="field-label">Chọn khóa học</label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          disabled={loadingCourses || issuing}
        >
          <option value="">
            {loadingCourses ? 'Đang tải khóa học...' : 'Chọn khóa học'}
          </option>

          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              #{course.id} - {course.title}
              {course.onChainCourseId ? ` | on-chain: ${course.onChainCourseId}` : ' | chưa có on-chain ID'}
            </option>
          ))}
        </select>

        {selectedCourse && (
          <div className="card">
            <span className="badge">Course selected</span>
            <h3>{selectedCourse.title}</h3>
            <p className="muted">
              Database course ID: <strong>{selectedCourse.id}</strong>
            </p>
            <p className="muted">
              On-chain course ID:{' '}
              <strong>{selectedCourse.onChainCourseId || 'Chưa có'}</strong>
            </p>
          </div>
        )}

        <label className="field-label">Chọn sinh viên đủ điều kiện</label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          disabled={!courseId || loadingStudents || issuing}
        >
          <option value="">
            {!courseId
              ? 'Chọn khóa học trước'
              : loadingStudents
                ? 'Đang tải sinh viên...'
                : 'Chọn sinh viên đã pass test'}
          </option>

          {eligibleStudents.map((item) => (
            <option key={item.student.id} value={item.student.id}>
              #{item.student.id} - {item.student.fullName} - {item.student.email}
            </option>
          ))}
        </select>

        {courseId && !loadingStudents && eligibleStudents.length === 0 && (
          <p className="error">
            Chưa có sinh viên nào đủ điều kiện cấp chứng chỉ cho khóa học này.
          </p>
        )}

        {selectedStudent && (
          <div className="card">
            <span className="badge">Student selected</span>
            <h3>{selectedStudent.fullName}</h3>
            <p className="muted">{selectedStudent.email}</p>
            <p>
              Ví:{' '}
              <strong>
                {shortAddress(selectedStudent.walletAddress)}
              </strong>
            </p>
            <p>
              Kết quả test:{' '}
              <strong>
                {selectedResult?.passed
                  ? `Đạt - ${selectedResult.score}/100`
                  : 'Chưa đạt'}
              </strong>
            </p>
          </div>
        )}

        <div className="card">
          <span className="badge">Certificate hash</span>
          <p className="muted">
            Certificate hash được tạo bằng keccak256 theo chuẩn Web3 từ thông tin sinh viên,khóa học, ví học viên, on-chain course ID và thời điểm cấp.
          </p>

          <input
            value={certificateHash}
            readOnly
            placeholder="Certificate hash sẽ tự tạo sau khi chọn course và student"
          />
        </div>

        <button type="submit" disabled={issuing || !selectedCourse || !selectedStudent}>
          {issuing ? 'Đang cấp chứng chỉ...' : 'Cấp chứng chỉ'}
        </button>

        <p className="muted">
          Khi bấm cấp chứng chỉ, MetaMask sẽ yêu cầu admin ký giao dịch.
          Ví đang dùng phải là ví owner đã deploy contract.
        </p>

        {txHash && (
          <p className="success break-text">
            Giao dịch on-chain thành công: <strong>{txHash}</strong>
          </p>
        )}

        {message && <p className="success break-text">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}