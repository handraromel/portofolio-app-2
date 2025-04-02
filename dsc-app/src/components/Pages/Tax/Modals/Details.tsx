import React from "react";
import { Modal } from "@/components/Common";
import { TaxConfiguration } from "@/types/tax";
import { formatDate } from "@/utils/formatDate";
import { Tag } from "primereact/tag";
import { format, formatDistanceToNow } from "date-fns";

interface DetailsProps {
  visible: boolean;
  onHide: () => void;
  taxConfig: TaxConfiguration | null;
}

const Details: React.FC<DetailsProps> = ({ visible, onHide, taxConfig }) => {
  if (!taxConfig) return null;

  const createdDate = new Date(taxConfig.created_at);
  const updatedDate = new Date(taxConfig.updated_at);
  const effectiveFromDate = new Date(taxConfig.effective_from);
  const effectiveUntilDate = taxConfig.effective_until
    ? new Date(taxConfig.effective_until)
    : null;

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Modal
      visible={visible}
      onHide={onHide}
      header="Tax Configuration Details"
      className="w-[600px]"
    >
      <div className="p-5">
        {/* Tax Configuration header section */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300">
                <i className="pi pi-percentage text-lg"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {taxConfig.name}
              </h2>
            </div>
            <Tag
              value={taxConfig.is_active ? "Active" : "Inactive"}
              severity={taxConfig.is_active ? "success" : "warning"}
              className="px-3 py-1"
            />
          </div>

          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {taxConfig.description || "No description provided"}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Tax Rate card */}
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-blue-50 p-4 shadow-sm dark:from-green-900/20 dark:to-blue-900/20">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Tax Rate
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {taxConfig.tax_rate}%
              </div>
            </div>
          </div>

          {/* Effective period card */}
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-blue-50 p-4 shadow-sm dark:from-green-900/20 dark:to-blue-900/20">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Effective Period
            </div>
            <div className="flex flex-col">
              <div className="text-gray-800 dark:text-gray-200">
                From: {format(effectiveFromDate, "PPP")}
              </div>
              {effectiveUntilDate ? (
                <div className="mt-1 text-gray-800 dark:text-gray-200">
                  Until: {format(effectiveUntilDate, "PPP")}
                </div>
              ) : (
                <div className="mt-1 text-gray-800 dark:text-gray-200">
                  Until: No end date (ongoing)
                </div>
              )}
            </div>
          </div>

          {/* Created date card */}
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-blue-50 p-4 shadow-sm dark:from-green-900/20 dark:to-blue-900/20">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Created
            </div>
            <div className="flex flex-col">
              <div className="text-gray-800 dark:text-gray-200">
                {formatDate(taxConfig.created_at)}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {getTimeAgo(createdDate)}
              </div>
            </div>
          </div>

          {/* Updated date card */}
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-blue-50 p-4 shadow-sm dark:from-green-900/20 dark:to-blue-900/20">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Updated
            </div>
            <div className="flex flex-col">
              <div className="text-gray-800 dark:text-gray-200">
                {formatDate(taxConfig.updated_at)}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {getTimeAgo(updatedDate)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Details;
