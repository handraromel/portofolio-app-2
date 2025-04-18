import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SaleQueryFilters } from "@/types/sale";
import { useToast } from "@/context/Toast";
import { saleKeys } from "@/services/SaleService";
import {
  getSampleImportFile,
  exportSales,
  importSales,
  ImportResponse,
} from "@/services/FileMgmtService";
import { ApiError } from "@/types/api";

export const useFileMgmt = () => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [importError, setImportError] = useState<ApiError | null>(null);
  const { showSuccess, showError, showInfo } = useToast();
  const queryClient = useQueryClient();

  /**
   * Download sample import file
   */
  const handleDownloadSample = async (): Promise<boolean> => {
    setIsDownloading(true);
    try {
      showInfo("Downloading sample file...");
      const result = await getSampleImportFile();

      if (result) {
        showSuccess("Sample file downloaded successfully");
        return true;
      } else {
        showError("Failed to download sample file");
        return false;
      }
    } catch (error) {
      console.error("Error downloading sample:", error);
      showError("Failed to download sample file");
      return false;
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Export sales data to file
   */
  const handleExportSales = async (
    format: "xlsx" | "csv" = "xlsx",
    filters?: SaleQueryFilters,
  ): Promise<boolean> => {
    setIsExporting(true);
    try {
      showInfo(`Exporting sales data to ${format.toUpperCase()}...`);

      const result = await exportSales(format, filters);

      if (result) {
        showSuccess(
          `Sales data exported successfully to ${format.toUpperCase()}`,
        );
        return true;
      } else {
        showError(`Failed to export sales data to ${format.toUpperCase()}`);
        return false;
      }
    } catch (error) {
      console.error("Error exporting sales:", error);
      showError("Failed to export sales data");
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Import sales data from file
   */
  const handleImportSales = async (
    file: File,
  ): Promise<ImportResponse | null> => {
    setIsImporting(true);
    setImportError(null);

    try {
      showInfo("Importing sales data, please wait...");

      const result = await importSales(file);
      setImportResult(result);

      if (result.success) {
        showSuccess(result.message || "Sales data imported successfully");

        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
        queryClient.invalidateQueries({ queryKey: saleKeys.reports() });
        queryClient.invalidateQueries({ queryKey: saleKeys.dailySales({}) });
        queryClient.invalidateQueries({ queryKey: saleKeys.mtdSales({}) });

        return result;
      } else {
        showError(result.msg || "Failed to import sales data");
        return null;
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error importing sales:", error);
      const errorMessage =
        apiError?.response?.data?.msg || "Failed to import sales data";
      showError(errorMessage);
      setImportError(apiError);
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    // Methods
    downloadSample: handleDownloadSample,
    exportSales: handleExportSales,
    importSales: handleImportSales,

    // State
    isDownloading,
    isExporting,
    isImporting,
    importResult,
    importError,
  };
};
