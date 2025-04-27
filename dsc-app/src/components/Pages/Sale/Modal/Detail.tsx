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
            {sale.item_no || "No description provided"}
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
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 font-medium text-gray-500">SKU:</td>
                  <td className="py-1 pl-2 font-semibold">{sale.sku}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-gray-500">Item No:</td>
                  <td className="py-1 pl-2 font-semibold">{sale.item_no}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-gray-500">Brand:</td>
                  <td className="py-1 pl-2 font-semibold">
                    {sale.brand.id} - {sale.brand.name}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-gray-500">Group:</td>
                  <td className="py-1 pl-2 font-semibold">
                    {sale.group.id} - {sale.group.name}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-gray-500">Division:</td>
                  <td className="py-1 pl-2 font-semibold">
                    {sale.division.name} - {sale.division.alias || ""}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-gray-500">Category:</td>
                  <td className="py-1 pl-2 font-semibold">
                    {sale.category.name}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Sales Metrics Card */}
          <Card title="Sales Metrics" className="shadow-sm">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <tbody>
                <tr>
                  <td className="font-medium text-gray-500">Quantity:</td>
                  <td className="text-right font-semibold">{sale.sale_qty}</td>
                </tr>
                <tr>
                  <td className="font-medium text-gray-500">Sale Amount:</td>
                  <td className="text-right font-semibold">
                    {formatNumberToIDR(sale.sale_amt)}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-gray-500">
                    Discount Amount:
                  </td>
                  <td className="text-right font-semibold">
                    {formatNumberToIDR(sale.discounted_amt)}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-gray-500">Gross Sales:</td>
                  <td className="text-right font-semibold">
                    {formatNumberToIDR(sale.gross_sales)}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-gray-500">Net Sales:</td>
                  <td className="text-right font-semibold">
                    {formatNumberToIDR(sale.nett_sales)}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-gray-500">Net After Tax:</td>
                  <td className="text-right font-semibold">
                    {formatNumberToIDR(sale.nett_sales_after_tax)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Tax Info Card */}
          {/* <Card title="Tax Information" className="shadow-sm">
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
          </Card> */}

          {/* Dates Card */}
          <Card title="Record Information" className="shadow-sm">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <tbody>
                <tr>
                  <td className="w-1/3 font-medium text-gray-500">
                    Input Date:
                  </td>
                  <td className="text-right">
                    <div>
                      {formatDate(sale.input_date, {
                        format: dateFormats.CALENDAR_DATE,
                      })}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {getTimeAgo(inputDate)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-gray-500">Created:</td>
                  <td className="text-right">
                    <div>{formatDate(sale.created_at)}</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {getTimeAgo(createdDate)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-gray-500">Updated:</td>
                  <td className="text-right">
                    <div>{formatDate(sale.updated_at)}</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {getTimeAgo(updatedDate)}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </Modal>
  );
};

export default Detail;
