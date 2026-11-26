import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) {
  const getPageNumbers = () => {
    const pages = new Set([1]);

    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 3);

    if (endPage - startPage < 3) {
      startPage = Math.max(2, endPage - 3);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.add(i);
    }

    if (totalPages > 1) {
      pages.add(totalPages);
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="mt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-surface/50 border-t border-gray-100 rounded-b-2xl">
      <div className="text-sm text-ink-soft">
        Mostrando <span className="font-semibold text-ink">{startItem}</span> a{" "}
        <span className="font-semibold text-ink">{endItem}</span> de{" "}
        <span className="font-semibold text-ink">{totalItems}</span> resultados
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-ink-soft text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex items-center gap-1 mx-1 sm:mx-2">
          {pageNumbers.map((page, idx) => {
            const prevPage = pageNumbers[idx - 1];
            const showEllipsis = prevPage && page - prevPage > 1;

            return (
              <div key={page} className="flex items-center gap-1">
                {showEllipsis && (
                  <span className="px-2 py-2 text-ink-muted text-sm">...</span>
                )}
                <button
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    currentPage === page
                      ? "bg-brand-500 text-white shadow-soft"
                      : "border border-gray-200 text-ink-soft hover:bg-white"
                  }`}
                >
                  {page}
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-ink-soft text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Siguiente
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
