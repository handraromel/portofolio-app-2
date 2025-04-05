import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../ApiService";
import {
  ProductBrand,
  ProductBrandResponse,
  ProductBrandSubmission,
  ProductQueryFilters,
} from "@/types/product";

export const productBrandKeys = {
  all: ["productBrands"] as const,
  lists: () => [...productBrandKeys.all, "list"] as const,
  list: (filters: ProductQueryFilters) =>
    [...productBrandKeys.lists(), { filters }] as const,
  details: () => [...productBrandKeys.all, "detail"] as const,
  detail: (id: string) => [...productBrandKeys.details(), id] as const,
} as const;

const productPrefix = "/manage/product";

export const useProductBrands = (filters: ProductQueryFilters = {}) => {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.per_page)
    queryParams.append("per_page", filters.per_page.toString());
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.start_date) queryParams.append("start_date", filters.start_date);
  if (filters.end_date) queryParams.append("end_date", filters.end_date);

  const queryString = queryParams.toString();
  const endpoint = `${productPrefix}/brands${queryString ? `?${queryString}` : ""}`;

  return useQuery<ProductBrandResponse, Error>({
    queryKey: productBrandKeys.list(filters),
    queryFn: async (): Promise<ProductBrandResponse> => {
      const response = await apiClient<ProductBrandResponse>(endpoint);
      return response as ProductBrandResponse;
    },
  });
};

export const useProductBrand = (brandId: string) => {
  return useQuery<ProductBrand, Error>({
    queryKey: productBrandKeys.detail(brandId),
    queryFn: async (): Promise<ProductBrand> => {
      const response = await apiClient<ProductBrand>(
        `${productPrefix}/brands/${brandId}`,
      );
      return response as unknown as ProductBrand;
    },
    enabled: !!brandId,
  });
};

export const useCreateProductBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductBrandSubmission) =>
      apiClient(`${productPrefix}/brands`, { data, method: "POST" }),
    onSuccess: () => {
      // Invalidate and refetch brands list
      queryClient.invalidateQueries({ queryKey: productBrandKeys.lists() });
    },
  });
};

export const useUpdateProductBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      brandId,
      data,
    }: {
      brandId: string;
      data: Partial<ProductBrandSubmission>;
    }) =>
      apiClient(`${productPrefix}/brands/${brandId}`, { data, method: "PUT" }),
    onSuccess: (_, { brandId }) => {
      // Invalidate specific brand and list
      queryClient.invalidateQueries({
        queryKey: productBrandKeys.detail(brandId),
      });
      queryClient.invalidateQueries({ queryKey: productBrandKeys.lists() });
    },
  });
};

export const useDeleteProductBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandId: string) =>
      apiClient(`${productPrefix}/brands/${brandId}`, { method: "DELETE" }),
    onSuccess: (_, brandId) => {
      // Remove brand from cache and invalidate lists
      queryClient.removeQueries({ queryKey: productBrandKeys.detail(brandId) });
      queryClient.invalidateQueries({ queryKey: productBrandKeys.lists() });
    },
  });
};
