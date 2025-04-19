import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/context/Toast";
import { productBrandKeys } from "@/services/product/BrandService";
import {
  getSampleBrandImportFile,
  importBrands,
  confirmImportBrands,
  cancelImportBrands,
  ImportResponse,
} from "@/services/FileMgmtService";
import { ApiError } from "@/types/api";

export const useBrandFileMgmt = () => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [importError, setImportError] = useState<ApiError | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const queryClient = useQueryClient();

  /**
   * Download sample import file
   */
  const handleDownloadSample = async (): Promise<boolean> => {
    setIsDownloading(true);
    try {
      showInfo("Downloading sample file...");
      const result = await getSampleBrandImportFile();

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
   * Import brands data from file (validation phase)
   */
  const handleImportBrands = async (
    file: File,
  ): Promise<ImportResponse | null> => {
    setIsImporting(true);
    setImportError(null);

    try {
      showInfo("Validating brand data, please wait...");

      const result = await importBrands(file);
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

      const result = await confirmImportBrands(importId);

      if (result.success) {
        showSuccess(result.msg || "Brand data imported successfully");

        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: productBrandKeys.lists() });

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

      await cancelImportBrands(importId);

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
    importBrands: handleImportBrands,
    confirmImport: handleConfirmImport,
    cancelImport: handleCancelImport,
    setImportResult,
    setImportError,

    // State
    isDownloading,
    isImporting,
    isConfirming,
    importResult,
    importError,
    importId,
  };
};
