import { ApiResponse } from "@/types/api";
import { SaleQueryFilters } from "@/types/sale";
import Cookies from "js-cookie";

export interface ImportResult {
  total_records: number;
  success_count: number;
  error_count: number;
  errors: string[];
  has_more_errors: boolean;
  import_id?: string;
}

export interface ImportResponse extends ApiResponse {
  message: string;
  success: boolean;
  details: ImportResult;
}

export interface ImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  record_statuses: {
    [key: string]: {
      status: "pending" | "success" | "failed";
      error: string | null;
      timestamp: string;
    };
  };
}

export interface IncrementalImportResponse extends ApiResponse {
  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "partially_completed"
    | "failed";
  progress: ImportProgress;
  current_record?: number;
  record_status?: "success" | "failed";
  error?: string;
}

const salePrefix = "/manage/sales";
const productPrefix = "/manage/product";
const baseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;

/**
 * Download a file from a URL with proper authorization
 */
export const downloadFileFromUrl = async (
  url: string,
  defaultFilename?: string,
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

    // Extract filename from Content-Disposition header
    let filename = defaultFilename;
    const contentDisposition = response.headers.get("Content-Disposition");

    if (contentDisposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(contentDisposition);

      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, "");

        try {
          filename = decodeURIComponent(filename);
        } catch (e) {
          console.warn("Could not decode filename", e);
        }
      }
    }

    if (!filename) {
      filename = defaultFilename || "download";
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
  const url = `${baseUrl}${salePrefix}/import/sample`;
  return downloadFileFromUrl(url, "sales_import_sample.xlsx");
};

/**
 * Download the sample import file for brands
 */
export const getSampleBrandImportFile = async (): Promise<boolean> => {
  const url = `${baseUrl}${productPrefix}/brands/import/sample`;
  return downloadFileFromUrl(url, "brand_import_sample.xlsx");
};

/**
 * Download the sample import file for groups
 */
export const getSampleGroupImportFile = async (): Promise<boolean> => {
  const url = `${baseUrl}${productPrefix}/groups/import/sample`;
  return downloadFileFromUrl(url, "group_import_sample.xlsx");
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

  const url = `${baseUrl}${salePrefix}/export?${queryParams.toString()}`;
  return downloadFileFromUrl(url, `sales_export.${format}`);
};

/**
 * Import sales data from file
 */
export const importSales = async (file: File): Promise<ImportResponse> => {
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

/**
 * Import brand data from file
 */
export const importBrands = async (file: File): Promise<ImportResponse> => {
  const url = `${baseUrl}${productPrefix}/brands/import/validate`;
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

/**
 * Import group data from file
 */
export const importGroups = async (file: File): Promise<ImportResponse> => {
  const url = `${baseUrl}${productPrefix}/groups/import/validate`;
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

/**
 * Confirm a pending import
 */
export const confirmImportSales = async (
  importId: string,
): Promise<ApiResponse> => {
  const url = `${baseUrl}${salePrefix}/import/confirm`;
  const csrfToken = Cookies.get("csrf_access_token");

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken || "",
    },
    body: JSON.stringify({ import_id: importId }),
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

/**
 * Confirm a pending brand import
 */
export const confirmImportBrands = async (
  importId: string,
): Promise<ApiResponse> => {
  const url = `${baseUrl}${productPrefix}/brands/import/confirm`;
  const csrfToken = Cookies.get("csrf_access_token");

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken || "",
    },
    body: JSON.stringify({ import_id: importId }),
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

/**
 * Confirm a pending group import
 */
export const confirmImportGroups = async (
  importId: string,
): Promise<ApiResponse> => {
  const url = `${baseUrl}${productPrefix}/groups/import/confirm`;
  const csrfToken = Cookies.get("csrf_access_token");

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken || "",
    },
    body: JSON.stringify({ import_id: importId }),
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

/**
 * Cancel a pending import
 */
export const cancelImportSales = async (
  importId: string,
): Promise<ApiResponse> => {
  const url = `${baseUrl}${salePrefix}/import/cancel`;
  const csrfToken = Cookies.get("csrf_access_token");

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken || "",
    },
    body: JSON.stringify({ import_id: importId }),
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

/**
 * Cancel a pending brand import
 */
export const cancelImportBrands = async (
  importId: string,
): Promise<ApiResponse> => {
  const url = `${baseUrl}${productPrefix}/brands/import/cancel`;
  const csrfToken = Cookies.get("csrf_access_token");

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken || "",
    },
    body: JSON.stringify({ import_id: importId }),
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

/**
 * Cancel a pending group import
 */
export const cancelImportGroups = async (
  importId: string,
): Promise<ApiResponse> => {
  const url = `${baseUrl}${productPrefix}/groups/import/cancel`;
  const csrfToken = Cookies.get("csrf_access_token");

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken || "",
    },
    body: JSON.stringify({ import_id: importId }),
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

/**
 * Check the status of a pending import
 */
export const checkImportStatus = async (
  importId: string,
): Promise<IncrementalImportResponse> => {
  const url = `${baseUrl}${salePrefix}/import/status?import_id=${importId}`;
  const csrfToken = Cookies.get("csrf_access_token");

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-CSRF-TOKEN": csrfToken || "",
    },
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
