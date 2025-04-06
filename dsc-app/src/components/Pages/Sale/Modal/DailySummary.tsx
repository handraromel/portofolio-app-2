import React from "react";
import { Modal } from "@/components/Common";
import { formatNumberToIDR } from "@/utils/formatCurrency";
import { useTax } from "@/actions";
import YearComparisonChart from "../Components/YearComparisonChart";
import GrowthIndicator from "../Components/GrowthIndicator";

interface DailySummaryProps {
  visible: boolean;
  onHide: () => void;
  summaryData: {
    date: string;
    last_year_date: string;
    total: {
      sale_qty: number;
      sale_amt: number;
      discounted_amt: number;
      gross_sales: number;
      nett_sales: number;
      tax_amount: number;
      nett_sales_after_tax: number;
      transaction_count: number;
      ly_data: {
        sale_qty: number;
        sale_amt: number;
        discounted_amt: number;
        gross_sales: number;
        nett_sales: number;
        tax_amount: number;
        nett_sales_after_tax: number;
        transaction_count: number;
      };
      growth_amt: number | null;
      growth_pct: number | null;
    };
  } | null;
  showYoY: boolean;
}

const DailySummary: React.FC<DailySummaryProps> = ({
  visible,
  onHide,
  summaryData,
  showYoY,
}) => {
  if (!summaryData) return null;

  const { currentTaxRate } = useTax();
  const totalData = summaryData.total;
  const reportDate = new Date(summaryData.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lastYearDate = new Date(summaryData.last_year_date).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <Modal
      visible={visible}
      onHide={onHide}
      header="Daily Sales Summary"
      className="w-[1200px]"
    >
      <div className="space-y-6 p-5">
        <div className="border-b border-gray-200 pb-4 text-center dark:border-gray-700">
          <h2 className="mb-2 text-2xl font-bold">{reportDate}</h2>
          {showYoY && (
            <div className="text-sm text-gray-500">
              Compared to {lastYearDate}
            </div>
          )}
          <p className="text-gray-500">Sales performance snapshot</p>
        </div>

        {showYoY ? (
          // Year over year comparison view
          <>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">This Year (TY)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Quantity Sold
                    </div>
                    <div className="text-2xl font-bold">
                      {totalData.sale_qty}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Total Sales
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumberToIDR(totalData.sale_amt)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Transactions
                    </div>
                    <div className="text-2xl font-bold">
                      {totalData.transaction_count}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Net After Tax
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumberToIDR(totalData.nett_sales_after_tax)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Last Year (LY)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Quantity Sold
                    </div>
                    <div className="text-2xl font-bold">
                      {totalData.ly_data.sale_qty}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Total Sales
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumberToIDR(totalData.ly_data.sale_amt)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Transactions
                    </div>
                    <div className="text-2xl font-bold">
                      {totalData.ly_data.transaction_count}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Net After Tax
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumberToIDR(
                        totalData.ly_data.nett_sales_after_tax,
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
              <YearComparisonChart
                title="Sales Amount Comparison"
                currentYearValue={totalData.sale_amt}
                lastYearValue={totalData.ly_data.sale_amt}
                formatValue={(value) => formatNumberToIDR(value)}
              />

              <YearComparisonChart
                title="Quantity Sold Comparison"
                currentYearValue={totalData.sale_qty}
                lastYearValue={totalData.ly_data.sale_qty}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
              <YearComparisonChart
                title="Transaction Count Comparison"
                currentYearValue={totalData.transaction_count}
                lastYearValue={totalData.ly_data.transaction_count}
              />

              <YearComparisonChart
                title="Net Sales After Tax Comparison"
                currentYearValue={totalData.nett_sales_after_tax}
                lastYearValue={totalData.ly_data.nett_sales_after_tax}
                formatValue={(value) => formatNumberToIDR(value)}
              />
            </div>

            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-md dark:from-blue-900/20 dark:to-indigo-900/20">
              <h3 className="mb-4 text-lg font-semibold">
                Year-over-Year Performance
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-500">
                    Sales Growth
                  </div>
                  <div className="mt-2 flex items-center">
                    <GrowthIndicator
                      growthValue={totalData.growth_pct}
                      isPercentage={true}
                      size="lg"
                      className="text-2xl font-bold"
                    />
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {formatNumberToIDR(totalData.growth_amt || 0)}
                  </div>
                </div>

                <div className="flex flex-col items-center rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-500">
                    Quantity Trend
                  </div>
                  <div className="mt-2 flex items-center">
                    <GrowthIndicator
                      growthValue={
                        totalData.sale_qty && totalData.ly_data.sale_qty
                          ? (totalData.sale_qty / totalData.ly_data.sale_qty) *
                              100 -
                            100
                          : null
                      }
                      isPercentage={true}
                      size="lg"
                      className="text-2xl font-bold"
                    />
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {totalData.sale_qty - totalData.ly_data.sale_qty} units
                  </div>
                </div>

                <div className="flex flex-col items-center rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-500">
                    Transaction Trend
                  </div>
                  <div className="mt-2 flex items-center">
                    <GrowthIndicator
                      growthValue={
                        totalData.transaction_count &&
                        totalData.ly_data.transaction_count
                          ? (totalData.transaction_count /
                              totalData.ly_data.transaction_count) *
                              100 -
                            100
                          : null
                      }
                      isPercentage={true}
                      size="lg"
                      className="text-2xl font-bold"
                    />
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {totalData.transaction_count -
                      totalData.ly_data.transaction_count}{" "}
                    transactions
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="mb-2 text-sm font-medium text-gray-500">
                    Discount Amount
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">This Year</div>
                      <div className="text-lg font-semibold">
                        {formatNumberToIDR(totalData.discounted_amt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Last Year</div>
                      <div className="text-lg font-semibold">
                        {formatNumberToIDR(totalData.ly_data.discounted_amt)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-end">
                    <GrowthIndicator
                      growthValue={
                        totalData.discounted_amt &&
                        totalData.ly_data.discounted_amt
                          ? (totalData.discounted_amt /
                              totalData.ly_data.discounted_amt) *
                              100 -
                            100
                          : null
                      }
                      isPercentage={true}
                    />
                  </div>
                </div>

                <div className="flex flex-col rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="mb-2 text-sm font-medium text-gray-500">
                    Tax Amount
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">This Year</div>
                      <div className="text-lg font-semibold">
                        {formatNumberToIDR(totalData.tax_amount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Last Year</div>
                      <div className="text-lg font-semibold">
                        {formatNumberToIDR(totalData.ly_data.tax_amount)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-end">
                    <GrowthIndicator
                      growthValue={
                        totalData.tax_amount && totalData.ly_data.tax_amount
                          ? (totalData.tax_amount /
                              totalData.ly_data.tax_amount) *
                              100 -
                            100
                          : null
                      }
                      isPercentage={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Original view without YoY
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Quantity Sold
                </div>
                <div className="text-2xl font-bold">{totalData.sale_qty}</div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Total Sales
                </div>
                <div className="text-2xl font-bold">
                  {formatNumberToIDR(totalData.sale_amt)}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Gross Sales
                </div>
                <div className="text-2xl font-bold">
                  {formatNumberToIDR(totalData.gross_sales)}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Total Transactions
                </div>
                <div className="text-2xl font-bold">
                  {totalData.transaction_count}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Discount Amount
                </div>
                <div className="text-xl font-bold">
                  {formatNumberToIDR(totalData.discounted_amt)}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Tax Amount
                </div>
                <div className="text-xl font-bold">
                  {formatNumberToIDR(totalData.tax_amount)}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Tax Rate
                </div>
                <div className="text-xl font-bold">{currentTaxRate ?? 0}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4 shadow-sm dark:bg-blue-900/20">
                <div className="text-sm font-medium text-gray-500">
                  Transactions
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {totalData.transaction_count}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-green-50 p-4 shadow-sm dark:bg-green-900/20">
                <div className="text-sm font-medium text-gray-500">
                  Net Sales (Before Tax)
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {formatNumberToIDR(totalData.nett_sales)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-indigo-50 p-4 shadow-sm dark:bg-indigo-900/20">
                <div className="text-sm font-medium text-gray-500">
                  Net Sales After Tax
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {formatNumberToIDR(totalData.nett_sales_after_tax)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {totalData.nett_sales > 0
                      ? `${((totalData.nett_sales_after_tax / totalData.nett_sales) * 100).toFixed(1)}% of net`
                      : "0% of net"}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default DailySummary;
