import React, { useEffect, useState } from "react";
import { getAnalysisReport } from "../api/reports";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { exportAnalysisToExcel } from "../utils/exportToExcel";

export default function AnalysisTable({ filters }) {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedBooths, setExpandedBooths] = useState({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const toggleBooth = (boothKey) => {
    setExpandedBooths((prev) => ({
      ...prev,
      [boothKey]: !prev[boothKey],
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAnalysisToExcel(tableData);
      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting:", error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const loadAnalysisData = async () => {
      setLoading(true);
      try {
        // Llamar al endpoint de análisis que devuelve datos agrupados por puesto
        const response = await getAnalysisReport(filters);

        // El endpoint devuelve un array de puestos con mesas dentro
        const analysisData = Array.isArray(response)
          ? response
          : response.data || [];

        // Procesar datos: agregar porcentaje a cada mesa y totales generales al puesto
        const processedData = analysisData.map((puesto) => {
          // Procesar mesas individuales con validación
          const mesasProcessadas = (puesto.mesas || []).map((mesa) => {
            const totalReg = parseInt(mesa.totalRegistrado) || 0;
            const totalVot = parseInt(mesa.totalVotado) || 0;
            const totalDiv = parseInt(mesa.totalDivipol) || 0;
            const porcentaje =
              totalReg > 0 ? ((totalVot / totalReg) * 100).toFixed(2) : "0.00";

            return {
              ...mesa,
              totalRegistrado: totalReg,
              totalVotado: totalVot,
              totalDivipol: totalDiv,
              porcentajeRegistradoVsVotado: porcentaje + "%",
            };
          });

          // Calcular totales generales del puesto
          const totalRegistradoGeneral = mesasProcessadas.reduce(
            (sum, mesa) => sum + (mesa.totalRegistrado || 0),
            0,
          );
          const totalVotadoGeneral = mesasProcessadas.reduce(
            (sum, mesa) => sum + (mesa.totalVotado || 0),
            0,
          );
          const totalDivpolGeneral = mesasProcessadas.reduce(
            (sum, mesa) => sum + (mesa.totalDivipol || 0),
            0,
          );
          const porcentajeGeneral =
            totalRegistradoGeneral > 0
              ? ((totalVotadoGeneral / totalRegistradoGeneral) * 100).toFixed(2)
              : "0.00";

          const porcentajeRegistradoVsDivGeneral =
            totalDivpolGeneral > 0
              ? ((totalRegistradoGeneral / totalDivpolGeneral) * 100).toFixed(2)
              : "0.00";

          const porcentajeVotadoVsDivGeneral =
            totalDivpolGeneral > 0
              ? ((totalVotadoGeneral / totalDivpolGeneral) * 100).toFixed(2)
              : "0.00";

          return {
            ...puesto,
            mesas: mesasProcessadas,
            totalMesas: mesasProcessadas.length,
            totalRegistradoGeneral,
            totalVotadoGeneral,
            totalDivpolGeneral,
            porcentajeGeneral,
            porcentajeRegistradoVsDivGeneral,
            porcentajeVotadoVsDivGeneral,
          };
        });

        setTableData(processedData);
        // Por defecto todos los puestos ocultos
        const allCollapsed = {};
        processedData.forEach((_, idx) => {
          allCollapsed[idx] = false;
        });
        setExpandedBooths(allCollapsed);
      } catch (error) {
        console.error("Error loading analysis data:", error);
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, [filters]);

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* Barra de herramientas */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Resultados del Análisis
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Comparativa de registros vs votados contra DIVIPOLE
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={loading || tableData.length === 0 || isExporting}
            title={
              loading || tableData.length === 0
                ? "No hay datos para exportar"
                : isExporting
                  ? "Generando archivo..."
                  : "Exportar a Excel"
            }
            className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-md transition flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base ${
              !loading && tableData.length > 0 && !isExporting
                ? "bg-green-600 text-white hover:bg-green-700"
                : isExporting
                  ? "bg-orange-500 text-white cursor-wait opacity-70"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isExporting ? (
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

          {showExportMenu &&
            !isExporting &&
            !loading &&
            tableData.length > 0 && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <button
                  onClick={handleExport}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2 text-sm"
                >
                  <span>📈</span> Exportar a Excel
                </button>
              </div>
            )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500 text-sm">Cargando datos de análisis...</p>
        </div>
      )}
      {!loading && (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-300 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-700 text-xs">
                  Departamento
                </th>
                <th className="px-4 py-3 text-left font-bold text-gray-700 text-xs">
                  Municipio
                </th>
                <th className="px-4 py-3 text-left font-bold text-gray-700 text-xs">
                  Puesto
                </th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 text-xs">
                  Total Puesto
                </th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 text-xs">
                  Mesa
                </th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 text-xs">
                  Registrado
                </th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 text-xs">
                  Votado
                </th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 text-xs">
                  DIVIPOLE
                </th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 text-xs">
                  % Reg/DIV
                </th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 text-xs">
                  % Vot/DIV
                </th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 text-xs">
                  % Reg/Vot
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map((puesto, puestoIdx) => (
                  <React.Fragment key={puestoIdx}>
                    {/* Fila del puesto de votación (clickeable) */}
                    <tr
                      onClick={() => toggleBooth(puestoIdx)}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-900 font-semibold text-xs">
                        {puesto.departamento}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-semibold text-xs">
                        {puesto.municipio}
                      </td>
                      <td className="px-4 py-3 text-gray-900 flex items-center gap-2">
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-transform flex-shrink-0 text-gray-600 ${
                            expandedBooths[puestoIdx] ? "rotate-180" : ""
                          }`}
                        />
                        <span className="font-semibold">
                          {puesto.puestoVotacion}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900 font-bold text-xs">
                        {puesto.totalPuesto}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900 text-xs">
                        {puesto.totalMesas}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900 font-semibold text-xs">
                        {puesto.totalRegistradoGeneral}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900 font-semibold text-xs">
                        {puesto.totalVotadoGeneral}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900 font-semibold text-xs">
                        {puesto.totalDivpolGeneral}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-semibold border border-green-200">
                          {puesto.porcentajeRegistradoVsDivGeneral}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold border border-amber-200">
                          {puesto.porcentajeVotadoVsDivGeneral}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold text-xs border border-blue-200">
                          {puesto.porcentajeGeneral}%
                        </span>
                      </td>
                    </tr>

                    {/* Filas de mesas (mostrar solo si expandido) */}
                    {expandedBooths[puestoIdx] &&
                      puesto.mesas.map((mesa, mesaIdx) => (
                        <tr
                          key={`${puestoIdx}-${mesaIdx}`}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-xs"
                        >
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3 text-center text-gray-700 font-semibold">
                            {mesa.mesa}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700 font-semibold">
                            {mesa.totalRegistrado}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700 font-semibold">
                            {mesa.totalVotado}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700 font-semibold">
                            {mesa.totalDivipol}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-semibold border border-green-200">
                              {mesa.porcentajeRegistradoVsDivipol}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold border border-amber-200">
                              {mesa.porcentajeVotadoVsDivipol}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold border border-blue-200">
                              {mesa.porcentajeRegistradoVsVotado}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="11"
                    className="px-4 py-8 text-center text-gray-500 text-sm"
                  >
                    No hay datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
