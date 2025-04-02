import moment from "moment";
import { format, parseISO, isValid } from "date-fns";

type DateInput = string | number | Date | moment.Moment;

interface FormatOptions {
  format?: string;
  fromNow?: boolean;
  defaultValue?: string;
}

export const formatDate = (
  date: DateInput,
  options: FormatOptions = {},
): string => {
  const {
    format = dateFormats.CALENDAR_DATE_TIME,
    fromNow = false,
    defaultValue = "-",
  } = options;

  if (!date) {
    return defaultValue;
  }

  const momentDate = moment(date);

  if (!momentDate.isValid()) {
    return defaultValue;
  }

  if (fromNow) {
    return momentDate.fromNow();
  }

  return momentDate.format(format);
};

// Common format presets
export const dateFormats = {
  SHORT_DATE: "DD/MM/YYYY",
  LONG_DATE: "DD MMMM YYYY",
  CALENDAR_DATE: "DD MMM YYYY",
  CALENDAR_DATE_TIME: "DD MMM YYYY HH:mm",
  SHORT_DATETIME: "DD/MM/YYYY HH:mm",
  LONG_DATETIME: "DD MMMM YYYY HH:mm",
  TIME: "HH:mm",
  ISO: "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]",
  API_DATE: "yyyy-MM-dd",
} as const;

/**
 * Formats a date from API (ISO format) to a specific date format
 * @param dateString - ISO date string from API
 * @param dateFormat - Target date format (defaults to yyyy-MM-dd)
 * @returns Formatted date string or null if invalid
 */
export const formatDateFromAPI = (
  dateString: string | null | undefined,
  dateFormat: string = dateFormats.API_DATE,
): string | null => {
  if (!dateString) return null;

  try {
    // Handle ISO date strings (with T separator)
    if (dateString.includes("T")) {
      return format(parseISO(dateString), dateFormat);
    }

    // Handle simple date strings (yyyy-MM-dd)
    const date = new Date(dateString);
    if (isValid(date)) {
      return format(date, dateFormat);
    }

    return null;
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return null;
  }
};

/**
 * Formats a date for API submission in yyyy-MM-dd format
 * @param dateValue - Date input (string, Date object, or null)
 * @returns Formatted date string or null if invalid
 */
export const formatDateForAPI = (
  dateValue: string | Date | null | undefined,
): string | null => {
  if (!dateValue) return null;

  try {
    const dateObj =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;

    if (isValid(dateObj)) {
      return format(dateObj, dateFormats.API_DATE);
    }

    return null;
  } catch (error) {
    console.error("Error formatting date for API:", dateValue, error);
    return null;
  }
};

/**
 * Returns today's date in yyyy-MM-dd format
 * @returns Today's date formatted as yyyy-MM-dd
 */
export const getTodayFormatted = (): string => {
  return format(new Date(), dateFormats.API_DATE);
};

/**
 * Extracts date portion from ISO date string
 * @param isoDate - ISO date string
 * @returns Date portion (yyyy-MM-dd) or null if invalid
 */
export const extractDateFromISO = (isoDate: string | null): string | null => {
  if (!isoDate) return null;
  return isoDate.split("T")[0];
};
