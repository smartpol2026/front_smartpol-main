import { useMemo } from "react";
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

export const GraficDoughnut = ({ totalPendientes, totalRegisteredVotes }) => {
  const total = totalRegisteredVotes + totalPendientes;

  const data = {
    labels: ["Votos Registrados", "Votos Pendientes"],
    datasets: [
      {
        data: [totalRegisteredVotes, totalPendientes],
        backgroundColor: ["#10b981", "#dc2626"],
        borderColor: "#fff",
        borderWidth: 2,
        hoverBackgroundColor: ["#059669", "#b91c1c"],
        hoverBorderColor: "#000",
        hoverBorderWidth: 3,
        label: "Votos",
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      intersect: true,
      mode: "index",
    },
    plugins: {
      title: {
        display: true,
        text: "Registro de Votos",
        font: {
          size: 16,
          weight: "bold",
        },
      },
      legend: {
        position: "bottom",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 13,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
        borderColor: "rgba(255, 255, 255, 0.5)",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(2) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: "#fff",
        font: {
          weight: "bold",
          size: 13,
        },
        formatter: (value) => {
          if (total === 0) return "0%";
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        },
        anchor: "center",
        align: "center",
      },
    },
  };

  useMemo(() => {
    if (totalPendientes || totalRegisteredVotes) {
      data.datasets[0].data = [totalRegisteredVotes, totalPendientes];
    }
  }, [totalRegisteredVotes, totalPendientes]);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 p-6 transition-all duration-300">
      <div style={{ position: "relative", height: "340px" }}>
        <Doughnut data={data} options={options} />
      </div>

      {/* Estadísticas adicionales */}
      <div className="flex flex-col gap-3 px-3 py-4 border-t border-gray-200 mt-4">
        <div className="flex items-center justify-between hover:bg-gray-50 px-2 py-2 rounded transition-colors duration-200">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#2ecc71]"></span>
            <span className="text-sm text-gray-700 font-medium">
              Votos Registrados
            </span>
          </span>
          <span className="text-lg font-bold text-gray-900 bg-green-50 px-3 py-1 rounded">
            {totalRegisteredVotes}
          </span>
        </div>
        <div className="flex items-center justify-between hover:bg-gray-50 px-2 py-2 rounded transition-colors duration-200">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#e74c3c]"></span>
            <span className="text-sm text-gray-700 font-medium">
              Votos Pendientes
            </span>
          </span>
          <span className="text-lg font-bold text-gray-900 bg-red-50 px-3 py-1 rounded">
            {totalPendientes}
          </span>
        </div>
      </div>
    </div>
  );
};
