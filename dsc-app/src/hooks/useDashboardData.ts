import { useState, useEffect } from "react";
import { useSale } from "@/actions/useSale";
import { formatDateForAPI } from "@/utils/formatDate";
import {
  DailySalesSummary,
  MtdSalesSummary,
  BrandPerformanceData,
} from "@/types/sale";

export interface DashboardSummary {
  dailySalesSummary: DailySalesSummary | null;
  mtdSalesSummary: MtdSalesSummary | null;
  isLoading: boolean;
  error: Error | null;
  refreshData: () => Promise<void>;
  fetchMtdSales: (params: {
    date?: string;
    page?: number;
    per_page?: number;
  }) => Promise<void>;
  topPerformingBrands: BrandPerformanceData[];
  topDailyBrands: BrandPerformanceData[];
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
    fetchMtdSales: fetchMtdSalesOriginal,
  } = useSale();

  const [topPerformingBrands, setTopPerformingBrands] = useState<
    BrandPerformanceData[]
  >([]);
  const [topDailyBrands, setTopDailyBrands] = useState<BrandPerformanceData[]>(
    [],
  );

  // Function to refresh data
  const refreshData = async (): Promise<void> => {
    const today = new Date();
    // Fetch daily sales data for today
    await fetchDailySales({
      date: formatDateForAPI(today) || undefined,
      page: 1,
      per_page: 50,
    });

    // Fetch MTD data for current month
    await fetchMtdSales({
      date: formatDateForAPI(today) || undefined,
      page: 1,
      per_page: 50,
    });
  };

  // Wrapper for fetchMtdSales to expose to components
  const fetchMtdSales = async (params: {
    date?: string;
    page?: number;
    per_page?: number;
  }): Promise<void> => {
    await fetchMtdSalesOriginal(params);
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

  // Calculate yearly growth
  const yearlyGrowth = mtdSalesSummary?.total.growth_pct || null;

  return {
    dailySalesSummary: dailySalesSummary || null,
    mtdSalesSummary: mtdSalesSummary || null,
    isLoading: isDailyReportLoading || isMtdReportLoading,
    error,
    refreshData,
    fetchMtdSales,
    topPerformingBrands,
    topDailyBrands,
    yearlyGrowth,
  };
};
