import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./ApiService";
import {
  Sale,
  SalesResponse,
  SaleDetailResponse,
  SaleSubmission,
  SaleQueryFilters,
  DailySalesSummary,
  MtdSalesSummary,
} from "@/types/sale";

export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (filters: SaleQueryFilters) =>
    [...saleKeys.lists(), { filters }] as const,
  details: () => [...saleKeys.all, "detail"] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
  reports: () => [...saleKeys.all, "reports"] as const,
  dailySales: (params: object) =>
    [...saleKeys.reports(), "daily", { params }] as const,
  mtdSales: (params: object) =>
    [...saleKeys.reports(), "mtd", { params }] as const,
} as const;

const salePrefix = "/manage/sales";

export const useSales = (
  filters: SaleQueryFilters = {},
  isActive: boolean = true,
) => {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.per_page)
    queryParams.append("per_page", filters.per_page.toString());
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.start_date) queryParams.append("start_date", filters.start_date);
  if (filters.end_date) queryParams.append("end_date", filters.end_date);
  if (filters.brand_id) queryParams.append("brand_id", filters.brand_id);
  if (filters.group_id) queryParams.append("group_id", filters.group_id);
  if (filters.division_id)
    queryParams.append("division_id", filters.division_id);
  if (filters.category_id)
    queryParams.append("category_id", filters.category_id);

  const queryString = queryParams.toString();
  const endpoint = `${salePrefix}${queryString ? `?${queryString}` : ""}`;

  return useQuery<SalesResponse, Error>({
    queryKey: saleKeys.list(filters),
    queryFn: async (): Promise<SalesResponse> => {
      const response = await apiClient<SalesResponse>(endpoint);
      return response as SalesResponse;
    },
    enabled: isActive,
  });
};

export const useSale = (saleId: string) => {
  return useQuery<Sale, Error>({
    queryKey: saleKeys.detail(saleId),
    queryFn: async (): Promise<Sale> => {
      const response = await apiClient<SaleDetailResponse>(
        `${salePrefix}/${saleId}`,
      );
      return response.sale as Sale;
    },
    enabled: !!saleId,
  });
};

export const useDailySales = (
  date?: string,
  year?: number,
  month?: number,
  day?: number,
  brand_id?: string,
  group_id?: string,
  division_id?: string,
  category_id?: string,
  isActive: boolean = true,
) => {
  const queryParams = new URLSearchParams();

  if (date) queryParams.append("date", date);
  if (year) queryParams.append("year", year.toString());
  if (month) queryParams.append("month", month.toString());
  if (day) queryParams.append("day", day.toString());
  if (brand_id) queryParams.append("brand_id", brand_id);
  if (group_id) queryParams.append("group_id", group_id);
  if (division_id) queryParams.append("division_id", division_id);
  if (category_id) queryParams.append("category_id", category_id);

  const queryString = queryParams.toString();
  const endpoint = `${salePrefix}/daily${queryString ? `?${queryString}` : ""}`;

  const params = {
    date,
    year,
    month,
    day,
    brand_id,
    group_id,
    division_id,
    category_id,
  };

  return useQuery<DailySalesSummary | null, Error>({
    queryKey: saleKeys.dailySales(params),
    queryFn: async (): Promise<DailySalesSummary | null> => {
      try {
        const response = await apiClient<{ data?: DailySalesSummary }>(
          endpoint,
        );
        return response.data || null;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        return null;
      }
    },
    enabled: isActive && !!(date || (year && month && day)),
  });
};

export const useMtdSales = (
  date?: string,
  year?: number,
  month?: number,
  brand_id?: string,
  group_id?: string,
  division_id?: string,
  category_id?: string,
  isActive: boolean = true,
) => {
  const queryParams = new URLSearchParams();

  if (date) queryParams.append("date", date);
  if (year) queryParams.append("year", year.toString());
  if (month) queryParams.append("month", month.toString());
  if (brand_id) queryParams.append("brand_id", brand_id);
  if (group_id) queryParams.append("group_id", group_id);
  if (division_id) queryParams.append("division_id", division_id);
  if (category_id) queryParams.append("category_id", category_id);

  const queryString = queryParams.toString();
  const endpoint = `${salePrefix}/mtd${queryString ? `?${queryString}` : ""}`;

  const params = {
    date,
    year,
    month,
    brand_id,
    group_id,
    division_id,
    category_id,
  };

  return useQuery<MtdSalesSummary | null, Error>({
    queryKey: saleKeys.mtdSales(params),
    queryFn: async (): Promise<MtdSalesSummary | null> => {
      try {
        const response = await apiClient<{ data?: MtdSalesSummary }>(endpoint);
        return response.data || null;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        return null;
      }
    },
    enabled: isActive && !!(date || (year && month)),
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaleSubmission) =>
      apiClient(`${salePrefix}/create`, { data, method: "POST" }),
    onSuccess: () => {
      // Invalidate and refetch sales list
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: saleKeys.reports() });
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      saleId,
      data,
    }: {
      saleId: string;
      data: Partial<SaleSubmission>;
    }) => apiClient(`${salePrefix}/${saleId}`, { data, method: "PUT" }),
    onSuccess: (_, { saleId }) => {
      queryClient.invalidateQueries({
        queryKey: saleKeys.detail(saleId),
      });
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: saleKeys.reports() });
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (saleId: string) =>
      apiClient(`${salePrefix}/${saleId}`, { method: "DELETE" }),
    onSuccess: (_, saleId) => {
      queryClient.removeQueries({ queryKey: saleKeys.detail(saleId) });
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: saleKeys.reports() });
    },
  });
};
