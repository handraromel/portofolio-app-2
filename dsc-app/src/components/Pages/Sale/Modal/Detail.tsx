import React from "react";
import { Modal } from "@/components/Common";
import { Sale } from "@/types/sale";
import { formatDate } from "@/utils/formatDate";
import { dateFormats } from "@/constants/dateFormats";
import { formatNumberToIDR } from "@/utils/formatCurrency";
import { Tag } from "primereact/tag";
import { formatDistanceToNow } from "date-fns";
import { Card } from "primereact/card";

interface DetailProps {
  visible: boolean;
  onHide: () => void;
  sale: Sale | null;
}

const Detail: React.FC<DetailProps> = ({ visible, onHide, sale }) => {
  if (!sale) return null;

  const createdDate = new Date(sale.created_at);
  const updatedDate = new Date(sale.updated_at);
  const inputDate = new Date(sale.input_date);

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Modal
      visible={visible}
      onHide={onHide}
      header="Sale Record Details"
      className="w-[800px]"
    >
      <div className="p-5">
        {/* Sale header section */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                <i className="pi pi-shopping-cart text-lg"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Sale on{" "}
                {formatDate(sale.input_date, {
                  format: dateFormats.CALENDAR_DATE,
                })}
              </h2>
            </div>
            <Tag
              value={`${sale.sale_qty} units`}
              severity="info"
              className="px-3 py-1"
            />
          </div>

          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {sale.description || "No description provided"}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Tag value={sale.brand.name} severity="success" />
            <Tag value={sale.group.name} severity="info" />
            <Tag value={sale.division.name} severity="warning" />
            <Tag value={sale.category.name} severity="contrast" />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Product Info Card */}
          <Card title="Product Information" className="shadow-sm">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">SKU:</span>
                <span className="font-semibold">{sale.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Item No:</span>
                <span className="font-semibold">{sale.item_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Brand:</span>
                <span className="font-semibold">
                  {sale.brand.id} - {sale.brand.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Group:</span>
                <span className="font-semibold">
                  {sale.group.id} - {sale.group.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Division:</span>
                <span className="font-semibold">
                  {sale.division.name} - {sale.division.alias || ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Category:</span>
                <span className="font-semibold">{sale.category.name}</span>
              </div>
            </div>
          </Card>

          {/* Sales Metrics Card */}
          <Card title="Sales Metrics" className="shadow-sm">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Quantity:</span>
                <span className="font-semibold">{sale.sale_qty}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Sale Amount:</span>
                <span className="font-semibold">
                  {formatNumberToIDR(sale.sale_amt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">
                  Discount Amount:
                </span>
                <span className="font-semibold">
                  {formatNumberToIDR(sale.discounted_amt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Gross Sales:</span>
                <span className="font-semibold">
                  {formatNumberToIDR(sale.gross_sales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Net Sales:</span>
                <span className="font-semibold">
                  {formatNumberToIDR(sale.nett_sales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">
                  Net After Tax:
                </span>
                <span className="font-semibold">
                  {formatNumberToIDR(sale.nett_sales_after_tax)}
                </span>
              </div>
            </div>
          </Card>

          {/* Tax Info Card */}
          <Card title="Tax Information" className="shadow-sm">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Tax Rate:</span>
                <span className="font-semibold">{sale.tax_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Tax Amount:</span>
                <span className="font-semibold">{sale.tax_amount}</span>
              </div>
            </div>
          </Card>

          {/* Dates Card */}
          <Card title="Record Information" className="shadow-sm">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Input Date:</span>
                <div className="text-right">
                  <div>
                    {formatDate(sale.input_date, {
                      format: dateFormats.CALENDAR_DATE,
                    })}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {getTimeAgo(inputDate)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Created:</span>
                <div className="text-right">
                  <div>{formatDate(sale.created_at)}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {getTimeAgo(createdDate)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Updated:</span>
                <div className="text-right">
                  <div>{formatDate(sale.updated_at)}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {getTimeAgo(updatedDate)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Modal>
  );
};

export default Detail;
