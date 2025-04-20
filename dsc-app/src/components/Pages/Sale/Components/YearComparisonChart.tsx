import React, { useRef, useEffect, useState } from "react";
import { Chart } from "primereact/chart";

interface YearComparisonChartProps {
  currentYearValue: number;
  lastYearValue: number;
  title: string;
  formatValue?: (value: number) => string;
  minHeight?: string;
  className?: string;
}

const YearComparisonChart: React.FC<YearComparisonChartProps> = ({
  currentYearValue,
  lastYearValue,
  title,
  formatValue = (value) => value.toString(),
  minHeight = "200px",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Calculate growth percentage
  const hasLastYear = lastYearValue !== 0;
  const growthPercentage = hasLastYear
    ? ((currentYearValue / lastYearValue) * 100 - 100).toFixed(1)
    : "N/A";
  const isPositiveGrowth = currentYearValue >= lastYearValue;

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    // Initial update
    updateDimensions();

    // Add event listener for resize
    window.addEventListener("resize", updateDimensions);

    // Clean up
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Chart data
  const chartData = {
    labels: ["Last Year", "This Year"],
    datasets: [
      {
        data: [lastYearValue, currentYearValue],
        backgroundColor: ["#64748B", isPositiveGrowth ? "#22C55E" : "#EF4444"],
        borderWidth: 0,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
        maxBarThickness: 100,
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
      x: {
        grid: {
          display: false,
        },
      },
    },
    barThickness: "flex",
    maxBarThickness: 100,
    maintainAspectRatio: false,
    responsive: true,
    layout: {
      padding: {
        left: 20,
        right: 20,
      },
    },
    elements: {
      bar: {
        borderRadius: 4,
      },
    },
  };

  // Calculate relative chart height based on container width
  // This creates a responsive aspect ratio
  const getChartHeight = () => {
    // Base height plus responsive adjustment
    const baseHeight = 200;
    const aspectRatio = 2 / 1; // Width to height ratio

    if (containerWidth) {
      return Math.max(baseHeight, containerWidth / aspectRatio);
    }

    return baseHeight;
  };

  return (
    <div ref={containerRef} className={`flex h-full flex-col ${className}`}>
      <div
        className="flex-grow"
        style={{
          minHeight: minHeight,
          height: `${getChartHeight()}px`,
        }}
      >
        <Chart
          type="bar"
          data={chartData}
          options={chartOptions}
          className="h-full w-full"
        />
      </div>
      <div className="mt-2 mb-4 text-center text-sm">
        {hasLastYear ? (
          <span>
            Growth:{" "}
            <span
              className={isPositiveGrowth ? "text-green-600" : "text-red-600"}
              title="Comparison is with same day of week from last year (52 weeks ago)"
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
