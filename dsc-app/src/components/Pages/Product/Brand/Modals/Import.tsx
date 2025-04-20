import React, { useRef, useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { ProgressBar } from "primereact/progressbar";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import { ImportResponse } from "@/services/FileMgmtService";
import { ApiError } from "@/types/api";
import { Modal } from "@/components/Common/Modal";
import { useModal } from "@/hooks/useModal";

interface ImportModalProps {
  visible: boolean;
  onHide: () => void;
  onImport: (file: File) => Promise<void>;
  onConfirmImport: () => Promise<void>;
  onCancelImport: () => Promise<void>;
  onDownloadSample: () => Promise<void>;
  isImporting: boolean;
  isDownloading: boolean;
  isConfirming?: boolean;
  importError: ApiError | null;
  importResult: ImportResponse | null;
  onClearStates: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  visible,
  onHide,
  onImport,
  onConfirmImport,
  onCancelImport,
  onDownloadSample,
  isImporting,
  isDownloading,
  isConfirming = false,
  importError,
  importResult,
  onClearStates,
}) => {
  const fileUploadRef = useRef<FileUpload>(null);
  const resultModal = useModal(false);

  const [importStatus, setImportStatus] = useState<string>("success");
  const [statusIcon, setStatusIcon] = useState<string>("pi-check");
  const [successPercentage, setSuccessPercentage] = useState<number>(0);

  // Reset the file upload component when dialog is closed
  useEffect(() => {
    if (!visible && fileUploadRef.current) {
      fileUploadRef.current.clear();
    }
  }, [visible]);

  // Show result modal when import is complete
  useEffect(() => {
    if (importResult && !isImporting) {
      resultModal.open();
    } else {
      resultModal.close();
    }
  }, [importResult, isImporting]);

  // Update status values when import result changes
  useEffect(() => {
    if (importResult) {
      const totalRecords = importResult.details.total_records;
      const successCount = importResult.details.success_count;
      const percentage =
        totalRecords > 0 ? (successCount / totalRecords) * 100 : 0;

      setSuccessPercentage(percentage);

      // Set status color based on success rate (using the same logic as in Sale)
      setImportStatus(
        importResult.details.error_count === 0
          ? "success"
          : percentage > 0 && percentage < 100
            ? "warning"
            : "error",
      );

      // Set icon based on error count
      setStatusIcon(
        importResult.details.error_count === 0
          ? "pi-check"
          : "pi-exclamation-circle",
      );
    }
  }, [importResult]);

  const handleClose = () => {
    // If we have an import result, cancel the import
    if (importResult && !isConfirming) {
      onCancelImport();
    }

    // Clear the file upload component
    if (fileUploadRef.current) {
      fileUploadRef.current.clear();
    }

    onClearStates();
    onHide();
    resultModal.close();
  };

  const handleFileUpload = async (event: FileUploadHandlerEvent) => {
    if (event.files && event.files.length > 0) {
      try {
        const file = event.files[0];
        await onImport(file);
      } catch (error) {
        console.error("Import error:", error);
      }
    }
  };

  const renderImportResultContent = () => {
    if (!importResult) return null;

    const canConfirm = importResult.details.success_count > 0;

    return (
      <div className="p-6">
        {/* Status indicator */}
        <div className="mb-6 flex items-center justify-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full ${
              importStatus === "success"
                ? "bg-emerald-500"
                : importStatus === "warning"
                  ? "bg-amber-500"
                  : "bg-rose-500"
            }`}
          >
            <i
              className={`pi ${statusIcon} text-white`}
              style={{
                fontSize: "2.5rem",
              }}
            ></i>
          </div>
        </div>

        {/* Title and summary */}
        <h3 className="mb-4 text-center text-xl font-semibold">
          {importResult.details.error_count === 0
            ? "Import Preview - Ready to Apply"
            : "Import Preview - Partial Data Ready"}
        </h3>

        <p className="mb-6 text-center text-slate-400">
          {importResult.message}
        </p>

        {/* Preview message */}
        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-center text-blue-700">
            <i className="pi pi-info-circle mr-2"></i>
            Review the import results below before applying changes to the
            database.
          </p>
        </div>

        {/* Stats cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xl font-bold text-slate-700">
              {importResult.details.total_records}
            </div>
            <div className="text-sm text-slate-500">Total Records</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xl font-bold text-green-600">
              {importResult.details.success_count}
            </div>
            <div className="text-sm text-slate-500">Ready to Import</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xl font-bold text-red-500">
              {importResult.details.error_count}
            </div>
            <div className="text-sm text-slate-500">Failed</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-medium text-slate-400">
              Success Rate
            </span>
            <span className="text-sm font-medium text-slate-400">
              {Math.round(successPercentage)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full ${
                importStatus === "success"
                  ? "bg-emerald-500"
                  : importStatus === "warning"
                    ? "bg-amber-500"
                    : "bg-rose-500"
              }`}
              style={{ width: `${successPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Error list - only shown if there are errors */}
        {importResult.details.error_count > 0 && (
          <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-4">
            <h4 className="mb-3 font-medium text-red-800">Error Details:</h4>
            <div className="max-h-40 overflow-y-auto">
              <ul className="list-inside list-disc text-sm text-red-700">
                {importResult.details.errors.map((error, index) => (
                  <li key={index} className="mb-1 py-1">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
            {importResult.details.has_more_errors && (
              <div className="mt-3 rounded bg-red-100 p-2 text-center text-sm text-red-800">
                <i className="pi pi-info-circle mr-2"></i>
                Additional errors not shown
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex justify-center gap-4">
          <Button
            label="Cancel"
            icon="pi pi-times"
            className="p-button-outlined p-button-secondary"
            onClick={handleClose}
            disabled={isConfirming}
          />
          {canConfirm && (
            <Button
              label="Apply Changes"
              icon="pi pi-check"
              onClick={onConfirmImport}
              loading={isConfirming}
              disabled={isConfirming}
            />
          )}
        </div>
      </div>
    );
  };

  const renderImportContent = () => {
    return (
      <>
        <div className="p-4">
          <p className="mb-4">
            Upload an Excel file with brand data. Please ensure your file
            follows the correct format.
          </p>

          <div className="mb-4">
            <Message
              severity="info"
              text="Each brand must be in the format 'ID-NAME' (e.g., '123-ADIDAS'). The ID must be a unique number not present in the database."
            />
          </div>

          <FileUpload
            ref={fileUploadRef}
            name="file"
            customUpload
            uploadHandler={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            maxFileSize={10000000}
            chooseLabel="Select File"
            uploadLabel="Import"
            cancelLabel="Cancel"
            className="w-full"
            emptyTemplate={
              <p className="m-0">
                Drag and drop a file here or click to browse
              </p>
            }
          />

          {isImporting && (
            <div className="mt-4">
              <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
              <p className="mt-2 text-center">
                Processing import, please wait...
              </p>
            </div>
          )}

          {importError && (
            <div className="mt-4">
              <Message
                severity="error"
                text={
                  importError.response?.data?.msg ||
                  "An error occurred during import"
                }
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-4 p-4">
          <Button
            label="Close"
            icon="pi pi-times"
            severity="secondary"
            className="p-button-outlined ml-2"
            onClick={handleClose}
            disabled={isImporting}
          />
          <Button
            label="Download Sample"
            icon="pi pi-download"
            onClick={onDownloadSample}
            className="p-button-outlined"
            disabled={isDownloading}
          />
        </div>
      </>
    );
  };

  return (
    <>
      <Modal
        visible={visible && !importResult}
        header="Import Brand Data"
        blockOutsideClick
        className="w-2/3 md:w-1/2"
      >
        {renderImportContent()}
      </Modal>

      <Modal
        visible={resultModal.isOpen && importResult !== null && !isImporting}
        onHide={handleClose}
        header="Import Results"
        blockOutsideClick
        className="w-2/3 md:w-1/2"
      >
        {renderImportResultContent()}
      </Modal>
    </>
  );
};

export default ImportModal;
