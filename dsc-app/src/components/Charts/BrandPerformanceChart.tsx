import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { formatNumberToIDR } from "@/utils/formatCurrency";
import GrowthIndicator from "@/components/Pages/Sale/Components/GrowthIndicator";

interface BrandData {
  brandId: string;
  brandName: string;
  saleAmount: number;
  growthPercentage: number | null;
}

interface BrandPerformanceChartProps {
  mtdData: BrandData[];
  dailyData: BrandData[];
  title: string;
}

type ViewMode = "daily" | "mtd";

const BrandPerformanceChart: React.FC<BrandPerformanceChartProps> = ({
  mtdData,
  dailyData,
  title,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("mtd");
  const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

  // Determine which data to show based on viewMode
  const data = viewMode === "mtd" ? mtdData : dailyData;

  // Calculate average sales for comparison in tooltip
  const avgSales = useMemo(() => {
    if (data.length === 0) return 0;
    const totalSales = data.reduce((sum, brand) => sum + brand.saleAmount, 0);
    return totalSales / data.length;
  }, [data]);

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const brandData = payload[0].payload as BrandData;
      const brandColor =
        colors[
          data.findIndex((b) => b.brandId === brandData.brandId) % colors.length
        ];

      return (
        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Brand:
            </p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {brandData.brandName}
            </p>
          </div>

          <div className="my-1 h-0.5 w-full bg-gray-100 dark:bg-gray-700"></div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              {viewMode === "mtd" ? "MTD Sales:" : "Daily Sales:"}
            </p>
            <p className="text-sm font-bold" style={{ color: brandColor }}>
              &nbsp;{formatNumberToIDR(brandData.saleAmount)}
            </p>
          </div>

          {brandData.growthPercentage !== null && (
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Growth:
              </p>
              <div className="flex items-center text-xs">
                <GrowthIndicator
                  growthValue={brandData.growthPercentage}
                  isPercentage={true}
                  showZero={true}
                />
              </div>
            </div>
          )}

          {avgSales > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                vs Average:
              </p>
              <div className="flex items-center text-xs">
                <GrowthIndicator
                  growthValue={(brandData.saleAmount / avgSales - 1) * 100}
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          {title}
        </h3>

        {/* Toggle buttons */}
        <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewMode("daily")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
              viewMode === "daily"
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <i className="pi pi-calendar-day mr-1"></i> Daily
          </button>
          <button
            onClick={() => setViewMode("mtd")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
              viewMode === "mtd"
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <i className="pi pi-calendar mr-1"></i> MTD
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
          No data available for {viewMode === "mtd" ? "month-to-date" : "today"}
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 50,
              }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000)
                    return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              <YAxis
                dataKey="brandName"
                type="category"
                tick={{ fontSize: 12 }}
                width={150}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="saleAmount"
                name={`${viewMode === "mtd" ? "Month-to-Date" : "Daily"} Sales`}
                radius={[0, 4, 4, 0]}
                barSize={30}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Enhanced Brand Performance Cards */}
      {data.length > 0 && (
        <div className="mt-7">
          <h4 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
            {viewMode === "mtd" ? "Month to Date" : "Daily"} Brand Performance
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((brand, index) => (
              <div
                key={brand.brandId}
                className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              >
                {/* Color indicator matching the chart bar */}
                <div
                  className="absolute top-0 bottom-0 left-0 w-1.5"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>

                <div className="flex flex-col pl-2">
                  {/* Brand name with truncation for long names */}
                  <div className="mb-2 flex items-center justify-between">
                    <h5 className="max-w-[70%] truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {brand.brandName}
                    </h5>
                    <GrowthIndicator
                      growthValue={brand.growthPercentage}
                      isPercentage={true}
                      showZero={true}
                      size="sm"
                    />
                  </div>

                  {/* Sales amount with improved visualization */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {viewMode === "mtd" ? "MTD Sales" : "Today's Sales"}
                    </div>
                    <div className="text-base font-bold text-gray-800 dark:text-gray-200">
                      {formatNumberToIDR(brand.saleAmount)}
                    </div>
                  </div>

                  {/* Visual progress bar for relative performance within the dataset */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: colors[index % colors.length],
                        width: `${(brand.saleAmount / Math.max(...data.map((d) => d.saleAmount))) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandPerformanceChart;
