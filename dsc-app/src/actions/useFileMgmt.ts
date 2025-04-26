import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SaleQueryFilters } from "@/types/sale";
import { useToast } from "@/context/Toast";
import { saleKeys } from "@/services/SaleService";
import {
  getSampleImportFile,
  exportSales,
  importSales,
  confirmImportSales,
  cancelImportSales,
  checkImportValidationStatus,
  ImportResponse,
  ValidationProgress,
} from "@/services/FileMgmtService";
import { ApiError } from "@/types/api";

export const useFileMgmt = () => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [importError, setImportError] = useState<ApiError | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [validationProgress, setValidationProgress] =
    useState<ValidationProgress | null>(null);
  const [validationStatus, setValidationStatus] = useState<string | null>(null);
  const { showSuccess, showError, showInfo, showWarning } = useToast();
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

  const checkValidationStatus = async (importId: string): Promise<void> => {
    if (!importId) return;

    try {
      const result = await checkImportValidationStatus(importId);

      // Update UI with validation status
      setValidationStatus(result.status);

      if (result.details?.progress) {
        setValidationProgress(result.details.progress);
      }

      // Handle based on status
      if (result.status === "pending") {
        // Validation completed successfully
        setIsImporting(false);

        // Set the import result from validation
        setImportResult({
          success: true,
          message: `Import validation completed: ${result.details.success_count} records valid, ${result.details.error_count} failed`,
          details: {
            import_id: importId,
            total_records: result.details.total_count || 0,
            success_count: result.details.success_count || 0,
            error_count: result.details.error_count || 0,
            errors: result.details.errors || [],
            has_more_errors: result.details.has_more_errors || false,
          },
        });

        // Import is ready to be confirmed
        setImportId(importId);
        showSuccess("Data validation completed successfully");
      } else if (result.status === "failed") {
        // Validation failed
        setIsImporting(false);

        showError(result.details.errors?.[0] || "Validation failed");
        setImportError({
          response: {
            data: { msg: result.details.errors?.[0] || "Validation failed" },
            status: 400,
          },
        });
      } else if (
        result.status === "uploading" ||
        result.status === "validating"
      ) {
        // Still in progress, re-check after a delay
        setTimeout(() => checkValidationStatus(importId), 2000);
      }
    } catch (error) {
      setIsImporting(false);

      console.error("Error checking validation status:", error);
      const apiError = error as ApiError;
      showError(
        apiError?.response?.data?.msg || "Failed to check validation status",
      );
      setImportError(apiError);
    }
  };

  /**
   * Import sales data from file (validation phase)
   */
  const handleImportSales = async (
    file: File,
  ): Promise<ImportResponse | null> => {
    setIsImporting(true);
    setImportError(null);
    setValidationProgress(null);
    setValidationStatus(null);

    try {
      showInfo("Uploading file for validation, please wait...");

      const result = await importSales(file);

      // Start validation checking
      if (result.details && result.details.import_id) {
        setValidationStatus("uploading"); // Set initial status

        // Start checking validation status (this will recursively check until complete)
        if (result.details.import_id) {
          setTimeout(
            () => checkValidationStatus(result.details.import_id as string),
            1000,
          );
        } else {
          showError("No import ID returned from server.");
          setIsImporting(false);
        }

        return null; // We'll return the final result via the validation checks
      } else {
        // Fallback to old behavior if no import_id is returned
        setImportResult(result);
        setImportId(result.details?.import_id || null);

        if (result.details?.error_count && result.details.error_count > 0) {
          if (
            result.details.success_count &&
            result.details.success_count > 0
          ) {
            showWarning(
              `Import validation completed with ${result.details.error_count} error${
                result.details.error_count > 1 ? "s" : ""
              }. ${result.details.success_count} records are ready to import.`,
            );
          } else {
            showError(
              `Import validation failed with ${result.details.error_count} error${
                result.details.error_count > 1 ? "s" : ""
              }. No records are valid for import.`,
            );
          }
        } else {
          showSuccess("Data validation successful. Ready to apply changes.");
        }

        setIsImporting(false);
        return result;
      }
    } catch (error) {
      setIsImporting(false);

      const apiError = error as ApiError;
      console.error("Error validating import data:", error);
      const errorMessage =
        apiError?.response?.data?.msg || "Failed to validate import data";
      showError(errorMessage);
      setImportError(apiError);
      return null;
    }
  };

  const handleConfirmImport = async (): Promise<boolean> => {
    if (!importId) {
      showError("No valid import ID found");
      return false;
    }

    setIsConfirming(true);
    try {
      showInfo("Applying changes to database, please wait...");

      const result = await confirmImportSales(importId);

      if (result.success) {
        showSuccess(result.msg || "Sales data imported successfully");

        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
        queryClient.invalidateQueries({ queryKey: saleKeys.reports() });
        queryClient.invalidateQueries({ queryKey: saleKeys.dailySales({}) });
        queryClient.invalidateQueries({ queryKey: saleKeys.mtdSales({}) });

        // Clear import states after successful confirmation
        setImportResult(null);
        setImportId(null);

        return true;
      } else {
        showError(result.msg || "Failed to apply changes");
        return false;
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error confirming import:", error);
      const errorMessage =
        apiError?.response?.data?.msg || "Failed to apply changes";
      showError(errorMessage);
      return false;
    }
  };

  /**
   * Cancel a pending import
   */
  const handleCancelImport = async (): Promise<boolean> => {
    if (!importId) {
      showError("No valid import ID found");
      return false;
    }

    try {
      showInfo("Cancelling import...");

      await cancelImportSales(importId);

      showSuccess("Import cancelled successfully");

      // Clear import states
      setImportResult(null);
      setImportId(null);
      setImportError(null);

      return true;
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error cancelling import:", error);
      const errorMessage =
        apiError?.response?.data?.msg || "Failed to cancel import";
      showError(errorMessage);
      return false;
    }
  };

  return {
    // Methods
    downloadSample: handleDownloadSample,
    exportSales: handleExportSales,
    importSales: handleImportSales,
    confirmImport: handleConfirmImport,
    cancelImport: handleCancelImport,
    setImportResult,
    setImportError,

    // State
    isDownloading,
    isExporting,
    isImporting,
    isConfirming,
    importResult,
    importError,
    importId,
    validationProgress,
    validationStatus,
  };
};
