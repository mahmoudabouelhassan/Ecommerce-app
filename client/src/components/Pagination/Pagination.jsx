function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null; // مفيش داعي نعرض pagination لو صفحة واحدة بس

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Product pages" className="flex justify-center items-center gap-2 mt-10 flex-wrap">
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          borderColor: "var(--border-color)",
        }}
        className="px-4 py-2 rounded-lg border font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Prev
      </button>

      {pages.map((page) => (
        <button
          type="button"
          key={page}
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
          onClick={() => onPageChange(page)}
          style={
            page === currentPage
              ? {
                  background: "#2563EB",
                  color: "#ffffff",
                  borderColor: "#2563EB",
                }
              : {
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-color)",
                }
          }
          className="px-4 py-2 rounded-lg border font-medium"
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        aria-label="Next page"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          borderColor: "var(--border-color)",
        }}
        className="px-4 py-2 rounded-lg border font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;
