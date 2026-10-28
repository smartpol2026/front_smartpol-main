import { useMemo, useState } from "react";
import { Workbook } from "exceljs";
import Pagination from "./Pagination";

const downloadBlob = (content, type, fileName) => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function SummaryReportTable({
  rows,
  columns,
  loading,
  pagination,
  currentPage,
  onPageChange,
  onExportRequest,
  fileName,
  nameKey = "name",
  initialSortDirection = "asc",
}) {
  const [nameSortDirection, setNameSortDirection] = useState(initialSortDirection);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const sortedRows = useMemo(
    () =>
      !nameSortDirection ? rows : [...rows].sort((first, second) => {
        const comparison = first[nameKey].localeCompare(second[nameKey], "es", {
          sensitivity: "base",
        });
        return nameSortDirection === "asc" ? comparison : -comparison;
      }),
    [nameKey, nameSortDirection, rows],
  );

  const getExportRows = async () => {
    const data = await onExportRequest();
    if (!Array.isArray(data) || !data.length) {
      alert("No hay datos para exportar");
      return null;
    }
    return data;
  };

  const exportExcel = async () => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const data = await getExportRows();
      if (!data) return;

      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet("Reporte");
      worksheet.columns = columns.map((column) => ({
        header: column.header,
        key: column.key,
        width: column.width || 18,
      }));
      worksheet.addRows(data);
      worksheet.getRow(1).height = 28;
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = {
          bold: true,
          color: { argb: "FFFFFFFF" },
          size: 11,
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0066B2" },
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        };
        cell.border = {
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
          top: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
        };
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.height = 24;
        row.eachCell((cell) => {
          cell.font = { size: 10, color: { argb: "FF000000" } };
          cell.alignment = {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
          };
          cell.border = {
            left: { style: "thin", color: { argb: "FFD3D3D3" } },
            right: { style: "thin", color: { argb: "FFD3D3D3" } },
            top: { style: "thin", color: { argb: "FFD3D3D3" } },
            bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
          };
          if (rowNumber % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF5F5F5" },
            };
          }
        });
      });
      worksheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];

      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(
        buffer,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (error) {
      console.error("Error al exportar reporte:", error);
      alert("No fue posible exportar el reporte");
    } finally {
      setExporting(false);
    }
  };

  const exportDelimited = async (separator, extension, type) => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const data = await getExportRows();
      if (!data) return;

      const escapeValue = (value) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;
      const content = [
        columns.map((column) => column.header),
        ...data.map((row) => columns.map((column) => row[column.key])),
      ]
        .map((line) => line.map(escapeValue).join(separator))
        .join("\n");

      downloadBlob(
        content,
        type,
        `${fileName}_${new Date().toISOString().slice(0, 10)}.${extension}`,
      );
    } catch (error) {
      console.error("Error al exportar reporte:", error);
      alert("No fue posible exportar el reporte");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = pagination?.pages ?? 1;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800">
          Resultados ({pagination?.total || rows.length})
        </h2>
        <div className="relative">
          <button
            type="button"
            disabled={exporting}
            onClick={() => setShowExportMenu((visible) => !visible)}
            title={
              exporting
                ? "Generando archivo..."
                : "Selecciona formato de exportación"
            }
            className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-md transition flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base ${
              exporting
                ? "bg-orange-500 text-white cursor-wait opacity-70"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {exporting ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Generando...
              </>
            ) : (
              <>
                <span>📊</span> Exportar
                <span className="text-xs">▼</span>
              </>
            )}
          </button>
          {showExportMenu && !exporting && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <button
                type="button"
                onClick={exportExcel}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2 text-sm border-b border-gray-100"
              >
                <span>📈</span> Exportar a Excel
              </button>
              <button
                type="button"
                onClick={() =>
                  exportDelimited(",", "csv", "text/csv;charset=utf-8;")
                }
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2 text-sm border-b border-gray-100"
              >
                <span>📋</span> Exportar a CSV
              </button>
              <button
                type="button"
                onClick={() =>
                  exportDelimited("\t", "txt", "text/plain;charset=utf-8;")
                }
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2 text-sm"
              >
                <span>📄</span> Exportar a texto
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Cargando reporte...</div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-left font-semibold text-gray-700 ${
                        column.key === nameKey
                          ? "cursor-pointer hover:bg-gray-200"
                          : ""
                      }`}
                      onClick={
                        column.key === nameKey
                          ? () =>
                              setNameSortDirection((direction) =>
                                direction === "asc" ? "desc" : "asc",
                              )
                          : undefined
                      }
                    >
                      {column.header}{" "}
                      {column.key === nameKey && nameSortDirection && (
                        <span>
                          {nameSortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.length ? (
                  sortedRows.map((row, index) => (
                    <tr
                      key={`${row.id ?? row[nameKey]}-${index}`}
                      className="border-b border-gray-200 hover:bg-blue-50"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-4 py-3 text-gray-700"
                        >
                          {column.format
                            ? column.format(row[column.key])
                            : row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No se encontraron resultados con los filtros
                      seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3 p-3">
            {sortedRows.map((row, index) => (
              <div
                key={`${row.id ?? row[nameKey]}-${index}`}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-gray-900">{row[nameKey]}</h3>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  {columns
                    .filter((column) => column.key !== nameKey)
                    .map((column) => (
                      <div key={column.key}>
                        <p className="text-gray-500">{column.header}</p>
                        <p className="font-semibold text-gray-900">
                          {column.format
                            ? column.format(row[column.key])
                            : row[column.key]}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {!sortedRows.length && (
              <p className="py-8 text-center text-gray-500">
                No se encontraron resultados.
              </p>
            )}
          </div>
        </>
      )}

      {pagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
        />
      )}
    </div>
  );
}
