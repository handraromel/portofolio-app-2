import { useState } from "react";
import {
  useProductCategories,
  useCreateProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
} from "@/services/product/CategoryService";
import {
  ProductCategorySubmission,
  ProductQueryFilters,
} from "@/types/product";

export const useCategory = () => {
  const [filters, setFilters] = useState<ProductQueryFilters>({
    page: 1,
    per_page: 10,
    search: "",
  });

  // Queries
  const categoriesQuery = useProductCategories(filters);

  // Mutations
  const createCategoryMutation = useCreateProductCategory();
  const updateCategoryMutation = useUpdateProductCategory();
  const deleteCategoryMutation = useDeleteProductCategory();

  const fetchCategories = async (newFilters?: Partial<ProductQueryFilters>) => {
    if (newFilters) {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }
    return await categoriesQuery.refetch();
  };

  const handleCreateCategory = async (data: ProductCategorySubmission) => {
    const response = await createCategoryMutation.mutateAsync(data);
    return response;
  };

  const handleUpdateCategory = async (
    categoryId: string,
    data: Partial<ProductCategorySubmission>,
  ) => {
    const response = await updateCategoryMutation.mutateAsync({
      categoryId,
      data,
    });
    return response;
  };

  const handleDeleteCategory = async (categoryId: string) => {
    return await deleteCategoryMutation.mutateAsync(categoryId);
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
    categories: categoriesQuery.data?.categories || [],
    pagination: categoriesQuery.data
      ? {
          currentPage: categoriesQuery.data.current_page,
          totalPages: categoriesQuery.data.pages,
          totalRecords: categoriesQuery.data.total,
        }
      : { currentPage: 1, totalPages: 1, totalRecords: 0 },
    filters,

    // Status
    isLoading:
      categoriesQuery.isLoading ||
      createCategoryMutation.isPending ||
      updateCategoryMutation.isPending ||
      deleteCategoryMutation.isPending,
    error:
      categoriesQuery.error ||
      createCategoryMutation.error ||
      updateCategoryMutation.error ||
      deleteCategoryMutation.error,

    // Actions
    fetchCategories,
    createCategory: handleCreateCategory,
    updateCategory: handleUpdateCategory,
    deleteCategory: handleDeleteCategory,
    searchCategories: handleSearch,
    changePage: handlePageChange,
    changePerPage: handlePerPageChange,
    changeDateRange: handleDateRangeChange,
    clearFilters,

    // Original queries/mutations (for advanced use cases)
    categoriesQuery,
    createCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
  };
};
