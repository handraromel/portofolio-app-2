import React from "react";
import { formatNumberToIDR } from "@/utils/formatCurrency";

interface GrowthIndicatorProps {
  growthValue: number | null;
  isPercentage?: boolean;
  colorOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  defaultValue?: string | null;
}

const GrowthIndicator: React.FC<GrowthIndicatorProps> = ({
  growthValue,
  isPercentage = false,
  colorOnly = false,
  size = "md",
  className = "",
  defaultValue = "-",
}) => {
  // Function to determine the appropriate color based on the growth value
  const getColorClass = (value: number | null): string => {
    if (value === null) return "text-gray-500";
    if (value > 0) return "text-green-500";
    if (value < 0) return "text-red-500";
    return "text-gray-500";
  };

  // Function to format growth values, handling large percentages better
  const formatGrowthValue = (value: number, isPercentage: boolean): string => {
    // For very large growth (over 1000%), use multiplier format
    if (isPercentage && value > 1000) {
      const multiplier = (value + 100) / 100;
      return `${multiplier.toFixed(1)}x`;
    }

    // Normal percentage formatting
    return isPercentage
      ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
      : formatNumberToIDR(value);
  };

  // Function to determine font size based on the size prop
  const getSizeClass = (): string => {
    switch (size) {
      case "xs":
        return "text-xs";
      case "sm":
        return "text-sm";
      case "lg":
        return "text-lg";
      case "md":
      default:
        return "text-base";
    }
  };

  // If we only want to show the color, return an icon
  if (colorOnly && growthValue !== null) {
    const iconClass =
      growthValue > 0
        ? "pi-arrow-up"
        : growthValue < 0
          ? "pi-arrow-down"
          : "pi-minus";
    return (
      <i
        className={`pi ${iconClass} ${getColorClass(
          growthValue,
        )} ${getSizeClass()} ${className}`}
      ></i>
    );
  }

  // Otherwise, return the formatted value with color
  return (
    <span
      className={`${getColorClass(growthValue)} ${getSizeClass()} ${className}`}
    >
      {growthValue !== null && growthValue !== undefined
        ? formatGrowthValue(growthValue, isPercentage)
        : defaultValue}
    </span>
  );
};

export default GrowthIndicator;
