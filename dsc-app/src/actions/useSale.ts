import { useState } from "react";
import { formatDateForAPI } from "@/utils/formatDate";
import {
  useSales,
  useCreateSale,
  useUpdateSale,
  useDeleteSale,
  useDailySales,
  useMtdSales,
} from "@/services/SaleService";
import { SaleSubmission, SaleQueryFilters } from "@/types/sale";

export const useSale = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<SaleQueryFilters>({
    page: 1,
    per_page: 10,
    search: "",
  });

  const [dailyReportParams, setDailyReportParams] = useState({
    date: formatDateForAPI(new Date()),
    brand_id: undefined as string | undefined,
    group_id: undefined as string | undefined,
    division_id: undefined as string | undefined,
    category_id: undefined as string | undefined,
    page: 1,
    per_page: 10,
  });

  const [mtdReportParams, setMtdReportParams] = useState({
    date: formatDateForAPI(new Date()),
    brand_id: undefined as string | undefined,
    group_id: undefined as string | undefined,
    division_id: undefined as string | undefined,
    category_id: undefined as string | undefined,
    page: 1,
    per_page: 10,
  });

  // Queries
  const salesQuery = useSales(filters);
  const dailySalesQuery = useDailySales(
    dailyReportParams.date || undefined,
    undefined,
    undefined,
    undefined,
    dailyReportParams.brand_id,
    dailyReportParams.group_id,
    dailyReportParams.division_id,
    dailyReportParams.category_id,
  );
  const mtdSalesQuery = useMtdSales(
    mtdReportParams.date || undefined,
    undefined,
    undefined,
    mtdReportParams.brand_id,
    mtdReportParams.group_id,
    mtdReportParams.division_id,
    mtdReportParams.category_id,
  );

  // Mutations
  const createSaleMutation = useCreateSale();
  const updateSaleMutation = useUpdateSale();
  const deleteSaleMutation = useDeleteSale();

  const fetchSales = async (newFilters?: Partial<SaleQueryFilters>) => {
    if (newFilters) {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }
    return await salesQuery.refetch();
  };

  const fetchDailySales = async (
    params?: Partial<typeof dailyReportParams>,
  ) => {
    if (params) {
      setDailyReportParams((prev) => ({ ...prev, ...params }));
    }
    return await dailySalesQuery.refetch();
  };

  const fetchMtdSales = async (params?: Partial<typeof mtdReportParams>) => {
    if (params) {
      setMtdReportParams((prev) => ({ ...prev, ...params }));
    }
    return await mtdSalesQuery.refetch();
  };

  const handleCreateSale = async (data: SaleSubmission) => {
    const response = await createSaleMutation.mutateAsync(data);
    return response;
  };

  const handleUpdateSale = async (
    saleId: string,
    data: Partial<SaleSubmission>,
  ) => {
    const response = await updateSaleMutation.mutateAsync({
      saleId,
      data,
    });
    return response;
  };

  const handleDeleteSale = async (saleId: string) => {
    return await deleteSaleMutation.mutateAsync(saleId);
  };

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePerPageChange = (per_page: number) => {
    setFilters((prev) => ({ ...prev, per_page, page: 1 }));
  };

  const handleDateRangeChange = (start_date?: string, end_date?: string) => {
    setFilters((prev) => ({
      ...prev,
      start_date: start_date && start_date !== "" ? start_date : undefined,
      end_date: end_date && end_date !== "" ? end_date : undefined,
      page: 1,
    }));
  };

  const handleProductFilterChange = (
    brand_id?: string,
    group_id?: string,
    division_id?: string,
    category_id?: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      brand_id: brand_id && brand_id !== "" ? brand_id : undefined,
      group_id: group_id && group_id !== "" ? group_id : undefined,
      division_id: division_id && division_id !== "" ? division_id : undefined,
      category_id: category_id && category_id !== "" ? category_id : undefined,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      per_page: 10,
      search: "",
    });
  };

  return {
    // Data
    sales: salesQuery.data?.sales || [],
    dailySalesSummary: dailySalesQuery.data,
    mtdSalesSummary: mtdSalesQuery.data,

    pagination: salesQuery.data
      ? {
          currentPage: salesQuery.data.current_page,
          totalPages: salesQuery.data.pages,
          totalRecords: salesQuery.data.total,
        }
      : { currentPage: 1, totalPages: 1, totalRecords: 0 },
    filters,
    dailyReportParams,
    mtdReportParams,

    // Status
    isLoading:
      salesQuery.isLoading ||
      createSaleMutation.isPending ||
      updateSaleMutation.isPending ||
      deleteSaleMutation.isPending ||
      dailySalesQuery.isLoading ||
      mtdSalesQuery.isLoading,
    isDailyReportLoading: dailySalesQuery.isLoading,
    isMtdReportLoading: mtdSalesQuery.isLoading,
    error:
      salesQuery.error ||
      createSaleMutation.error ||
      updateSaleMutation.error ||
      deleteSaleMutation.error ||
      dailySalesQuery.error ||
      mtdSalesQuery.error,

    // Actions
    fetchSales,
    createSale: handleCreateSale,
    updateSale: handleUpdateSale,
    deleteSale: handleDeleteSale,
    searchSales: handleSearch,
    changePage: handlePageChange,
    changePerPage: handlePerPageChange,
    changeDateRange: handleDateRangeChange,
    changeProductFilters: handleProductFilterChange,
    clearFilters,
    fetchDailySales,
    fetchMtdSales,
    setActiveTab,

    // Original queries/mutations (for advanced use cases)
    salesQuery,
    dailySalesQuery,
    mtdSalesQuery,
    createSaleMutation,
    updateSaleMutation,
    deleteSaleMutation,
    activeTab,
  };
};
