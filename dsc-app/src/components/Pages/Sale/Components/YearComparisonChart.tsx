import React from "react";
import { Chart } from "primereact/chart";

interface YearComparisonChartProps {
  currentYearValue: number;
  lastYearValue: number;
  title: string;
  formatValue?: (value: number) => string;
  height?: string;
}

const YearComparisonChart: React.FC<YearComparisonChartProps> = ({
  currentYearValue,
  lastYearValue,
  title,
  formatValue = (value) => value.toString(),
  height = "300px",
}) => {
  // Calculate growth percentage
  const hasLastYear = lastYearValue !== 0;
  const growthPercentage = hasLastYear
    ? ((currentYearValue / lastYearValue) * 100 - 100).toFixed(1)
    : "N/A";
  const isPositiveGrowth = currentYearValue >= lastYearValue;

  // Chart data
  const chartData = {
    labels: ["Last Year", "This Year"],
    datasets: [
      {
        data: [lastYearValue, currentYearValue],
        backgroundColor: ["#64748B", isPositiveGrowth ? "#22C55E" : "#EF4444"],
        borderWidth: 0,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: { label: string; raw: number }) {
            return `${context.label}: ${formatValue(context.raw)}`;
          },
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: number) {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}K`;
            }
            return value;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="space-y-2">
      <div style={{ height }}>
        <Chart type="bar" data={chartData} options={chartOptions} />
      </div>
      <div className="text-center text-sm">
        {hasLastYear ? (
          <span>
            Growth:{" "}
            <span
              className={isPositiveGrowth ? "text-green-600" : "text-red-600"}
            >
              {isPositiveGrowth ? "+" : ""}
              {growthPercentage}%
            </span>
          </span>
        ) : (
          <span className="text-gray-500">No comparison data available</span>
        )}
      </div>
    </div>
  );
};

export default YearComparisonChart;
