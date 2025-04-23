import React, { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { ScrollPanel } from "primereact/scrollpanel";
import { ImportProgress } from "@/services/FileMgmtService";
import { Modal } from "@/components/Common/Modal";
import { Tag } from "primereact/tag";

interface ImportStatusModalProps {
  visible: boolean;
  onHide: () => void;
  importId: string | null;
  progress: ImportProgress | null;
  isProcessing: boolean;
  isCompleted: boolean;
  onContinue: () => void;
  onCancel: () => void;
  successCount: number;
  failedCount: number;
  totalCount: number;
}

const getStatusIcon = (status: string | undefined) => {
  switch (status) {
    case "success":
      return <i className="pi pi-check text-green-500"></i>;
    case "failed":
      return <i className="pi pi-times text-red-500"></i>;
    case "pending":
      return <i className="pi pi-clock text-blue-500"></i>;
    default:
      return <i className="pi pi-spin pi-spinner text-blue-500"></i>;
  }
};

const ImportStatusModal: React.FC<ImportStatusModalProps> = ({
  visible,
  onHide,
  //   importId,
  progress,
  isProcessing,
  isCompleted,
  onContinue,
  onCancel,
  successCount,
  failedCount,
  totalCount,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const [expandedErrors, setExpandedErrors] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    // Scroll to the bottom when new items are processed
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [progress?.processed]);

  const toggleErrorExpand = (recordIndex: string) => {
    setExpandedErrors((prev) => ({
      ...prev,
      [recordIndex]: !prev[recordIndex],
    }));
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  const renderStatusLabel = () => {
    if (isCompleted) {
      return failedCount === 0
        ? "Import completed successfully!"
        : `Import completed with ${failedCount} errors`;
    }
    if (isProcessing) {
      return "Processing records...";
    }
    return "Ready to process";
  };

  const renderRecordRows = () => {
    if (!progress?.record_statuses) return null;

    // Convert object to sorted array
    const recordEntries = Object.entries(progress.record_statuses)
      .map(([index, data]) => ({ index, ...data }))
      .sort((a, b) => parseInt(a.index) - parseInt(b.index));

    return (
      <>
        {recordEntries.map((record) => (
          <div
            key={record.index}
            className={`mb-2 rounded border p-3 ${
              record.status === "success"
                ? "border-green-100 bg-green-50"
                : record.status === "failed"
                  ? "border-red-100 bg-red-50"
                  : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 flex w-8 justify-center">
                  {getStatusIcon(record.status)}
                </div>
                <div>
                  <span className="font-medium">
                    Record #{parseInt(record.index) + 1}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <Tag
                  value={record.status}
                  severity={
                    record.status === "success"
                      ? "success"
                      : record.status === "failed"
                        ? "danger"
                        : "info"
                  }
                  className="text-xs"
                />
                {record.timestamp && (
                  <span className="ml-2 text-xs text-gray-500">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {record.error && (
              <div className="mt-2 ml-8">
                <div
                  className="flex cursor-pointer items-center text-sm text-red-700"
                  onClick={() => toggleErrorExpand(record.index)}
                >
                  <i
                    className={`pi ${expandedErrors[record.index] ? "pi-chevron-down" : "pi-chevron-right"} mr-2`}
                  ></i>
                  Error details
                </div>
                {expandedErrors[record.index] && (
                  <div className="mt-1 rounded bg-red-100 p-2 text-sm whitespace-pre-wrap text-red-800">
                    {record.error}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={scrollEndRef} />
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      header="Import Progress"
      blockOutsideClick
      className="w-3/4 md:w-2/3"
      onHide={onHide}
    >
      <div className="p-6">
        {/* Status indicator */}
        <div className="mb-6 flex items-center justify-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full ${
              isCompleted
                ? failedCount === 0
                  ? "bg-emerald-500"
                  : "bg-amber-500"
                : "bg-blue-500"
            }`}
          >
            <i
              className={`pi ${
                isCompleted
                  ? failedCount === 0
                    ? "pi-check"
                    : "pi-exclamation-triangle"
                  : "pi-spin pi-spinner"
              } text-white`}
              style={{
                fontSize: "2.5rem",
              }}
            ></i>
          </div>
        </div>

        {/* Title and summary */}
        <h3 className="mb-4 text-center text-xl font-semibold">
          {renderStatusLabel()}
        </h3>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-medium text-slate-500">
              {progress?.processed || 0} of {totalCount} records processed
            </span>
            <span className="text-sm font-medium text-slate-500">
              {getProgressPercentage()}%
            </span>
          </div>
          <ProgressBar
            value={getProgressPercentage()}
            className="h-3"
            color={
              isCompleted
                ? failedCount === 0
                  ? "var(--green-500)"
                  : "var(--yellow-500)"
                : undefined
            }
          />
        </div>

        {/* Stats cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xl font-bold text-slate-700">{totalCount}</div>
            <div className="text-sm text-slate-500">Total Records</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xl font-bold text-green-600">
              {successCount}
            </div>
            <div className="text-sm text-slate-500">Successfully Imported</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xl font-bold text-red-500">{failedCount}</div>
            <div className="text-sm text-slate-500">Failed Records</div>
          </div>
        </div>

        {/* Records list */}
        <div className="rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h4 className="font-medium">Record Details</h4>
          </div>
          <ScrollPanel style={{ height: "300px" }} className="p-3">
            {renderRecordRows()}
            {!progress?.record_statuses && (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">
                  Ready to start importing records
                </p>
              </div>
            )}
          </ScrollPanel>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-center gap-4">
          {!isCompleted ? (
            <>
              <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-outlined p-button-secondary"
                onClick={onCancel}
                disabled={isProcessing}
              />
              <Button
                label={isProcessing ? "Processing..." : "Start Import"}
                icon={isProcessing ? "pi pi-spin pi-spinner" : "pi pi-play"}
                onClick={onContinue}
                disabled={isProcessing}
              />
            </>
          ) : (
            <Button label="Close" icon="pi pi-check" onClick={onHide} />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImportStatusModal;
