import { useState } from "react";
import {
  useProductDivisions,
  useCreateProductDivision,
  useUpdateProductDivision,
  useDeleteProductDivision,
} from "@/services/product/DivisionService";
import {
  ProductDivisionSubmission,
  ProductQueryFilters,
} from "@/types/product";

export const useDivision = () => {
  const [filters, setFilters] = useState<ProductQueryFilters>({
    page: 1,
    per_page: 10,
    search: "",
  });

  // Queries
  const divisionsQuery = useProductDivisions(filters);

  // Mutations
  const createDivisionMutation = useCreateProductDivision();
  const updateDivisionMutation = useUpdateProductDivision();
  const deleteDivisionMutation = useDeleteProductDivision();

  const fetchDivisions = async (newFilters?: Partial<ProductQueryFilters>) => {
    if (newFilters) {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }
    return await divisionsQuery.refetch();
  };

  const handleCreateDivision = async (data: ProductDivisionSubmission) => {
    const response = await createDivisionMutation.mutateAsync(data);
    return response;
  };

  const handleUpdateDivision = async (
    divisionId: string,
    data: Partial<ProductDivisionSubmission>,
  ) => {
    const response = await updateDivisionMutation.mutateAsync({
      divisionId,
      data,
    });
    return response;
  };

  const handleDeleteDivision = async (divisionId: string) => {
    return await deleteDivisionMutation.mutateAsync(divisionId);
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
    divisions: divisionsQuery.data?.divisions || [],
    pagination: divisionsQuery.data
      ? {
          currentPage: divisionsQuery.data.current_page,
          totalPages: divisionsQuery.data.pages,
          totalRecords: divisionsQuery.data.total,
        }
      : { currentPage: 1, totalPages: 1, totalRecords: 0 },
    filters,

    // Status
    isLoading:
      divisionsQuery.isLoading ||
      createDivisionMutation.isPending ||
      updateDivisionMutation.isPending ||
      deleteDivisionMutation.isPending,
    error:
      divisionsQuery.error ||
      createDivisionMutation.error ||
      updateDivisionMutation.error ||
      deleteDivisionMutation.error,

    // Actions
    fetchDivisions,
    createDivision: handleCreateDivision,
    updateDivision: handleUpdateDivision,
    deleteDivision: handleDeleteDivision,
    searchDivisions: handleSearch,
    changePage: handlePageChange,
    changePerPage: handlePerPageChange,
    changeDateRange: handleDateRangeChange,
    clearFilters,

    // Original queries/mutations (for advanced use cases)
    divisionsQuery,
    createDivisionMutation,
    updateDivisionMutation,
    deleteDivisionMutation,
  };
};
