import React, { useState, useMemo, useEffect } from "react";
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
import { Calendar } from "primereact/calendar";
import GrowthIndicator from "@/components/Pages/Sale/Components/GrowthIndicator";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useMonthlyTrendSales } from "@/services/SaleService";
import { Button } from "primereact/button";

interface SalesMonthlyChartProps {
  title?: string;
  color?: string;
  selectedDate?: Date;
  onMonthChange?: (e: { value: Date | Date[] | undefined }) => void;
}

const SalesMonthlyChart: React.FC<SalesMonthlyChartProps> = ({
  title = "Monthly Sales Performance",
  color = "#4f46e5",
  selectedDate,
  onMonthChange,
}) => {
  // Use internal state for date if not controlled externally
  const today = new Date();
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(today);

  // Extract year and month from selected date
  const year = (selectedDate || internalSelectedDate).getFullYear();
  const month = (selectedDate || internalSelectedDate).getMonth() + 1; // JavaScript months are 0-indexed

  // Fetch monthly sales data
  const {
    data: salesTrendResponse,
    isLoading,
    error,
    refetch,
  } = useMonthlyTrendSales(year, month);

  // Sync internal state with external state when provided
  useEffect(() => {
    if (selectedDate) {
      setInternalSelectedDate(selectedDate);
    }
  }, [selectedDate]);

  // Format the sales data for the chart
  const chartData = useMemo(() => {
    if (!salesTrendResponse?.data || salesTrendResponse.data.length === 0) {
      return [];
    }

    return salesTrendResponse.data.map((item) => ({
      date: item.date,
      sales: item.sales,
    }));
  }, [salesTrendResponse]);

  const isChartDataHasNoSale = useMemo(() => {
    if (chartData.length === 0) return true;

    return chartData.every((item) => item.sales === 0);
  }, [chartData]);

  const handleDateChange = (event: {
    value: Date | Date[] | null | undefined;
  }) => {
    const value = event.value;
    if (value instanceof Date) {
      // Update internal state
      setInternalSelectedDate(value);

      // Callback to parent if provided
      if (onMonthChange) {
        onMonthChange({ value });
      }
    }
  };

  // Calculate statistics and metrics for the current month
  const metrics = useMemo(() => {
    if (chartData.length === 0) return null;

    const totalSales = chartData.reduce((sum, item) => sum + item.sales, 0);
    const avgSales = totalSales / chartData.length;
    const maxSales = Math.max(...chartData.map((item) => item.sales));
    const minSales = Math.min(...chartData.map((item) => item.sales));

    // Find peak and dip days
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

  // Format X-axis ticks to show day of month
  const formatXAxis = (value: string) => {
    try {
      const date = new Date(value);
      return date.getDate().toString(); // Just show the day number
    } catch {
      return value;
    }
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
      const data = payload[0].payload as { date: string; sales: number };
      return (
        <div className="max-w-[200px] rounded-md border border-gray-200 bg-white p-2 shadow-md sm:max-w-none sm:p-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 sm:text-sm dark:text-gray-300">
              Date:
            </p>
            <p className="text-xs font-bold text-gray-800 sm:text-sm dark:text-gray-100">
              {new Date(label).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="my-1 h-0.5 w-full bg-gray-100 dark:bg-gray-700"></div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 sm:text-sm dark:text-gray-300">
              Sales:&nbsp;
            </p>
            <p className="text-xs font-bold text-indigo-600 sm:text-sm dark:text-indigo-400">
              {formatNumberToIDR(data.sales)}
            </p>
          </div>

          {averageSales > 0 && data.sales !== 0 && (
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
        <h3 className="w-full truncate text-lg font-semibold text-gray-700 dark:text-gray-200">
          {title} -{" "}
          {(selectedDate || internalSelectedDate).toLocaleDateString(
            undefined,
            {
              month: "long",
              year: "numeric",
            },
          )}
        </h3>

        <div className="flex flex-row items-center gap-2 self-end sm:self-auto">
          {!selectedDate && (
            <Calendar
              value={internalSelectedDate}
              onChange={(e) => {
                if (e.value instanceof Date || e.value === null) {
                  handleDateChange({ value: e.value });
                }
              }}
              view="month"
              dateFormat="MM/yy"
              showIcon
              className="w-32"
            />
          )}
          <Button
            icon="pi pi-refresh"
            outlined
            severity="info"
            onClick={() => refetch()}
            loading={isLoading}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center sm:h-[300px]">
          <i className="pi pi-spin pi-spinner text-primary text-xl sm:text-2xl"></i>
        </div>
      ) : error ? (
        <div className="flex h-[200px] items-center justify-center p-4 text-center text-red-500 sm:h-[300px]">
          <span className="text-sm sm:text-base">
            Error loading data: {error.message}
          </span>
        </div>
      ) : isChartDataHasNoSale ? (
        <div className="flex h-[200px] items-center justify-center p-4 text-center text-gray-500 sm:h-[300px] dark:text-gray-400">
          <span className="text-sm sm:text-base">
            No data available for the selected month
          </span>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) => {
                  if (value >= 1000000)
                    return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
                tick={{ fontSize: 10 }}
                width={40}
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

      {/* Performance Metrics Cards */}
      {metrics && !isLoading && !isChartDataHasNoSale && (
        <div className="mt-4 sm:mt-6">
          <h4 className="mb-2 text-sm font-semibold text-gray-600 sm:mb-3 dark:text-gray-300">
            Monthly Performance Summary
          </h4>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {/* Total Sales Card - simplified for mobile */}
            <div className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md sm:p-4 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500 sm:w-1.5"></div>
              <div className="flex flex-col pl-2">
                <div className="mb-1 flex items-center justify-between sm:mb-2">
                  <h5 className="truncate text-xs font-semibold text-gray-700 sm:text-sm dark:text-gray-200">
                    Total Sales
                  </h5>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    This Month
                  </div>
                  <div className="text-sm font-bold text-gray-800 sm:text-base dark:text-gray-200">
                    {formatNumberToIDR(metrics.totalSales)}
                  </div>
                </div>

                {/* Visual indicator bar */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100 sm:h-1.5 dark:bg-gray-700">
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
                    Average Daily Sales
                  </h5>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Per Day
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
                    Peak Sales (Day)
                  </h5>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {metrics.peakPoint
                      ? `on ${new Date(
                          metrics.peakPoint.date || "",
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}`
                      : "N/A"}
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
                    Month Trend
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
                    beginning of this month
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

export default SalesMonthlyChart;
