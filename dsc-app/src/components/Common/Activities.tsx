import React from "react";
import { useRecentActivities } from "@/services/ActivityService";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "primereact/skeleton";

interface RecentActivitiesProps {
  limit?: number;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "sale_created":
      return "pi pi-plus";
    case "sale_updated":
      return "pi pi-pencil";
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
    case "data_imported":
      return "blue";
    case "report_generated":
      return "green";
    case "sale_updated":
    case "user_updated":
      return "orange";
    case "user_login":
      return "purple";
    default:
      return "gray";
  }
};

const RecentActivities: React.FC<RecentActivitiesProps> = ({ limit = 5 }) => {
  const { data: activities, isLoading, error } = useRecentActivities(limit);

  if (error) {
    return (
      <div className="py-4 text-center text-red-500">
        <i className="pi pi-exclamation-triangle mr-2"></i>
        Failed to load recent activities
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        Array(limit)
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

          return (
            <div
              key={activity.id}
              className="flex items-center rounded-md border border-gray-200 p-3 dark:border-gray-700"
            >
              <div
                className={`mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-${color}-100 text-${color}-500 dark:bg-${color}-900/30 dark:text-${color}-300`}
              >
                <i className={icon}></i>
              </div>
              <div>
                <p className="text-sm font-medium">{activity.message}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                  {activity.user && (
                    <span className="ml-1">by {activity.user.name}</span>
                  )}
                </p>
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
  );
};

export default RecentActivities;
