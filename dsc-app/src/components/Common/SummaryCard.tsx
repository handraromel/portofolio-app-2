import React from "react";
import GrowthIndicator from "@/components/Pages/Sale/Components/GrowthIndicator";

interface SummaryCardProps {
  title: string;
  value: string | number;
  growth?: number | null;
  icon: string;
  color: string;
  isLoading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  growth,
  icon,
  color,
  isLoading = false,
}) => {
  const iconColorClass = `text-${color}-500 dark:text-${color}-400`;

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex h-12 w-12 justify-center rounded-lg`}>
            <i
              className={`${icon} ${iconColorClass}`}
              style={{ fontSize: "24px" }}
            ></i>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </h3>
            <div className="mt-1 flex items-baseline">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                <div className="flex flex-col">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {value}
                  </p>
                  {growth !== undefined && growth !== null && (
                    <div className="mt-2">
                      <GrowthIndicator
                        growthValue={growth}
                        isPercentage={true}
                        showZero={true}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
