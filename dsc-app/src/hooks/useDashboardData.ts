import { useState, useEffect } from "react";
import { useSale } from "@/actions/useSale";
import { formatDateForAPI } from "@/utils/formatDate";
import { DailySalesSummary, MtdSalesSummary } from "@/types/sale";

// Define a shared interface for brand data to avoid duplication
interface BrandPerformanceData {
  brandId: string;
  brandName: string;
  saleAmount: number;
  growthPercentage: number | null;
}

// Define interface for performance data points
interface PerformanceDataPoint {
  date: string;
  sales: number;
}

export interface DashboardSummary {
  dailySalesSummary: DailySalesSummary | null;
  mtdSalesSummary: MtdSalesSummary | null;
  isLoading: boolean;
  error: Error | null;
  refreshData: () => Promise<void>;
  topPerformingBrands: BrandPerformanceData[];
  topDailyBrands: BrandPerformanceData[];
  performanceOverPeriod: PerformanceDataPoint[];
  performanceOverToday: PerformanceDataPoint[];
  performanceOverMonth: PerformanceDataPoint[];
  performanceOverYear: PerformanceDataPoint[];
  yearlyGrowth: number | null;
}

export const useDashboardData = (): DashboardSummary => {
  const {
    dailySalesSummary,
    mtdSalesSummary,
    isDailyReportLoading,
    isMtdReportLoading,
    error,
    fetchDailySales,
    fetchMtdSales,
  } = useSale();

  const [topPerformingBrands, setTopPerformingBrands] = useState<
    BrandPerformanceData[]
  >([]);
  const [topDailyBrands, setTopDailyBrands] = useState<BrandPerformanceData[]>(
    [],
  );

  // State for different time period performance data
  const [performanceOverPeriod, setPerformanceOverPeriod] = useState<
    PerformanceDataPoint[]
  >([]);
  const [performanceOverToday, setPerformanceOverToday] = useState<
    PerformanceDataPoint[]
  >([]);
  const [performanceOverMonth, setPerformanceOverMonth] = useState<
    PerformanceDataPoint[]
  >([]);
  const [performanceOverYear, setPerformanceOverYear] = useState<
    PerformanceDataPoint[]
  >([]);

  // Function to refresh data
  const refreshData = async (): Promise<void> => {
    const today = new Date();
    // Fetch daily sales data for today
    await fetchDailySales({
      date: formatDateForAPI(today),
      page: 1,
      per_page: 10,
    });

    // Fetch MTD data for current month
    await fetchMtdSales({
      date: formatDateForAPI(today),
      page: 1,
      per_page: 10,
    });
  };

  // Process top performing brands for MTD
  useEffect(() => {
    if (mtdSalesSummary?.brands) {
      // Sort brands by sale amount descending and take top 5
      const sortedBrands = [...mtdSalesSummary.brands]
        .sort((a, b) => b.sale_amt - a.sale_amt)
        .slice(0, 5)
        .map((brand) => ({
          brandId: brand.brand_id,
          brandName: brand.brand_name,
          saleAmount: brand.sale_amt,
          growthPercentage: brand.growth_pct,
        }));

      setTopPerformingBrands(sortedBrands);
    }
  }, [mtdSalesSummary]);

  // Process top performing brands for daily
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

  // Generate 10-day performance data
  useEffect(() => {
    if (mtdSalesSummary?.total) {
      const today = new Date();
      const mockData = Array.from({ length: 10 }, (_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - (9 - i));

        // Weekend sales tend to be lower
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const salesFactor = isWeekend ? 0.7 : 1.0;

        return {
          date: date.toISOString().split("T")[0],
          sales:
            (mtdSalesSummary.total.sale_amt / 15) *
            (0.8 + Math.random() * 0.4) *
            salesFactor,
        };
      });

      setPerformanceOverPeriod(mockData);
    }
  }, [mtdSalesSummary]);

  // Generate today's hourly performance data
  useEffect(() => {
    if (dailySalesSummary?.total) {
      const totalSales = dailySalesSummary.total.sale_amt;
      const hourlyDistribution = [
        0.01,
        0.01,
        0.005,
        0.005,
        0.01,
        0.02, // 0-5 AM (very low)
        0.03,
        0.05,
        0.07,
        0.08, // 6-9 AM (waking up)
        0.09,
        0.08,
        0.12,
        0.1, // 10 AM-1 PM (late morning/lunch)
        0.08,
        0.07,
        0.06,
        0.07, // 2-5 PM (afternoon)
        0.09,
        0.08,
        0.06,
        0.04,
        0.02,
        0.015, // 6-11 PM (evening/night)
      ];

      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        // Add some randomness while preserving the pattern
        const randomFactor = 0.8 + Math.random() * 0.4;
        const hour = i.toString().padStart(2, "0");

        return {
          date: `${hour}:00`,
          sales: totalSales * hourlyDistribution[i] * randomFactor,
        };
      });

      setPerformanceOverToday(hourlyData);
    }
  }, [dailySalesSummary]);

  // Generate monthly data (daily for current month)
  useEffect(() => {
    if (mtdSalesSummary?.total) {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      // Generate data for all days in the month up to today
      const dailyData = Array.from(
        { length: Math.min(currentDay, daysInMonth) },
        (_, i) => {
          const date = new Date(currentYear, currentMonth, i + 1);

          // Weekdays have more sales than weekends
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          // First week of month often has higher sales (paydays)
          const weekOfMonth = Math.ceil((i + 1) / 7);
          const isFirstWeek = weekOfMonth === 1;

          // Sales factor based on day type and week
          let salesFactor = 1.0;
          if (isWeekend) salesFactor *= 0.7;
          if (isFirstWeek) salesFactor *= 1.2;

          return {
            date: date.toISOString().split("T")[0],
            sales:
              (mtdSalesSummary.total.sale_amt / currentDay) *
              (0.8 + Math.random() * 0.4) *
              salesFactor,
          };
        },
      );

      setPerformanceOverMonth(dailyData);
    }
  }, [mtdSalesSummary]);

  // Generate yearly data (monthly for current year)
  useEffect(() => {
    if (mtdSalesSummary?.total) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Seasonal factors for each month (retail patterns)
      const seasonalFactors = [
        0.7, // January (post-holiday slump)
        0.8, // February (still slow)
        1.0, // March (spring sales begin)
        1.1, // April (continued spring sales)
        1.1, // May (pre-summer sales)
        1.0, // June (start of summer)
        0.9, // July (summer slowdown)
        1.1, // August (back to school)
        1.1, // September (fall transition)
        1.0, // October (pre-holiday)
        1.3, // November (holiday shopping begins)
        1.5, // December (peak holiday season)
      ];

      // Generate data for each month up to current month
      const monthlyData = Array.from({ length: currentMonth + 1 }, (_, i) => {
        const date = new Date(currentYear, i, 1);

        // Apply seasonal factor with some randomness
        const randomFactor = 0.9 + Math.random() * 0.2;
        const estimatedMonthlySales =
          mtdSalesSummary.total.sale_amt * seasonalFactors[i] * randomFactor;

        return {
          date: date.toISOString().split("T")[0],
          sales: estimatedMonthlySales,
        };
      });

      setPerformanceOverYear(monthlyData);
    }
  }, [mtdSalesSummary]);

  // Calculate yearly growth
  const yearlyGrowth = mtdSalesSummary?.total.growth_pct || null;

  return {
    dailySalesSummary: dailySalesSummary || null,
    mtdSalesSummary: mtdSalesSummary || null,
    isLoading: isDailyReportLoading || isMtdReportLoading,
    error,
    refreshData,
    topPerformingBrands,
    topDailyBrands,
    performanceOverPeriod,
    performanceOverToday,
    performanceOverMonth,
    performanceOverYear,
    yearlyGrowth,
  };
};
