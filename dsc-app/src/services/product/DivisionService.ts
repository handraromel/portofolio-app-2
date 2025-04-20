import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../ApiService";
import {
  ProductDivision,
  ProductDivisionResponse,
  ProductDivisionSubmission,
  ProductQueryFilters,
} from "@/types/product";

export const productDivisionKeys = {
  all: ["productDivisions"] as const,
  lists: () => [...productDivisionKeys.all, "list"] as const,
  list: (filters: ProductQueryFilters) =>
    [...productDivisionKeys.lists(), { filters }] as const,
  details: () => [...productDivisionKeys.all, "detail"] as const,
  detail: (id: string) => [...productDivisionKeys.details(), id] as const,
} as const;

const productPrefix = "/manage/product";

export const useProductDivisions = (filters: ProductQueryFilters = {}) => {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.per_page)
    queryParams.append("per_page", filters.per_page.toString());
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.start_date) queryParams.append("start_date", filters.start_date);
  if (filters.end_date) queryParams.append("end_date", filters.end_date);

  const queryString = queryParams.toString();
  const endpoint = `${productPrefix}/divisions${queryString ? `?${queryString}` : ""}`;

  return useQuery<ProductDivisionResponse, Error>({
    queryKey: productDivisionKeys.list(filters),
    queryFn: async (): Promise<ProductDivisionResponse> => {
      const response = await apiClient<ProductDivisionResponse>(endpoint);
      return response as ProductDivisionResponse;
    },
  });
};

export const useAllProductDivisions = () => {
  return useQuery<ProductDivisionResponse, Error>({
    queryKey: [...productDivisionKeys.all, "all"],
    queryFn: async (): Promise<ProductDivisionResponse> => {
      const response = await apiClient<ProductDivisionResponse>(
        `${productPrefix}/divisions?per_page=1000`,
      );
      return response as unknown as ProductDivisionResponse;
    },
  });
};

export const useProductDivision = (divisionId: string) => {
  return useQuery<ProductDivision, Error>({
    queryKey: productDivisionKeys.detail(divisionId),
    queryFn: async (): Promise<ProductDivision> => {
      const response = await apiClient<ProductDivision>(
        `${productPrefix}/divisions/${divisionId}`,
      );
      return response as unknown as ProductDivision;
    },
    enabled: !!divisionId,
  });
};

export const useCreateProductDivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductDivisionSubmission) =>
      apiClient(`${productPrefix}/divisions`, { data, method: "POST" }),
    onSuccess: () => {
      // Invalidate and refetch divisions list
      queryClient.invalidateQueries({ queryKey: productDivisionKeys.lists() });
    },
  });
};

export const useUpdateProductDivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      divisionId,
      data,
    }: {
      divisionId: string;
      data: Partial<ProductDivisionSubmission>;
    }) =>
      apiClient(`${productPrefix}/divisions/${divisionId}`, {
        data,
        method: "PUT",
      }),
    onSuccess: (_, { divisionId }) => {
      // Invalidate specific division and list
      queryClient.invalidateQueries({
        queryKey: productDivisionKeys.detail(divisionId),
      });
      queryClient.invalidateQueries({ queryKey: productDivisionKeys.lists() });
    },
  });
};

export const useDeleteProductDivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (divisionId: string) =>
      apiClient(`${productPrefix}/divisions/${divisionId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, divisionId) => {
      // Remove division from cache and invalidate lists
      queryClient.removeQueries({
        queryKey: productDivisionKeys.detail(divisionId),
      });
      queryClient.invalidateQueries({ queryKey: productDivisionKeys.lists() });
    },
  });
};
