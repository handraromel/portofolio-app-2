import moment from "moment";
import { format, parseISO, isValid } from "date-fns";
import { dateFormats } from "../constants/dateFormats";

type DateInput = string | number | Date | moment.Moment | null | undefined;

interface FormatOptions {
  format?: string;
  fromNow?: boolean;
  defaultValue?: string;
  strictParsing?: boolean;
}

/**
 * Formats a date of any format into the desired output format
 * Handles multiple input formats including:
 * - ISO strings: '2023-04-06T10:30:00Z'
 * - Date objects: new Date()
 * - Timestamp numbers: 1680780600000
 * - Date strings: '2023-04-06', '04/06/2023', etc.
 * - moment objects
 *
 * @param date - The date to format (various formats accepted)
 * @param options - Formatting options
 * @returns Formatted date string or defaultValue if invalid
 */

export const formatDate = (
  date: DateInput,
  options: FormatOptions = {},
): string => {
  const {
    format = dateFormats.CALENDAR_DATE_TIME,
    fromNow = false,
    defaultValue = "-",
    strictParsing = false,
  } = options;

  if (date === null || date === undefined || date === "") {
    return defaultValue;
  }

  if (typeof date === "number") {
    if (date > 0 && date < 4102444800000) {
      const momentDate = moment(date);
      return fromNow ? momentDate.fromNow() : momentDate.format(format);
    }
    return defaultValue;
  }

  let momentDate: moment.Moment;

  if (moment.isMoment(date)) {
    momentDate = date;
  } else {
    momentDate = moment(date, undefined, strictParsing);
  }

  if (!momentDate.isValid()) {
    if (!strictParsing) {
      const commonFormats = [
        "YYYY-MM-DD",
        "MM/DD/YYYY",
        "DD/MM/YYYY",
        "YYYY/MM/DD",
        "DD-MM-YYYY",
        "MM-DD-YYYY",
        "YYYY.MM.DD",
        "DD.MM.YYYY",
        "MM.DD.YYYY",
      ];

      for (const fmt of commonFormats) {
        const parsed = moment(date as string, fmt, true);
        if (parsed.isValid()) {
          momentDate = parsed;
          break;
        }
      }
    }

    if (!momentDate.isValid()) {
      console.warn(`Invalid date format encountered: ${date}`);
      return defaultValue;
    }
  }

  if (fromNow) {
    return momentDate.fromNow();
  }

  return momentDate.format(format);
};

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
