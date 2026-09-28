import { useMemo } from "react";
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

const COLORS = [
  "#f59e0b",
  "#d97706",
  "#dc2626",
  "#10b981",
  "#059669",
  "#6b7280",
  "#ea580c",
  "#b91c1c",
  "#047857",
  "#78716c",
  "#f97316",
  "#8b5cf6",
];

const normalizeColor = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9A-Fa-f]{6}$/.test(withHash) ? withHash.toUpperCase() : null;
};

const resolvePartyColor = (item, index) => {
  return normalizeColor(item.candidateColor) || COLORS[index % COLORS.length];
};

export const VotersByParty = ({ data = [] }) => {
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.voterCount, 0);
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: ["Sin datos"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#e0e0e0"],
            borderColor: ["#e0e0e0"],
            borderWidth: 1,
          },
        ],
      };
    }

    const labels = data.map((item) => item.party);
    const values = data.map((item) => item.voterCount);
    const colors = data.map((item, index) => resolvePartyColor(item, index));

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: "#fff",
          borderWidth: 2,
          hoverBackgroundColor: colors,
          hoverBorderColor: "#000",
          hoverBorderWidth: 3,
          borderDash: [],
          label: "Votantes",
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      intersect: true,
      mode: "index",
    },
    plugins: {
      title: {
        display: true,
        text: "Votantes por Partido",
        font: {
          size: 16,
          weight: "bold",
        },
      },
      legend: {
        display: false,
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
            return `${label}: ${value} votantes (${percentage}%)`;
          },
        },
      },
      datalabels: {
        display: data.length > 0,
        color: "#fff",
        font: {
          weight: "bold",
          size: 11,
        },
        formatter: (value) => {
          if (total === 0) return "";
          const percentage = ((value / total) * 100).toFixed(1);
          return parseFloat(percentage) > 0 ? `${percentage}%` : "";
        },
        anchor: "center",
        align: "center",
        offset: 0,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 p-3 sm:p-6 transition-all duration-300 h-full flex flex-col">
      <div
        style={{ position: "relative", height: "340px" }}
        className="flex-shrink-0"
      >
        <Doughnut data={chartData} options={options} />
      </div>

      {data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex-1 overflow-hidden flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Detalle por Partido
          </h3>
          <div className="space-y-2 overflow-y-auto">
            {data.map((item, index) => {
              const percentage =
                total > 0 ? ((item.voterCount / total) * 100).toFixed(1) : 0;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: resolvePartyColor(item, index),
                      }}
                    ></div>
                    <span className="text-gray-700 truncate">{item.party}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-gray-600 font-medium text-right min-w-[45px]">
                      {item.voterCount.toLocaleString()}
                    </span>
                    <span className="text-blue-600 font-semibold min-w-[50px] text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
