import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./ApiService";
import { Activity } from "@/types/activity";

export const activityKeys = {
  all: ["activities"] as const,
  lists: () => [...activityKeys.all, "list"] as const,
  recent: (limit?: number) => [...activityKeys.lists(), { limit }] as const,
};

export const useRecentActivities = (
  limit: number = 20,
  enabled: boolean = true,
) => {
  return useQuery<Activity[], Error>({
    queryKey: activityKeys.recent(limit),
    queryFn: async (): Promise<Activity[]> => {
      const response = await apiClient<{ activities: Activity[] }>(
        `/activities/recent?limit=${limit}`,
      );
      return Array.isArray(response.activities) ? response.activities : [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled,
  });
};
