import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/useStore";
import { useUser } from "@/services/UserService";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatNumberToIDR } from "@/utils/formatCurrency";
import { Button } from "primereact/button";
import SummaryCard from "@/components/Common/SummaryCard";
import SalesLineChart from "@/components/Charts/SalesLineChart";
import BrandPerformanceChart from "@/components/Charts/BrandPerformanceChart";
import RecentActivities from "../Common/Activities";
import GrowthIndicator from "@/components/Pages/Sale/Components/GrowthIndicator";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: userData } = useUser(currentUser?.id || "");
  const user = userData || currentUser;
  const navigate = useNavigate();
  const [topDailyBrands, setTopDailyBrands] = useState<
    {
      brandId: string;
      brandName: string;
      saleAmount: number;
      growthPercentage: number | null;
    }[]
  >([]);

  const {
    dailySalesSummary,
    mtdSalesSummary,
    isLoading,
    refreshData,
    topPerformingBrands,
    performanceOverPeriod,
    yearlyGrowth,
    performanceOverToday,
    performanceOverMonth,
    performanceOverYear,
  } = useDashboardData();

  // Fetch data on component mount
  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (dailySalesSummary?.brands) {
      // Sort brands by sale amount descending and take top 5
      const sortedBrands = [...dailySalesSummary.brands]
        .sort((a, b) => b.sale_amt - a.sale_amt)
        .slice(0, 5)
        .map((brand) => ({
          brandId: brand.brand_id,
          brandName: brand.brand_name,
          saleAmount: brand.sale_amt,
          growthPercentage: brand.growth_pct ?? null,
        }));

      setTopDailyBrands(sortedBrands);
    }
  }, [dailySalesSummary]);

  if (!currentUser) return null;

  return (
    <div className="flex flex-col px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Sales Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back,{" "}
            <span className="font-semibold text-indigo-500">
              {user?.first_name}
            </span>
            . Here&apos;s your sales overview.
          </p>
        </div>
        <div className="mt-4 flex gap-2 sm:mt-0">
          <Button
            label="View Sales"
            icon="pi pi-calendar"
            onClick={() => navigate("/sales")}
          />
          <Button
            icon="pi pi-refresh"
            label="Refresh Data"
            severity="info"
            outlined
            onClick={() => refreshData()}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          title="Today's Sales"
          value={formatNumberToIDR(dailySalesSummary?.total.sale_amt || 0)}
          growth={dailySalesSummary?.total.growth_pct || null}
          icon="pi pi-shopping-bag"
          color="blue"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Month-to-Date Sales"
          value={formatNumberToIDR(mtdSalesSummary?.total.sale_amt || 0)}
          growth={mtdSalesSummary?.total.growth_pct || null}
          icon="pi pi-calendar"
          color="green"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Total Items Sold Today"
          value={dailySalesSummary?.total.sale_qty || 0}
          icon="pi pi-box"
          color="yellow"
          isLoading={isLoading}
        />
        <SummaryCard
          title="AUR (Average Unit Retail)"
          value={formatNumberToIDR(
            mtdSalesSummary?.total.aur ||
              (mtdSalesSummary?.total.sale_qty
                ? mtdSalesSummary.total.sale_amt /
                  mtdSalesSummary.total.sale_qty
                : 0),
          )}
          icon="pi pi-dollar"
          color="purple"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="mb-8 grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <SalesLineChart
          tenDayData={performanceOverPeriod}
          todayData={performanceOverToday}
          monthData={performanceOverMonth}
          yearData={performanceOverYear}
          title="Sales Performance"
          color="#4f46e5"
        />
        <BrandPerformanceChart
          mtdData={topPerformingBrands}
          dailyData={topDailyBrands}
          title="Top Performing Brands (Month-to-Date)"
        />
      </div>

      {/* Year-over-Year Section */}
      <div className="mb-8 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 p-6 shadow-md dark:from-indigo-900/20 dark:to-blue-900/20">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          <i className="pi pi-chart-line mr-2 text-indigo-500"></i>
          Year-over-Year Performance
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-500">
              Sales Growth
            </div>
            <div className="mt-3 flex items-center">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                <div className="text-3xl font-bold">
                  <GrowthIndicator
                    growthValue={yearlyGrowth}
                    isPercentage={true}
                    size="lg"
                    className="text-3xl font-bold"
                  />
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Compared to last year
            </div>
          </div>

          <div className="flex flex-col items-center rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-500">
              Quantity Change
            </div>
            <div className="mt-3 flex items-center">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                <div className="text-3xl font-bold">
                  <GrowthIndicator
                    growthValue={
                      mtdSalesSummary?.total.sale_qty &&
                      mtdSalesSummary?.total.ly_data
                        ? (mtdSalesSummary.total.sale_qty /
                            mtdSalesSummary.total.ly_data.sale_qty) *
                            100 -
                          100
                        : null
                    }
                    isPercentage={true}
                    size="lg"
                    className="text-3xl font-bold"
                  />
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {mtdSalesSummary?.total.sale_qty && mtdSalesSummary?.total.ly_data
                ? `${
                    mtdSalesSummary.total.sale_qty -
                      mtdSalesSummary.total.ly_data.sale_qty >
                    0
                      ? "+"
                      : ""
                  }${mtdSalesSummary.total.sale_qty - mtdSalesSummary.total.ly_data.sale_qty} units`
                : "No comparison data"}
            </div>
          </div>

          <div className="flex flex-col items-center rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-500">
              Transaction Change
            </div>
            <div className="mt-3 flex items-center">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                <div className="text-3xl font-bold">
                  <GrowthIndicator
                    growthValue={
                      mtdSalesSummary?.total.transaction_count &&
                      mtdSalesSummary?.total.ly_data
                        ? (mtdSalesSummary.total.transaction_count /
                            mtdSalesSummary.total.ly_data.transaction_count) *
                            100 -
                          100
                        : null
                    }
                    isPercentage={true}
                    size="lg"
                    className="text-3xl font-bold"
                  />
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {mtdSalesSummary?.total.transaction_count &&
              mtdSalesSummary?.total.ly_data
                ? `${
                    mtdSalesSummary.total.transaction_count -
                      mtdSalesSummary.total.ly_data.transaction_count >
                    0
                      ? "+"
                      : ""
                  }${mtdSalesSummary.total.transaction_count - mtdSalesSummary.total.ly_data.transaction_count} transactions`
                : "No comparison data"}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <RecentActivities />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
