import { useEffect, useId, useState } from "react";
import { ProtectedComponent } from "./ProtectedComponent";
import SummaryReportTable from "./SummaryReportTable";

const EMPTY_OPTIONS = {};

export default function SummaryReportPage({
  title,
  description,
  initialFilters,
  fields,
  optionRequests = EMPTY_OPTIONS,
  request,
  exportRequest,
  normalizeRow,
  columns,
  fileName,
  pageLimit = 50,
  nameKey = "name",
  initialSortDirection = "asc",
}) {
  const id = useId();
  const [filters, setFilters] = useState(initialFilters);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      const entries = Object.entries(optionRequests);
      const results = await Promise.allSettled(entries.map(([, load]) => load()));
      if (!active) return;
      const next = {};
      results.forEach((result, index) => {
        const key = entries[index][0];
        if (result.status === "fulfilled") {
          const data = result.value;
          next[key] = Array.isArray(data) ? data : data?.data || [];
        } else {
          console.error(`Error al cargar filtro ${key}:`, result.reason);
          next[key] = [];
        }
      });
      setOptions(next);
    };
    loadOptions();
    return () => { active = false; };
  }, [optionRequests]);

  useEffect(() => {
    let active = true;
    const loadReport = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await request({ ...filters, page: currentPage, limit: pageLimit });
        if (!active) return;
        setRows((Array.isArray(response.data) ? response.data : []).map(normalizeRow));
        const total = response.total ?? 0;
        const limit = response.limit || pageLimit;
        const responsePages = Number(response.pages);
        setPagination({
          page: response.page || currentPage,
          limit,
          total,
          pages: Number.isInteger(responsePages) && responsePages > 0
            ? responsePages
            : Math.max(1, Math.ceil(total / limit)),
        });
      } catch (loadError) {
        if (!active) return;
        console.error("Error al cargar reporte:", loadError);
        setError(loadError.message || "No fue posible cargar el reporte");
        setRows([]);
        setPagination(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadReport();
    return () => { active = false; };
  }, [currentPage, filters, normalizeRow, pageLimit, request]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      ...Object.fromEntries((field.resetFields || []).map((key) => [key, initialFilters[key]])),
      [field.key]: value,
    }));
    setCurrentPage(1);
  };

  const getExportRows = async () => {
    const response = await exportRequest(filters);
    return (Array.isArray(response?.data) ? response.data : []).map(normalizeRow);
  };

  return (
    <ProtectedComponent permission="reports:read">
      <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-2">{description}</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => {
              const inputProps = {
                id: `${id}-${field.key}`,
                value: filters[field.key],
                onChange: (event) => handleFilterChange(field, event.target.value),
                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
              };
              const items = field.getOptions
                ? field.getOptions(options, filters)
                : options[field.optionsKey] || [];
              return (
                <div key={field.key}>
                  <label htmlFor={inputProps.id} className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  {field.type === "text" ? (
                    <input {...inputProps} type="text" placeholder={field.placeholder} />
                  ) : (
                    <select {...inputProps}>
                      <option value="">{field.emptyLabel}</option>
                      {items.map((item) => (
                        <option key={item.id} value={item[field.valueKey || "id"]}>
                          {item.name || "Sin nombre"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setFilters(initialFilters);
              setCurrentPage(1);
            }}
            className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
          >
            Limpiar filtros
          </button>
        </div>
        <SummaryReportTable
          rows={rows}
          columns={columns}
          loading={loading}
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onExportRequest={getExportRows}
          fileName={fileName}
          nameKey={nameKey}
          initialSortDirection={initialSortDirection}
        />
      </div>
    </ProtectedComponent>
  );
}
