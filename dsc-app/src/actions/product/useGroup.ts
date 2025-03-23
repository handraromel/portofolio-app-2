import { useState } from "react";
import {
  useProductGroups,
  useCreateProductGroup,
  useUpdateProductGroup,
  useDeleteProductGroup,
} from "@/services/product/GroupService";
import { ProductGroupSubmission, ProductQueryFilters } from "@/types/product";

export const useGroup = () => {
  const [filters, setFilters] = useState<ProductQueryFilters>({
    page: 1,
    per_page: 10,
    search: "",
  });

  // Queries
  const groupsQuery = useProductGroups(filters);

  // Mutations
  const createGroupMutation = useCreateProductGroup();
  const updateGroupMutation = useUpdateProductGroup();
  const deleteGroupMutation = useDeleteProductGroup();

  const fetchGroups = async (newFilters?: Partial<ProductQueryFilters>) => {
    if (newFilters) {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }
    return await groupsQuery.refetch();
  };

  const handleCreateGroup = async (data: ProductGroupSubmission) => {
    const response = await createGroupMutation.mutateAsync(data);
    return response;
  };

  const handleUpdateGroup = async (
    groupId: string,
    data: Partial<ProductGroupSubmission>,
  ) => {
    const response = await updateGroupMutation.mutateAsync({ groupId, data });
    return response;
  };

  const handleDeleteGroup = async (groupId: string) => {
    return await deleteGroupMutation.mutateAsync(groupId);
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
    groups: groupsQuery.data?.groups || [],
    pagination: groupsQuery.data
      ? {
          currentPage: groupsQuery.data.current_page,
          totalPages: groupsQuery.data.pages,
          totalRecords: groupsQuery.data.total,
        }
      : { currentPage: 1, totalPages: 1, totalRecords: 0 },
    filters,

    // Status
    isLoading:
      groupsQuery.isLoading ||
      createGroupMutation.isPending ||
      updateGroupMutation.isPending ||
      deleteGroupMutation.isPending,
    error:
      groupsQuery.error ||
      createGroupMutation.error ||
      updateGroupMutation.error ||
      deleteGroupMutation.error,

    // Actions
    fetchGroups,
    createGroup: handleCreateGroup,
    updateGroup: handleUpdateGroup,
    deleteGroup: handleDeleteGroup,
    searchGroups: handleSearch,
    changePage: handlePageChange,
    changePerPage: handlePerPageChange,
    changeDateRange: handleDateRangeChange,
    clearFilters,

    // Original queries/mutations (for advanced use cases)
    groupsQuery,
    createGroupMutation,
    updateGroupMutation,
    deleteGroupMutation,
  };
};
