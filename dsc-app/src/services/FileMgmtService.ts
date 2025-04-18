import { ApiResponse } from "@/types/api";
import { SaleQueryFilters } from "@/types/sale";
import Cookies from "js-cookie";

export interface ImportResult {
  total_records: number;
  success_count: number;
  error_count: number;
  errors: string[];
  has_more_errors: boolean;
}

export interface ImportResponse extends ApiResponse {
  message: string;
  success: boolean;
  details: ImportResult;
}

const salePrefix = "/manage/sales";

/**
 * Download a file from a URL with proper authorization
 */
export const downloadFileFromUrl = async (
  url: string,
  filename?: string,
): Promise<boolean> => {
  try {
    const csrfToken = Cookies.get("csrf_access_token");

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "X-CSRF-TOKEN": csrfToken || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    // Create a blob from the response
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    // Get filename from Content-Disposition header if not provided
    if (!filename) {
      const contentDisposition = response.headers.get("Content-Disposition");
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Fallback filename
      if (!filename) {
        filename = "download";
      }
    }

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    }, 100);

    return true;
  } catch (error) {
    console.error("Download error:", error);
    return false;
  }
};

/**
 * Download the sample import file for sales
 */
export const getSampleImportFile = async (): Promise<boolean> => {
  const baseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;
  const url = `${baseUrl}${salePrefix}/import/sample`;
  return downloadFileFromUrl(url, "sales_import_sample.xlsx");
};

/**
 * Export sales data to file
 */
export const exportSales = async (
  format: "xlsx" | "csv" = "xlsx",
  filters?: SaleQueryFilters,
): Promise<boolean> => {
  const queryParams = new URLSearchParams();
  queryParams.append("format", format);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
  }

  const baseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;
  const url = `${baseUrl}${salePrefix}/export?${queryParams.toString()}`;
  return downloadFileFromUrl(url, `sales_export.${format}`);
};

/**
 * Import sales data from file
 */
export const importSales = async (file: File): Promise<ImportResponse> => {
  const baseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;
  const url = `${baseUrl}${salePrefix}/import`;
  const csrfToken = Cookies.get("csrf_access_token");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-CSRF-TOKEN": csrfToken || "",
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw {
      response: {
        data: errorData,
        status: response.status,
      },
    };
  }

  return await response.json();
};
