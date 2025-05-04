import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/useStore";
import { useUser } from "@/services/UserService";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import BrandPerformanceChart from "@/components/Charts/BrandPerformanceChart";
import RecentActivities from "../Common/Activities";
import GrowthIndicator from "@/components/Pages/Sale/Components/GrowthIndicator";
import { useNavigate } from "react-router-dom";
import SalesMonthlyChart from "@/components/Charts/SalesMonthlyChart";
import { formatDateForAPI } from "@/utils/formatDate";

const Dashboard: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: userData } = useUser(currentUser?.id || "");
  const user = userData || currentUser;
  const navigate = useNavigate();

  // Add global state for selected month
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const {
    // dailySalesSummary,
    mtdSalesSummary,
    isLoading,
    refreshData,
    topPerformingBrands,
    yearlyGrowth,
    fetchMtdSales,
  } = useDashboardData();

  // Handle month selection change
  const handleMonthChange = (event: {
    value: Date | null | undefined | Date[];
  }) => {
    if (event.value instanceof Date) {
      setSelectedMonth(event.value);

      const formattedDate = formatDateForAPI(event.value);

      fetchMtdSales({
        date: formattedDate || undefined,
        page: 1,
        per_page: 10,
      });
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const today = new Date();
    setSelectedMonth(today);
    refreshData();
  }, []);

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
        <div className="mt-4 flex items-center gap-2 sm:mt-0">
          {/* Global month selector */}
          <Calendar
            value={selectedMonth}
            onChange={handleMonthChange}
            view="month"
            dateFormat="MM/yy"
            showIcon
            className="h-[2.3rem] w-48"
          />
          <Button
            label="View Sales"
            icon="pi pi-calendar"
            onClick={() => navigate("/sales")}
          />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <SalesMonthlyChart
          title="Monthly Sales Performance"
          color="#4f46e5"
          selectedDate={selectedMonth}
          onMonthChange={handleMonthChange}
        />
        <BrandPerformanceChart
          mtdData={topPerformingBrands}
          title={`Top Performing Brands - ${selectedMonth.toLocaleDateString(
            undefined,
            {
              month: "long",
              year: "numeric",
            },
          )}`}
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
            <div className="flex items-center">
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
                <GrowthIndicator
                  growthValue={
                    mtdSalesSummary?.total.sale_qty &&
                    mtdSalesSummary?.total.ly_data
                      ? mtdSalesSummary.total.ly_data.sale_qty > 0
                        ? (mtdSalesSummary.total.sale_qty /
                            mtdSalesSummary.total.ly_data.sale_qty) *
                            100 -
                          100
                        : mtdSalesSummary.total.sale_qty > 0
                          ? 100
                          : 0
                      : null
                  }
                  isPercentage={true}
                  size="lg"
                  className="text-3xl font-bold"
                  defaultValue="-"
                />
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
                        ? mtdSalesSummary.total.ly_data.transaction_count > 0
                          ? (mtdSalesSummary.total.transaction_count /
                              mtdSalesSummary.total.ly_data.transaction_count) *
                              100 -
                            100
                          : mtdSalesSummary.total.transaction_count > 0
                            ? 100
                            : 0
                        : null
                    }
                    isPercentage={true}
                    size="lg"
                    className="text-3xl font-bold"
                    defaultValue="-"
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
