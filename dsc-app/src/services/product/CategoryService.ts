import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../ApiService";
import {
  ProductCategory,
  ProductCategoryResponse,
  ProductCategorySubmission,
  ProductQueryFilters,
} from "@/types/product";

export const productCategoryKeys = {
  all: ["productCategories"] as const,
  lists: () => [...productCategoryKeys.all, "list"] as const,
  list: (filters: ProductQueryFilters) =>
    [...productCategoryKeys.lists(), { filters }] as const,
  details: () => [...productCategoryKeys.all, "detail"] as const,
  detail: (id: string) => [...productCategoryKeys.details(), id] as const,
} as const;

const productPrefix = "/manage/product";

export const useProductCategories = (filters: ProductQueryFilters = {}) => {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.per_page)
    queryParams.append("per_page", filters.per_page.toString());
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.start_date) queryParams.append("start_date", filters.start_date);
  if (filters.end_date) queryParams.append("end_date", filters.end_date);

  const queryString = queryParams.toString();
  const endpoint = `${productPrefix}/categories${queryString ? `?${queryString}` : ""}`;

  return useQuery<ProductCategoryResponse, Error>({
    queryKey: productCategoryKeys.list(filters),
    queryFn: async (): Promise<ProductCategoryResponse> => {
      const response = await apiClient<ProductCategoryResponse>(endpoint);
      return response as ProductCategoryResponse;
    },
  });
};

export const useProductCategory = (categoryId: string) => {
  return useQuery<ProductCategory, Error>({
    queryKey: productCategoryKeys.detail(categoryId),
    queryFn: async (): Promise<ProductCategory> => {
      const response = await apiClient<ProductCategory>(
        `${productPrefix}/categories/${categoryId}`,
      );
      return response as unknown as ProductCategory;
    },
    enabled: !!categoryId,
  });
};

export const useCreateProductCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductCategorySubmission) =>
      apiClient(`${productPrefix}/categories`, { data, method: "POST" }),
    onSuccess: () => {
      // Invalidate and refetch categories list
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() });
    },
  });
};

export const useUpdateProductCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: Partial<ProductCategorySubmission>;
    }) =>
      apiClient(`${productPrefix}/categories/${categoryId}`, {
        data,
        method: "PUT",
      }),
    onSuccess: (_, { categoryId }) => {
      // Invalidate specific category and list
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.detail(categoryId),
      });
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() });
    },
  });
};

export const useDeleteProductCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      apiClient(`${productPrefix}/categories/${categoryId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, categoryId) => {
      // Remove category from cache and invalidate lists
      queryClient.removeQueries({
        queryKey: productCategoryKeys.detail(categoryId),
      });
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() });
    },
  });
};
