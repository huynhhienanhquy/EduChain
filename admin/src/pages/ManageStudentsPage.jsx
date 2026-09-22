import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client.js';

export default function ManageStudentsPage() {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [openStudentId, setOpenStudentId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsRes, resultsRes] = await Promise.all([
          client.get(`/courses/${id}/students`),
          client.get(`/courses/${id}/results`),
        ]);

        setStudents(studentsRes.data.data || []);
        setResults(resultsRes.data.data || []);
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
      }
    };

    loadData();
  }, [id]);

  const toggleStudent = (studentId) => {
    setOpenStudentId((prev) => (prev === studentId ? null : studentId));
  };

  const getStudentResult = (studentId) => {
    return results.find((result) => result.student?.id === studentId);
  };

  return (
    <div className="stack">
      <div>
        <h1>Sinh viên trong khóa học</h1>
      </div>

      <div className="students-list">
        {students.map((item) => {
          const studentId = item.student?.id;
          const studentResult = getStudentResult(studentId);

          return (
            <div key={item.id} className="card student-item">
              <div
                className="student-name"
                onClick={() => toggleStudent(studentId)}
              >
                <h3>
                  {item.student?.fullName || 'Không có tên'}
                  {openStudentId === studentId ? ' ▲' : ' ▼'}
                </h3>
              </div>

              {openStudentId === studentId && (
                <div className="student-detail">
                  <p>Email: {item.student?.email || 'Chưa có'}</p>
                  <p>Ví: {item.student?.walletAddress || 'Chưa kết nối'}</p>
                  <p>TxHash: {item.txHash || 'Chưa có'}</p>
                  <p>Thanh toán: {item.paymentType || 'Chưa có'}</p>

                  <div style={{ marginTop: '12px' }}>
                    <h4 style={{ marginBottom: '8px' }}>Kết quả bài test</h4>

                    {studentResult ? (
                      <>
                        <p>Điểm: {studentResult.score}</p>
                        <p>Kết quả: {studentResult.passed ? 'Đạt' : 'Chưa đạt'}</p>
                      </>
                    ) : (
                      <p>Chưa có kết quả bài test</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}