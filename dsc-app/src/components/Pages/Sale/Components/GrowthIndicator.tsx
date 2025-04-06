import React from "react";

interface GrowthIndicatorProps {
  growthValue: number | null;
  isPercentage?: boolean;
  showZero?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  colorOnly?: boolean;
  defaultValue?: string;
}

const GrowthIndicator: React.FC<GrowthIndicatorProps> = ({
  growthValue,
  isPercentage = false,
  showZero = false,
  className = "",
  size = "md",
  colorOnly = false,
  defaultValue = "-",
}) => {
  if (growthValue === null) {
    return <span className={`text-gray-400 ${className}`}>{defaultValue}</span>;
  }

  if (growthValue === 0 && !showZero) return null;

  const isPositive = growthValue > 0;
  const isNeutral = growthValue === 0;

  // Size classes
  const sizeClass = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  let formattedValue = "";
  if (isPercentage) {
    formattedValue = `${Math.abs(growthValue).toFixed(1)}%`;
  } else {
    formattedValue = new Intl.NumberFormat("en-US").format(
      Math.abs(growthValue),
    );
  }

  if (isPositive) formattedValue = "+" + formattedValue;
  else if (!isNeutral) formattedValue = "-" + formattedValue;

  const colorClass = isPositive
    ? "text-green-600"
    : isNeutral
      ? "text-gray-500"
      : "text-red-600";

  if (colorOnly) {
    return (
      <span className={`${colorClass} ${className}`}>{formattedValue}</span>
    );
  }

  return (
    <div
      className={`flex items-center ${sizeClass} ${colorClass} ${className}`}
    >
      {!isNeutral && (
        <span className="mr-1">
          {isPositive ? (
            <i className="pi pi-arrow-up" />
          ) : (
            <i className="pi pi-arrow-down" />
          )}
        </span>
      )}
      <span>{formattedValue}</span>
    </div>
  );
};

export default GrowthIndicator;
