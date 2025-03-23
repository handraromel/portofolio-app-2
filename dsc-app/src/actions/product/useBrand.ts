import { useState } from "react";
import {
  useProductBrands,
  useCreateProductBrand,
  useUpdateProductBrand,
  useDeleteProductBrand,
} from "@/services/product/BrandService";
import { ProductBrandSubmission, ProductQueryFilters } from "@/types/product";

export const useBrand = () => {
  const [filters, setFilters] = useState<ProductQueryFilters>({
    page: 1,
    per_page: 10,
    search: "",
  });

  // Queries
  const brandsQuery = useProductBrands(filters);

  // Mutations
  const createBrandMutation = useCreateProductBrand();
  const updateBrandMutation = useUpdateProductBrand();
  const deleteBrandMutation = useDeleteProductBrand();

  const fetchBrands = async (newFilters?: Partial<ProductQueryFilters>) => {
    if (newFilters) {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }
    return await brandsQuery.refetch();
  };

  const handleCreateBrand = async (data: ProductBrandSubmission) => {
    const response = await createBrandMutation.mutateAsync(data);
    return response;
  };

  const handleUpdateBrand = async (
    brandId: string,
    data: Partial<ProductBrandSubmission>,
  ) => {
    const response = await updateBrandMutation.mutateAsync({ brandId, data });
    return response;
  };

  const handleDeleteBrand = async (brandId: string) => {
    return await deleteBrandMutation.mutateAsync(brandId);
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
    brands: brandsQuery.data?.brands || [],
    pagination: brandsQuery.data
      ? {
          currentPage: brandsQuery.data.current_page,
          totalPages: brandsQuery.data.pages,
          totalRecords: brandsQuery.data.total,
        }
      : { currentPage: 1, totalPages: 1, totalRecords: 0 },
    filters,

    // Status
    isLoading:
      brandsQuery.isLoading ||
      createBrandMutation.isPending ||
      updateBrandMutation.isPending ||
      deleteBrandMutation.isPending,
    error:
      brandsQuery.error ||
      createBrandMutation.error ||
      updateBrandMutation.error ||
      deleteBrandMutation.error,

    // Actions
    fetchBrands,
    createBrand: handleCreateBrand,
    updateBrand: handleUpdateBrand,
    deleteBrand: handleDeleteBrand,
    searchBrands: handleSearch,
    changePage: handlePageChange,
    changePerPage: handlePerPageChange,
    changeDateRange: handleDateRangeChange,
    clearFilters,

    // Original queries/mutations (for advanced use cases)
    brandsQuery,
    createBrandMutation,
    updateBrandMutation,
    deleteBrandMutation,
  };
};
