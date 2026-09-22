import { useEffect, useMemo, useState } from 'react';
import client from '../api/client.js';

export default function ManageAllStudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setError('');
      const res = await client.get('/users/students');
      setStudents(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách sinh viên');
    }
  };

  const filteredStudents = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    return students.filter((student) => {
      return (
        student.fullName?.toLowerCase().includes(keyword) ||
        student.email?.toLowerCase().includes(keyword) ||
        student.walletAddress?.toLowerCase().includes(keyword)
      );
    });
  }, [students, search]);

  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) => selectedIds.includes(student.id));

  const toggleStudent = (studentId) => {
    setSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredStudents.map((student) => student.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const unselectAllFiltered = () => {
    const filteredIds = filteredStudents.map((student) => student.id);
    setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
  };

  return (
    <div className="stack">
      <div className="panel">
        <h1>Quản lý sinh viên</h1>
        <p className="muted">Xem toàn bộ sinh viên, tìm kiếm và chọn nhiều sinh viên cùng lúc.</p>

        <input
          placeholder="Tìm theo tên, email hoặc ví..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="actions wrap">
          <button type="button" onClick={selectAllFiltered}>
            Chọn tất cả
          </button>
          <button type="button" className="button-link secondary" onClick={unselectAllFiltered}>
            Bỏ chọn tất cả
          </button>
          <span className="badge">Đã chọn: {selectedIds.length}</span>
          <span className="badge">Tổng sinh viên: {filteredStudents.length}</span>
        </div>

        {error && <p className="error">{error}</p>}
      </div>

      <div className="students-list">
        {filteredStudents.map((student) => (
          <div key={student.id} className="card student-item">
            <div className="actions wrap" style={{ justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                />
                <strong>{student.fullName}</strong>
              </label>

              {selectedIds.includes(student.id) && (
                <span className="badge success-badge">Đã chọn</span>
              )}
            </div>

            <div className="student-detail" style={{ marginTop: 12 }}>
              <p>Email: {student.email || 'Chưa có'}</p>
              <p>Ví: {student.walletAddress || 'Chưa kết nối'}</p>
              <p>Vai trò: {student.role}</p>
            </div>
          </div>
        ))}

        {!filteredStudents.length && (
          <div className="panel">
            <p>Không có sinh viên phù hợp.</p>
          </div>
        )}
      </div>

      {allFilteredSelected && filteredStudents.length > 0 && (
        <div className="panel">
          <p className="success">Bạn đã chọn toàn bộ sinh viên đang hiển thị.</p>
        </div>
      )}
    </div>
  );
}