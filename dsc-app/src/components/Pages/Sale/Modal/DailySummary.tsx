import React, { useMemo } from "react";
import { Modal } from "@/components/Common";
import { formatNumberToIDR } from "@/utils/formatCurrency";
import YearComparisonChart from "../Components/YearComparisonChart";
import GrowthIndicator from "../Components/GrowthIndicator";
import { useModalChartRenderer } from "@/hooks";

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
  // const { currentTaxRate } = useTax();

  // Process data with useMemo to avoid recalculation on renders
  const processedData = useMemo(() => {
    if (!summaryData) {
      return {
        totalData: {
          sale_qty: 0,
          sale_amt: 0,
          discounted_amt: 0,
          gross_sales: 0,
          nett_sales: 0,
          tax_amount: 0,
          nett_sales_after_tax: 0,
          transaction_count: 0,
          ly_data: {
            sale_qty: 0,
            sale_amt: 0,
            discounted_amt: 0,
            gross_sales: 0,
            nett_sales: 0,
            tax_amount: 0,
            nett_sales_after_tax: 0,
            transaction_count: 0,
          },
          growth_amt: 0,
          growth_pct: 0,
        },
        reportDate: "N/A",
        lastYearDate: "N/A",
      };
    }

    const totalData = summaryData.total;
    const reportDate = new Date(summaryData.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const lastYearDate = new Date(
      summaryData.last_year_date,
    ).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return { totalData, reportDate, lastYearDate };
  }, [summaryData]);

  const { totalData, reportDate, lastYearDate } = processedData;
  const shouldRenderCharts = useModalChartRenderer(visible);

  // Always render the Modal but control visibility with the visible prop
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
            <>
              <div className="text-sm text-gray-500">
                Compared to {lastYearDate}
              </div>
              <div className="mt-1 flex items-center justify-center text-xs text-gray-400">
                <i
                  className="pi pi-info-circle mr-1"
                  style={{ fontSize: "12px" }}
                ></i>
                <span className="text-[12px] italic">
                  Same day of week, 52 weeks ago (364 days)
                </span>
              </div>
            </>
          )}
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
            {showYoY &&
              processedData.totalData.ly_data &&
              shouldRenderCharts && (
                <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-4">
                  <YearComparisonChart
                    title="Sales Amount"
                    currentYearValue={totalData.sale_amt}
                    lastYearValue={totalData.ly_data.sale_amt}
                    formatValue={(value) => formatNumberToIDR(value)}
                  />

                  <YearComparisonChart
                    title="Quantity Sold"
                    currentYearValue={totalData.sale_qty}
                    lastYearValue={totalData.ly_data.sale_qty}
                  />
                  <YearComparisonChart
                    title="Transaction Count"
                    currentYearValue={totalData.transaction_count}
                    lastYearValue={totalData.ly_data.transaction_count}
                  />

                  <YearComparisonChart
                    title="Net Sales After Tax"
                    currentYearValue={totalData.nett_sales_after_tax}
                    lastYearValue={totalData.ly_data.nett_sales_after_tax}
                    formatValue={(value) => formatNumberToIDR(value)}
                  />
                </div>
              )}

            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-md dark:from-blue-900/20 dark:to-indigo-900/20">
              <h3 className="mb-4 text-lg font-semibold">
                <i className="pi pi-chart-line mr-2 text-indigo-500"></i>
                Year-over-Year Performance
              </h3>

              {/* Main KPIs - Top row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-500">
                    Sales Growth
                  </div>
                  <div className="mt-3 flex items-center">
                    <GrowthIndicator
                      growthValue={totalData.growth_pct}
                      isPercentage={true}
                      size="lg"
                      className="text-3xl font-bold"
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {formatNumberToIDR(totalData.growth_amt || 0)} difference
                  </div>
                </div>

                <div className="flex flex-col items-center rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-500">
                    Quantity Change
                  </div>
                  <div className="mt-3 flex items-center">
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
                      className="text-3xl font-bold"
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {totalData.sale_qty - totalData.ly_data.sale_qty > 0
                      ? "+"
                      : ""}
                    {totalData.sale_qty - totalData.ly_data.sale_qty} units
                  </div>
                </div>

                <div className="flex flex-col items-center rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-500">
                    Transaction Change
                  </div>
                  <div className="mt-3 flex items-center">
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
                      className="text-3xl font-bold"
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {totalData.transaction_count -
                      totalData.ly_data.transaction_count >
                    0
                      ? "+"
                      : ""}
                    {totalData.transaction_count -
                      totalData.ly_data.transaction_count}{" "}
                    transactions
                  </div>
                </div>
              </div>

              {/* Secondary metrics - Bottom section */}
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Discount comparison */}
                <div className="flex flex-col rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">
                      <i className="pi pi-tag mr-2 text-yellow-500"></i>
                      Discount Amount
                    </div>
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
                      size="sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                      <div className="text-xs text-gray-500">This Year</div>
                      <div className="text-lg font-semibold">
                        {formatNumberToIDR(totalData.discounted_amt)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                      <div className="text-xs text-gray-500">Last Year</div>
                      <div className="text-lg font-semibold">
                        {formatNumberToIDR(totalData.ly_data.discounted_amt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AUR comparison */}
                <div className="flex flex-col rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">
                      <i className="pi pi-dollar mr-2 text-green-500"></i>
                      Average Unit Retail (AUR)
                    </div>
                    <GrowthIndicator
                      growthValue={
                        totalData.sale_qty > 0 && totalData.ly_data.sale_qty > 0
                          ? (totalData.sale_amt /
                              totalData.sale_qty /
                              (totalData.ly_data.sale_amt /
                                totalData.ly_data.sale_qty)) *
                              100 -
                            100
                          : null
                      }
                      isPercentage={true}
                      size="sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                      <div className="text-xs text-gray-500">This Year</div>
                      <div className="text-lg font-semibold">
                        {formatNumberToIDR(
                          totalData.sale_qty
                            ? totalData.sale_amt / totalData.sale_qty
                            : 0,
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                      <div className="text-xs text-gray-500">Last Year</div>
                      <div className="text-lg font-semibold">
                        {formatNumberToIDR(
                          totalData.ly_data.sale_qty
                            ? totalData.ly_data.sale_amt /
                                totalData.ly_data.sale_qty
                            : 0,
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Original view without YoY
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Quantity Sold
                </div>
                <div className="text-2xl font-bold">{totalData.sale_qty}</div>
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
                  Discount Amount
                </div>
                <div className="text-xl font-bold">
                  {formatNumberToIDR(totalData.discounted_amt)}
                </div>
              </div>
            </div>

            {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Tax Amount
                </div>
                <div className="text-xl font-bold">{totalData.tax_amount}</div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Tax Rate
                </div>
                <div className="text-xl font-bold">{currentTaxRate ?? 0}%</div>
              </div>
            </div> */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* <div className="rounded-lg bg-blue-50 p-4 shadow-sm dark:bg-blue-900/20">
                <div className="text-sm font-medium text-gray-500">
                  Transactions
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {totalData.transaction_count}
                  </div>
                </div>
              </div> */}

              <div className="rounded-lg bg-green-50 p-4 shadow-sm dark:bg-green-900/20">
                <div className="text-sm font-medium text-gray-500">
                  Net Sales Before Tax
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
                  {/* <div className="text-sm text-gray-500">
                    {totalData.nett_sales > 0
                      ? `${((totalData.nett_sales_after_tax / totalData.nett_sales) * 100).toFixed(1)}% of net`
                      : "0% of net"}
                  </div> */}
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
