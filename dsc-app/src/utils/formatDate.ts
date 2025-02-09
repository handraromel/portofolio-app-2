import moment from "moment";

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
    format = "DD MMM YYYY HH:mm",
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
  SHORT_DATETIME: "DD/MM/YYYY HH:mm",
  LONG_DATETIME: "DD MMMM YYYY HH:mm",
  TIME: "HH:mm",
  ISO: "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]",
} as const;
