export default function ConfirmModal({ open, title, description, confirmText = 'Xác nhận', cancelText = 'Hủy', loading = false, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">⛓️</div>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
        <div className="actions wrap modal-actions">
          <button type="button" className="button-link secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
