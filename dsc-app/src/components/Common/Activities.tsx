import React from "react";
import { useRecentActivities } from "@/services/ActivityService";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "primereact/skeleton";
import { Activity } from "@/types/activity";
import { Button } from "primereact/button";

interface RecentActivitiesProps {
  limit?: number;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "sale_created":
      return "pi pi-plus";
    case "sale_updated":
      return "pi pi-pencil";
    case "sale_deleted":
      return "pi pi-trash";
    case "sales_bulk_deleted":
      return "pi pi-trash";
    case "sales_bulk_imported":
      return "pi pi-upload";
    case "report_generated":
      return "pi pi-chart-line";
    case "data_imported":
      return "pi pi-upload";
    case "user_login":
      return "pi pi-sign-in";
    case "user_updated":
      return "pi pi-user-edit";
    default:
      return "pi pi-bell";
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "sale_created":
    case "sales_bulk_imported":
    case "data_imported":
      return "blue";
    case "report_generated":
      return "green";
    case "sale_updated":
    case "user_updated":
      return "orange";
    case "sale_deleted":
    case "sales_bulk_deleted":
      return "red";
    case "user_login":
      return "purple";
    default:
      return "gray";
  }
};

const getActivityTitle = (activity: Activity) => {
  // Format the metadata if available
  const meta = activity.meta_data || {};

  switch (activity.type) {
    case "sales_bulk_imported":
      return `${activity.message} (${meta.imported_count || 0} of ${meta.total_records || 0})`;
    case "sales_bulk_deleted":
      return `${activity.message} (${meta.success_count || 0} of ${meta.attempted_count || 0})`;
    default:
      return activity.message;
  }
};

const RecentActivities: React.FC<RecentActivitiesProps> = ({ limit = 20 }) => {
  const {
    data: activities,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useRecentActivities(limit);

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="py-4 text-center text-red-500">
        <i className="pi pi-exclamation-triangle mr-2"></i>
        Failed to load recent activities
        <Button
          icon="pi pi-refresh"
          className="p-button-sm p-button-text ml-2"
          onClick={handleRefresh}
          tooltip="Retry"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-medium">Recent Activities</h3>
        <Button
          icon="pi pi-refresh"
          className="p-button-text p-button-rounded p-button-sm"
          onClick={handleRefresh}
          loading={isFetching}
        />
      </div>
      <div className="max-h-[360px] overflow-y-auto pr-1">
        <div className="space-y-3">
          {isLoading ? (
            Array(5)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className="flex items-center rounded-md border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="mr-3 flex h-9 w-9 items-center justify-center">
                    <Skeleton shape="circle" width="2.25rem" height="2.25rem" />
                  </div>
                  <div className="flex-1">
                    <Skeleton width="85%" height="1.2rem" className="mb-2" />
                    <Skeleton width="40%" height="0.8rem" />
                  </div>
                </div>
              ))
          ) : activities && activities.length > 0 ? (
            activities.map((activity) => {
              const color = getActivityColor(activity.type);
              const icon = getActivityIcon(activity.type);
              const title = getActivityTitle(activity);

              return (
                <div
                  key={activity.id}
                  className="flex items-center rounded-md border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <div
                    className={`mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-${color}-100 text-${color}-500 dark:bg-${color}-900/30 dark:text-${color}-300`}
                  >
                    <i className={icon}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{title}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                      {activity.user && (
                        <span className="ml-1 flex items-center">
                          <span className="mx-1">•</span>
                          <span>
                            {activity.user.username || activity.user.name}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-gray-500 dark:text-gray-400">
              <i className="pi pi-inbox mb-2 block text-2xl"></i>
              <p>No recent activities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivities;
