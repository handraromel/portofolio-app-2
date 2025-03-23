import React from "react";
import { Modal } from "@/components/Common";
import { ProductDivision } from "@/types/product";
import { formatDate } from "@/utils/formatDate";
import { Tag } from "primereact/tag";
import { formatDistanceToNow } from "date-fns";

interface DetailProps {
  visible: boolean;
  onHide: () => void;
  division: ProductDivision | null;
}

const Detail: React.FC<DetailProps> = ({ visible, onHide, division }) => {
  if (!division) return null;

  const createdDate = new Date(division.created_at);
  const updatedDate = new Date(division.updated_at);

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Modal
      visible={visible}
      onHide={onHide}
      header="Division Details"
      className="w-[550px]"
    >
      <div className="p-5">
        {/* Division header section */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                <i className="pi pi-sitemap text-lg"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {division.name}
              </h2>
            </div>
            <Tag value="Division" severity="info" className="px-3 py-1" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Created date card */}
          <div className="rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-4 shadow-sm dark:from-purple-900/20 dark:to-blue-900/20">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Alias
            </div>
            <div className="flex flex-col">
              <div className="text-gray-800 dark:text-gray-200">
                {division.alias || "-"}
              </div>
            </div>
          </div>
          {/* Created date card */}
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-4 shadow-sm dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Created
            </div>
            <div className="flex flex-col">
              <div className="text-gray-800 dark:text-gray-200">
                {formatDate(division.created_at)}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {getTimeAgo(createdDate)}
              </div>
            </div>
          </div>

          {/* Updated date card */}
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-4 shadow-sm dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Updated
            </div>
            <div className="flex flex-col">
              <div className="text-gray-800 dark:text-gray-200">
                {formatDate(division.updated_at)}
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

export default Detail;
