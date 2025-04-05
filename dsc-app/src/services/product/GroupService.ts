import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../ApiService";
import {
  ProductGroup,
  ProductGroupResponse,
  ProductGroupSubmission,
  ProductQueryFilters,
} from "@/types/product";

export const productGroupKeys = {
  all: ["productGroups"] as const,
  lists: () => [...productGroupKeys.all, "list"] as const,
  list: (filters: ProductQueryFilters) =>
    [...productGroupKeys.lists(), { filters }] as const,
  details: () => [...productGroupKeys.all, "detail"] as const,
  detail: (id: string) => [...productGroupKeys.details(), id] as const,
} as const;

const productPrefix = "/manage/product";

export const useProductGroups = (filters: ProductQueryFilters = {}) => {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.per_page)
    queryParams.append("per_page", filters.per_page.toString());
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.start_date) queryParams.append("start_date", filters.start_date);
  if (filters.end_date) queryParams.append("end_date", filters.end_date);

  const queryString = queryParams.toString();
  const endpoint = `${productPrefix}/groups${queryString ? `?${queryString}` : ""}`;

  return useQuery<ProductGroupResponse, Error>({
    queryKey: productGroupKeys.list(filters),
    queryFn: async (): Promise<ProductGroupResponse> => {
      const response = await apiClient<ProductGroupResponse>(endpoint);
      return response as ProductGroupResponse;
    },
  });
};

export const useProductGroup = (groupId: string) => {
  return useQuery<ProductGroup, Error>({
    queryKey: productGroupKeys.detail(groupId),
    queryFn: async (): Promise<ProductGroup> => {
      const response = await apiClient<ProductGroup>(
        `${productPrefix}/groups/${groupId}`,
      );
      return response as unknown as ProductGroup;
    },
    enabled: !!groupId,
  });
};

export const useCreateProductGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductGroupSubmission) =>
      apiClient(`${productPrefix}/groups`, { data, method: "POST" }),
    onSuccess: () => {
      // Invalidate and refetch groups list
      queryClient.invalidateQueries({ queryKey: productGroupKeys.lists() });
    },
  });
};

export const useUpdateProductGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: Partial<ProductGroupSubmission>;
    }) =>
      apiClient(`${productPrefix}/groups/${groupId}`, { data, method: "PUT" }),
    onSuccess: (_, { groupId }) => {
      // Invalidate specific group and list
      queryClient.invalidateQueries({
        queryKey: productGroupKeys.detail(groupId),
      });
      queryClient.invalidateQueries({ queryKey: productGroupKeys.lists() });
    },
  });
};

export const useDeleteProductGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) =>
      apiClient(`${productPrefix}/groups/${groupId}`, { method: "DELETE" }),
    onSuccess: (_, groupId) => {
      // Remove group from cache and invalidate lists
      queryClient.removeQueries({ queryKey: productGroupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: productGroupKeys.lists() });
    },
  });
};
