import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  TooltipProps,
} from "recharts";
import { formatNumberToIDR } from "@/utils/formatCurrency";
import { Dropdown } from "primereact/dropdown";
import GrowthIndicator from "@/components/Pages/Sale/Components/GrowthIndicator";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface SalesData {
  date: string;
  sales: number;
}

interface SalesLineChartProps {
  todayData?: SalesData[];
  tenDayData: SalesData[];
  monthData?: SalesData[];
  yearData?: SalesData[];
  title: string;
  color: string;
}

type TimePeriod = "today" | "10days" | "month" | "year";

interface TimePeriodOption {
  label: string;
  value: TimePeriod;
  icon: string;
}

const SalesLineChart: React.FC<SalesLineChartProps> = ({
  todayData = [],
  tenDayData,
  monthData = [],
  yearData = [],
  title,
  color,
}) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("10days");

  const timePeriodOptions: TimePeriodOption[] = [
    { label: "Today", value: "today", icon: "pi pi-clock" },
    { label: "10 Days", value: "10days", icon: "pi pi-calendar-minus" },
    { label: "Month", value: "month", icon: "pi pi-calendar" },
    { label: "Year", value: "year", icon: "pi pi-calendar-plus" },
  ];

  // Determine which dataset to use based on time period
  const getActiveData = () => {
    switch (timePeriod) {
      case "today":
        return todayData.length > 0 ? todayData : tenDayData;
      case "10days":
        return tenDayData;
      case "month":
        return monthData.length > 0 ? monthData : tenDayData;
      case "year":
        return yearData.length > 0 ? yearData : tenDayData;
      default:
        return tenDayData;
    }
  };

  const chartData = getActiveData();

  // Calculate statistics and metrics for the current time period
  const metrics = useMemo(() => {
    if (chartData.length === 0) return null;

    const totalSales = chartData.reduce((sum, item) => sum + item.sales, 0);
    const avgSales = totalSales / chartData.length;
    const maxSales = Math.max(...chartData.map((item) => item.sales));
    const minSales = Math.min(...chartData.map((item) => item.sales));

    // Find peak and dip days/times
    const peakPoint = chartData.find((item) => item.sales === maxSales);
    const dipPoint = chartData.find((item) => item.sales === minSales);

    // Calculate growth: compare last point to first point
    const firstValue = chartData[0]?.sales || 0;
    const lastValue = chartData[chartData.length - 1]?.sales || 0;
    const growthPercentage =
      firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    return {
      totalSales,
      avgSales,
      maxSales,
      minSales,
      peakPoint,
      dipPoint,
      growthPercentage,
    };
  }, [chartData]);

  // Get title based on time period
  const getTitle = () => {
    switch (timePeriod) {
      case "today":
        return "Today's Sales Performance (Hourly)";
      case "10days":
        return "Sales Performance (Last 10 Days)";
      case "month":
        return "Sales Performance (This Month)";
      case "year":
        return "Sales Performance (This Year)";
      default:
        return title;
    }
  };

  // Format X-axis ticks based on time period
  const formatXAxis = (value: string) => {
    if (timePeriod === "today") {
      // Format as hour for today's data
      return value.includes(":") ? value.split(":")[0] + "h" : value;
    } else if (timePeriod === "year") {
      // Format as month name for yearly data
      try {
        const date = new Date(value);
        return date.toLocaleString("default", { month: "short" });
      } catch {
        return value;
      }
    } else {
      // Format as day/month for 10days and month
      try {
        const date = new Date(value);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      } catch {
        return value;
      }
    }
  };

  // Custom template for dropdown items
  const timePeriodOptionTemplate = (option: TimePeriodOption) => {
    return (
      <div className="flex items-center gap-2">
        <i className={option.icon}></i>
        <span>{option.label}</span>
      </div>
    );
  };

  const selectedTimePeriodTemplate = (option: TimePeriodOption | null) => {
    if (option) {
      return (
        <div className="flex items-center gap-2">
          <i className={option.icon}></i>
          <span>{option.label}</span>
        </div>
      );
    }
    return <span>Select Time Period</span>;
  };

  // Get average line value for reference
  const averageSales = metrics?.avgSales || 0;

  // Enhanced custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SalesData;
      return (
        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              {timePeriod === "today" ? "Time" : "Date"}:
            </p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {timePeriod === "today"
                ? label
                : new Date(label).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
            </p>
          </div>
          <div className="my-1 h-0.5 w-full bg-gray-100 dark:bg-gray-700"></div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Sales:&nbsp;
            </p>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {formatNumberToIDR(data.sales)}
            </p>
          </div>

          {averageSales > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                vs Average:
              </p>
              <div className="flex items-center text-xs">
                <GrowthIndicator
                  growthValue={(data.sales / averageSales - 1) * 100}
                  isPercentage={true}
                />
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
      <div className="mb-4 flex flex-col items-start justify-between space-y-2 sm:flex-row sm:items-center sm:space-y-0">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          {getTitle()}
        </h3>

        {/* Time period dropdown */}
        <Dropdown
          value={timePeriod}
          options={timePeriodOptions}
          onChange={(e) => setTimePeriod(e.value)}
          optionLabel="label"
          placeholder="Select Time Period"
          className="w-full sm:w-48"
          itemTemplate={timePeriodOptionTemplate}
          valueTemplate={selectedTimePeriodTemplate}
        />
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
          No data available for the selected period
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => {
                  if (value >= 1000000)
                    return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Reference average line */}
              {averageSales > 0 && (
                <ReferenceLine
                  y={averageSales}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                >
                  <Label
                    value="Average"
                    position="insideBottomRight"
                    fill="#94a3b8"
                    fontSize={10}
                  />
                </ReferenceLine>
              )}

              <Line
                type="monotone"
                dataKey="sales"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance Metrics Cards - More responsive like BrandPerformance */}
      {metrics && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
            {timePeriod === "today"
              ? "Today's"
              : timePeriod === "10days"
                ? "10-Day"
                : timePeriod === "month"
                  ? "Monthly"
                  : "Yearly"}{" "}
            Performance Summary
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Sales Card */}
            <div className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-indigo-500"></div>
              <div className="flex flex-col pl-2">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Total Sales
                  </h5>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {timePeriod === "today"
                      ? "Today"
                      : timePeriod === "10days"
                        ? "Last 10 Days"
                        : timePeriod === "month"
                          ? "This Month"
                          : "This Year"}
                  </div>
                  <div className="text-base font-bold text-gray-800 dark:text-gray-200">
                    {formatNumberToIDR(metrics.totalSales)}
                  </div>
                </div>

                {/* Visual indicator bar - always 100% for total */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: "#4f46e5",
                      width: "100%",
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Average Sales Card */}
            <div className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-blue-500"></div>
              <div className="flex flex-col pl-2">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Average {timePeriod === "today" ? "Hourly" : "Daily"} Sales
                  </h5>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {timePeriod === "today" ? "Per Hour" : "Per Day"}
                  </div>
                  <div className="text-base font-bold text-gray-800 dark:text-gray-200">
                    {formatNumberToIDR(metrics.avgSales)}
                  </div>
                </div>

                {/* Visual indicator bar - represents avg as % of total/data points */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: "#0ea5e9",
                      width: `${(metrics.avgSales / metrics.maxSales) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Peak Sales Card */}
            <div className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-green-500"></div>
              <div className="flex flex-col pl-2">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Peak Sales {timePeriod === "today" ? "(Hour)" : "(Day)"}
                  </h5>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {timePeriod === "today"
                      ? `at ${metrics.peakPoint?.date}`
                      : `on ${new Date(
                          metrics.peakPoint?.date || "",
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}`}
                  </div>
                  <div className="text-base font-bold text-gray-800 dark:text-gray-200">
                    {formatNumberToIDR(metrics.maxSales)}
                  </div>
                </div>

                {/* Visual indicator bar - always 100% as it's the max */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: "#10b981",
                      width: "100%",
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Trend Card - Only shown in SM and above */}
            <div className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md sm:col-span-2 lg:col-span-3 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-purple-500"></div>
              <div className="flex flex-col pl-2">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {timePeriod === "today" ? "Today's" : "Period"} Trend
                  </h5>
                  <GrowthIndicator
                    growthValue={metrics.growthPercentage}
                    isPercentage={true}
                    size="sm"
                  />
                </div>
                <div className="flex items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {metrics.growthPercentage > 0
                      ? "Upward trend showing growth compared to the"
                      : metrics.growthPercentage < 0
                        ? "Downward trend showing decline compared to the"
                        : "Stable performance compared to the"}{" "}
                    {timePeriod === "today"
                      ? "start of day"
                      : "beginning of this period"}
                  </div>
                </div>

                {/* Visual trend indicator */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor:
                        metrics.growthPercentage >= 0 ? "#10b981" : "#ef4444",
                      width: `${Math.min(Math.abs(metrics.growthPercentage * 2), 100)}%`,
                      marginLeft: metrics.growthPercentage >= 0 ? "0" : "auto",
                      marginRight: metrics.growthPercentage < 0 ? "0" : "auto",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesLineChart;
