export default function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="skeleton-list" aria-label="Đang tải dữ liệu">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <span className="skeleton-line wide" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
