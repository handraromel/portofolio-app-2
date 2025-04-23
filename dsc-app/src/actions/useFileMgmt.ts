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
  ImportResponse,
  startIncrementalImport,
  importNextRecord,
  finishIncrementalImport,
  ImportProgress,
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
  const [isProcessingIncremental, setIsProcessingIncremental] =
    useState<boolean>(false);
  const [isIncrementalCompleted, setIsIncrementalCompleted] =
    useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null,
  );
  const [incrementalImportActive, setIncrementalImportActive] =
    useState<boolean>(false);
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

  /**
   * Import sales data from file (validation phase)
   */
  const handleImportSales = async (
    file: File,
  ): Promise<ImportResponse | null> => {
    setIsImporting(true);
    setImportError(null);

    try {
      showInfo("Validating sales data, please wait...");

      const result = await importSales(file);
      setImportResult(result);
      setImportId(result.details.import_id || null);

      if (result.details.error_count > 0) {
        if (result.details.success_count > 0) {
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
        return result;
      }

      showSuccess("Data validation successful. Ready to apply changes.");
      return result;
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error validating import data:", error);
      const errorMessage =
        apiError?.response?.data?.msg || "Failed to validate import data";
      showError(errorMessage);
      setImportError(apiError);
      return null;
    } finally {
      setIsImporting(false);
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
    } finally {
      setIsConfirming(false);
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

  /**
   * Start an incremental import process row by row
   */
  const handleStartIncrementalImport = async (): Promise<boolean> => {
    if (!importId) {
      showError("No valid import ID found");
      return false;
    }

    try {
      showInfo("Starting incremental import process...");

      const result = await startIncrementalImport(importId);

      if (result.success) {
        setIncrementalImportActive(true);
        return true;
      } else {
        showError(result.msg || "Failed to start incremental import");
        return false;
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error starting incremental import:", error);
      const errorMessage =
        apiError?.response?.data?.msg || "Failed to start incremental import";
      showError(errorMessage);
      return false;
    }
  };

  /**
   * Process the next record in the incremental import
   */
  const handleImportNextRecord = async (): Promise<boolean> => {
    if (!importId) {
      showError("No valid import ID found");
      return false;
    }

    try {
      const result = await importNextRecord(importId);

      if (result.success) {
        setImportProgress(result.progress);

        // Check if we're done
        if (
          result.status === "completed" ||
          result.status === "partially_completed"
        ) {
          setIsIncrementalCompleted(true);
          setIsProcessingIncremental(false);

          const successCount = result.progress.succeeded || 0;
          const failedCount = result.progress.failed || 0;

          if (failedCount === 0) {
            showSuccess(`Successfully imported all ${successCount} records`);
          } else {
            showWarning(
              `Import completed with ${failedCount} errors. ${successCount} records imported successfully.`,
            );
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
          queryClient.invalidateQueries({ queryKey: saleKeys.reports() });
          queryClient.invalidateQueries({ queryKey: saleKeys.dailySales({}) });
          queryClient.invalidateQueries({ queryKey: saleKeys.mtdSales({}) });

          return false; // No more records to process
        }

        return true; // Continue processing
      } else {
        showError(result.error || "Failed to process record");
        setIsProcessingIncremental(false);
        return false;
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error processing next record:", error);
      const errorMessage =
        apiError?.response?.data?.msg || "Failed to process record";
      showError(errorMessage);
      setIsProcessingIncremental(false);
      return false;
    }
  };

  /**
   * Start and continue processing all records until complete
   */
  const handleProcessAllRecords = async (): Promise<void> => {
    if (isProcessingIncremental) return;

    setIsProcessingIncremental(true);

    try {
      // First start the incremental import
      const started = await handleStartIncrementalImport();
      if (!started) {
        setIsProcessingIncremental(false);
        return;
      }

      // Process records one by one until done or error
      let continueProcessing = true;

      while (continueProcessing && importId) {
        continueProcessing = await handleImportNextRecord();

        // Small delay to avoid overwhelming the server
        if (continueProcessing) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error("Error in incremental import process:", error);
      showError("The import process was interrupted due to an error");
      setIsProcessingIncremental(false);
    }
  };

  /**
   * Finish the incremental import process
   */
  const handleFinishIncrementalImport = async (): Promise<boolean> => {
    if (!importId) {
      showError("No valid import ID found");
      return false;
    }

    try {
      const result = await finishIncrementalImport(importId);

      if (result.success) {
        // Clean up states
        setIncrementalImportActive(false);
        setImportResult(null);
        setImportId(null);
        setImportError(null);
        setImportProgress(null);

        return true;
      } else {
        showError(result.msg || "Failed to finish incremental import");
        return false;
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error finishing incremental import:", error);
      const errorMessage =
        apiError?.response?.data?.msg || "Failed to finish incremental import";
      showError(errorMessage);
      return false;
    }
  };

  /**
   * Cancel incremental import and close the modal
   */
  const handleCancelIncrementalImport = async (): Promise<boolean> => {
    if (!importId) {
      setIncrementalImportActive(false);
      return true;
    }

    try {
      // Use the same cancel endpoint as regular import
      const result = await cancelImportSales(importId);

      if (result.success) {
        showSuccess(result.msg || "Import cancelled successfully");
      } else {
        showWarning(
          result.msg || "Import cancellation had issues, but modal will close",
        );
      }

      // Clean up states regardless of success/failure
      setIncrementalImportActive(false);
      setImportProgress(null);
      setIsIncrementalCompleted(false);
      setIsProcessingIncremental(false);
      setImportResult(null);
      setImportId(null);

      return true;
    } catch (error) {
      console.error("Error cancelling incremental import:", error);
      const apiError = error as ApiError;
      const errorMessage =
        apiError?.response?.data?.msg || "Failed to cancel import";
      showError(errorMessage);

      // Still clean up UI state even if API call fails
      setIncrementalImportActive(false);
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
    startIncrementalImport: handleStartIncrementalImport,
    importNextRecord: handleImportNextRecord,
    processAllRecords: handleProcessAllRecords,
    finishIncrementalImport: handleFinishIncrementalImport,
    cancelIncrementalImport: handleCancelIncrementalImport,
    setIncrementalImportActive,
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
    isProcessingIncremental,
    isIncrementalCompleted,
    importProgress,
    incrementalImportActive,
  };
};
