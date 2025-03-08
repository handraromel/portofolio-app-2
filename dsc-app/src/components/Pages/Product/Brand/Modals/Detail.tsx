import React from "react";
import { Modal } from "@/components/Common";
import { ProductBrand } from "@/types/product";
import { formatDate } from "@/utils/formatDate";

interface DetailProps {
  visible: boolean;
  onHide: () => void;
  brand: ProductBrand | null;
}

const Detail: React.FC<DetailProps> = ({ visible, onHide, brand }) => {
  if (!brand) return null;

  return (
    <Modal
      visible={visible}
      onHide={onHide}
      header="Brand Details"
      className="w-[500px]"
    >
      <div className="p-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500 dark:text-gray-400">Brand ID:</div>
            <div>{brand.id}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500 dark:text-gray-400">Name:</div>
            <div>{brand.name}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500 dark:text-gray-400">UUID:</div>
            <div className="break-all">{brand.uuid}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500 dark:text-gray-400">Created At:</div>
            <div>{formatDate(brand.created_at)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500 dark:text-gray-400">Updated At:</div>
            <div>{formatDate(brand.updated_at)}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Detail;
