/**
 * Format a number to IDR currency format
 */
export const formatNumberToIDR = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a number to a compact format (e.g., 1.5M, 2.3B)
 */
export const formatNumberToCompact = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
};
