import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) {
  // Generar números de página a mostrar (página 1 siempre visible)
  const getPageNumbers = () => {
    const pages = new Set([1]); // Siempre incluir página 1

    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 3);

    // Ajustar si estamos cerca del final
    if (endPage - startPage < 3) {
      startPage = Math.max(2, endPage - 3);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.add(i);
    }

    // Siempre incluir última página si hay más de una
    if (totalPages > 1) {
      pages.add(totalPages);
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="mt-8 flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200 rounded-b-lg">
      {/* Información de resultados */}
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-semibold">{startItem}</span> a{" "}
        <span className="font-semibold">{endItem}</span> de{" "}
        <span className="font-semibold">{totalItems}</span> resultados
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-1">
        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Anterior
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, idx) => {
            // Mostrar puntos suspensivos si hay un gap
            const prevPage = pageNumbers[idx - 1];
            const showEllipsis = prevPage && page - prevPage > 1;

            return (
              <div key={page} className="flex items-center gap-1">
                {showEllipsis && (
                  <span className="px-2 py-2 text-gray-400 text-sm">...</span>
                )}
                <button
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              </div>
            );
          })}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Siguiente
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
