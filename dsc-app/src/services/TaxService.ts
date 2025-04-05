import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./ApiService";
import {
  TaxConfiguration,
  TaxConfigurationResponse,
  TaxConfigurationSubmission,
  TaxQueryFilters,
  CurrentTaxResponse,
} from "@/types/tax";

export const taxConfigKeys = {
  all: ["taxConfigurations"] as const,
  lists: () => [...taxConfigKeys.all, "list"] as const,
  list: (filters: TaxQueryFilters) =>
    [...taxConfigKeys.lists(), { filters }] as const,
  details: () => [...taxConfigKeys.all, "detail"] as const,
  detail: (id: string) => [...taxConfigKeys.details(), id] as const,
  current: () => [...taxConfigKeys.all, "current"] as const,
} as const;

const taxPrefix = "/manage/tax";

export const useTaxConfigurations = (filters: TaxQueryFilters = {}) => {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.per_page)
    queryParams.append("per_page", filters.per_page.toString());
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.start_date) queryParams.append("start_date", filters.start_date);
  if (filters.end_date) queryParams.append("end_date", filters.end_date);

  const queryString = queryParams.toString();
  const endpoint = `${taxPrefix}${queryString ? `?${queryString}` : ""}`;

  return useQuery<TaxConfigurationResponse, Error>({
    queryKey: taxConfigKeys.list(filters),
    queryFn: async (): Promise<TaxConfigurationResponse> => {
      const response = await apiClient<TaxConfigurationResponse>(endpoint);
      return response as TaxConfigurationResponse;
    },
  });
};

export const useTaxConfiguration = (configId: string) => {
  return useQuery<TaxConfiguration, Error>({
    queryKey: taxConfigKeys.detail(configId),
    queryFn: async (): Promise<TaxConfiguration> => {
      const response = await apiClient<TaxConfiguration>(
        `${taxPrefix}/${configId}`,
      );
      return response as unknown as TaxConfiguration;
    },
    enabled: !!configId,
  });
};

export const useCurrentTax = () => {
  return useQuery<CurrentTaxResponse, Error>({
    queryKey: taxConfigKeys.current(),
    queryFn: async (): Promise<CurrentTaxResponse> => {
      const response = await apiClient<CurrentTaxResponse>(
        `${taxPrefix}/current`,
      );
      return response as CurrentTaxResponse;
    },
  });
};

export const useCreateTaxConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaxConfigurationSubmission) =>
      apiClient(`${taxPrefix}/create`, { data, method: "POST" }),
    onSuccess: () => {
      // Invalidate and refetch tax configurations list
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.current() });
    },
  });
};

export const useUpdateTaxConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      configId,
      data,
    }: {
      configId: string;
      data: Partial<TaxConfigurationSubmission>;
    }) => apiClient(`${taxPrefix}/${configId}`, { data, method: "PUT" }),
    onSuccess: (_, { configId }) => {
      // Invalidate specific tax configuration and list
      queryClient.invalidateQueries({
        queryKey: taxConfigKeys.detail(configId),
      });
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.current() });
    },
  });
};

export const useDeleteTaxConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configId: string) =>
      apiClient(`${taxPrefix}/${configId}`, { method: "DELETE" }),
    onSuccess: (_, configId) => {
      // Remove tax configuration from cache and invalidate lists
      queryClient.removeQueries({ queryKey: taxConfigKeys.detail(configId) });
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.current() });
    },
  });
};
