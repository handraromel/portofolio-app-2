import React, { useMemo } from "react";
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
  title: string;
}

const BrandPerformanceChart: React.FC<BrandPerformanceChartProps> = ({
  mtdData,
  // dailyData,
  title,
}) => {
  const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

  // Calculate average sales for comparison in tooltip
  const avgSales = useMemo(() => {
    if (mtdData.length === 0) return 0;
    const totalSales = mtdData.reduce(
      (sum, brand) => sum + brand.saleAmount,
      0,
    );
    return totalSales / mtdData.length;
  }, [mtdData]);

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const brandData = payload[0].payload as BrandData;
      const brandColor =
        colors[
          mtdData.findIndex((b) => b.brandId === brandData.brandId) %
            colors.length
        ];

      return (
        <div className="max-w-[180px] rounded-md border border-gray-200 bg-white p-2 shadow-md sm:max-w-none sm:p-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 sm:text-sm dark:text-gray-300">
              Brand:
            </p>
            <p className="max-w-[100px] truncate text-xs font-bold text-gray-800 sm:text-sm dark:text-gray-100">
              {brandData.brandName}
            </p>
          </div>

          <div className="my-1 h-0.5 w-full bg-gray-100 dark:bg-gray-700"></div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 sm:text-sm dark:text-gray-300">
              MTD:
            </p>
            <p
              className="text-xs font-bold sm:text-sm"
              style={{ color: brandColor }}
            >
              &nbsp;{formatNumberToIDR(brandData.saleAmount)}
            </p>
          </div>

          {brandData.growthPercentage !== null && (
            <div className="mt-1 flex items-center justify-between">
              <p className="text-[10px] text-gray-500 sm:text-xs dark:text-gray-400">
                Growth:
              </p>
              <div className="flex items-center text-[10px] sm:text-xs">
                <GrowthIndicator
                  growthValue={brandData.growthPercentage}
                  isPercentage={true}
                  size="sm"
                />
              </div>
            </div>
          )}

          {avgSales > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <p className="text-[10px] text-gray-500 sm:text-xs dark:text-gray-400">
                vs Avg:
              </p>
              <div className="flex items-center text-[10px] sm:text-xs">
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
      <div className="mb-4 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h3 className="truncate text-base font-semibold text-gray-700 sm:text-lg dark:text-gray-200">
          {title}
        </h3>
      </div>

      {mtdData.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center p-2 text-center text-gray-500 sm:h-[300px] sm:p-4 dark:text-gray-400">
          <span className="text-sm">No data available for month-to-date</span>
        </div>
      ) : (
        <div className="h-[250px] w-full sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mtdData}
              margin={{
                top: 5,
                right: 10,
                left: 5,
                bottom: 30,
              }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  if (value >= 1000000)
                    return `${(value / 1000000).toFixed(0)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
              />
              <YAxis
                dataKey="brandName"
                type="category"
                tick={{ fontSize: 10 }}
                width={100}
                tickFormatter={(value) => {
                  return value.length > 12
                    ? `${value.substring(0, 12)}...`
                    : value;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />{" "}
              {/* Smaller for mobile */}
              <Bar
                dataKey="saleAmount"
                name="MTD Sales"
                radius={[0, 4, 4, 0]}
                barSize={20}
              >
                {mtdData.map((entry, index) => (
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
      {mtdData.length > 0 && (
        <div className="mt-5 sm:mt-7">
          <h4 className="mb-2 text-xs font-semibold text-gray-600 sm:mb-3 sm:text-sm dark:text-gray-300">
            Month to Date Brand Performance
          </h4>

          <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
            {mtdData.map((brand, index) => (
              <div
                key={brand.brandId}
                className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md sm:p-4 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              >
                {/* Color indicator matching the chart bar */}
                <div
                  className="absolute top-0 bottom-0 left-0 w-1 sm:w-1.5"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>

                <div className="flex flex-col pl-1 sm:pl-2">
                  {/* Brand name with truncation for long names */}
                  <div className="mb-1 flex items-center justify-between sm:mb-2">
                    <h5 className="max-w-[60%] truncate text-xs font-semibold text-gray-700 sm:max-w-[70%] sm:text-sm dark:text-gray-200">
                      {brand.brandName}
                    </h5>
                    <GrowthIndicator
                      growthValue={brand.growthPercentage}
                      isPercentage={true}
                      size="sm"
                      defaultValue={null}
                    />
                  </div>

                  {/* Sales amount with improved visualization */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-[10px] text-gray-500 sm:text-xs dark:text-gray-400">
                      MTD Sales
                    </div>
                    <div className="text-sm font-bold text-gray-800 sm:text-base dark:text-gray-200">
                      {formatNumberToIDR(brand.saleAmount)}
                    </div>
                  </div>

                  {/* Visual progress bar for relative performance within the dataset */}
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100 sm:mt-2 sm:h-1.5 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: colors[index % colors.length],
                        width: `${(brand.saleAmount / Math.max(...mtdData.map((d) => d.saleAmount))) * 100}%`,
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
