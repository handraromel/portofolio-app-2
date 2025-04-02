import { useState } from "react";
import {
  useTaxConfigurations,
  useCreateTaxConfiguration,
  useUpdateTaxConfiguration,
  useDeleteTaxConfiguration,
  useCurrentTax,
} from "@/services/TaxService";
import { TaxConfigurationSubmission, TaxQueryFilters } from "@/types/tax";

export const useTax = () => {
  const [filters, setFilters] = useState<TaxQueryFilters>({
    page: 1,
    per_page: 10,
    search: "",
  });

  // Queries
  const taxConfigsQuery = useTaxConfigurations(filters);
  const currentTaxQuery = useCurrentTax();

  // Mutations
  const createTaxConfigMutation = useCreateTaxConfiguration();
  const updateTaxConfigMutation = useUpdateTaxConfiguration();
  const deleteTaxConfigMutation = useDeleteTaxConfiguration();

  const fetchTaxConfigs = async (newFilters?: Partial<TaxQueryFilters>) => {
    if (newFilters) {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }
    return await taxConfigsQuery.refetch();
  };

  const handleCreateTaxConfig = async (data: TaxConfigurationSubmission) => {
    const response = await createTaxConfigMutation.mutateAsync(data);
    return response;
  };

  const handleUpdateTaxConfig = async (
    configId: string,
    data: Partial<TaxConfigurationSubmission>,
  ) => {
    const response = await updateTaxConfigMutation.mutateAsync({
      configId,
      data,
    });
    return response;
  };

  const handleDeleteTaxConfig = async (configId: string) => {
    return await deleteTaxConfigMutation.mutateAsync(configId);
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
      start_date: start_date || undefined,
      end_date: end_date || undefined,
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
    taxConfigurations: taxConfigsQuery.data?.tax_configurations || [],
    currentTaxRate: currentTaxQuery.data?.tax_rate,
    pagination: taxConfigsQuery.data
      ? {
          currentPage: taxConfigsQuery.data.current_page,
          totalPages: taxConfigsQuery.data.pages,
          totalRecords: taxConfigsQuery.data.total,
        }
      : { currentPage: 1, totalPages: 1, totalRecords: 0 },
    filters,

    // Status
    isLoading:
      taxConfigsQuery.isLoading ||
      currentTaxQuery.isLoading ||
      createTaxConfigMutation.isPending ||
      updateTaxConfigMutation.isPending ||
      deleteTaxConfigMutation.isPending,
    error:
      taxConfigsQuery.error ||
      currentTaxQuery.error ||
      createTaxConfigMutation.error ||
      updateTaxConfigMutation.error ||
      deleteTaxConfigMutation.error,

    // Actions
    fetchTaxConfigs,
    createTaxConfig: handleCreateTaxConfig,
    updateTaxConfig: handleUpdateTaxConfig,
    deleteTaxConfig: handleDeleteTaxConfig,
    searchTaxConfigs: handleSearch,
    changePage: handlePageChange,
    changePerPage: handlePerPageChange,
    changeDateRange: handleDateRangeChange,
    clearFilters,

    // Original queries/mutations (for advanced use cases)
    taxConfigsQuery,
    currentTaxQuery,
    createTaxConfigMutation,
    updateTaxConfigMutation,
    deleteTaxConfigMutation,
  };
};
