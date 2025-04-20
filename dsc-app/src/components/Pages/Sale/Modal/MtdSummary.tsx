import React, { useMemo } from "react";
import { Modal } from "@/components/Common";
import { formatNumberToIDR } from "@/utils/formatCurrency";
import YearComparisonChart from "../Components/YearComparisonChart";
import GrowthIndicator from "../Components/GrowthIndicator";
import { useModalChartRenderer } from "@/hooks";

interface MtdSummaryProps {
  visible: boolean;
  onHide: () => void;
  summaryData: {
    from_date: string;
    to_date: string;
    total: {
      sale_qty: number;
      sale_amt: number;
      discounted_amt: number;
      gross_sales: number;
      nett_sales: number;
      tax_amount: number;
      nett_sales_after_tax: number;
      transaction_count: number;
      days_with_sales: number;
      total_days: number;
      sales_coverage: number;
      aur: number;
      tax_rate?: number;
      ly_data?: {
        sale_qty: number;
        sale_amt: number;
        discounted_amt: number;
        gross_sales: number;
        nett_sales: number;
        tax_amount: number;
        nett_sales_after_tax: number;
        transaction_count: number;
        days_with_sales: number;
        total_days: number;
        sales_coverage: number;
        aur: number;
      };
      growth_amt: number | null;
      growth_pct: number | null;
    };
  } | null;
  showYoY: boolean;
}

const MtdSummary: React.FC<MtdSummaryProps> = ({
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
        fromDate: "N/A",
        toDate: "N/A",
        monthTitle: "N/A",
        lastYearMonthTitle: "",
        safeData: {
          sale_qty: 0,
          sale_amt: 0,
          discounted_amt: 0,
          gross_sales: 0,
          nett_sales: 0,
          tax_amount: 0,
          nett_sales_after_tax: 0,
          transaction_count: 0,
          days_with_sales: 0,
          total_days: 1,
          sales_coverage: 0,
          aur: 0,
          growth_amt: 0,
          growth_pct: 0,
          ly_data: null,
        },
      };
    }

    const totalData = summaryData.total || {};
    const fromDate = summaryData.from_date
      ? new Date(summaryData.from_date).toLocaleDateString()
      : "N/A";
    const toDate = summaryData.to_date
      ? new Date(summaryData.to_date).toLocaleDateString()
      : "N/A";
    const monthTitle = summaryData.from_date
      ? new Date(summaryData.from_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        })
      : "N/A";

    const lastYearMonthTitle =
      totalData.ly_data && summaryData.from_date
        ? new Date(
            new Date(summaryData.from_date).setFullYear(
              new Date(summaryData.from_date).getFullYear() - 1,
            ),
          ).toLocaleDateString("en-US", { year: "numeric", month: "long" })
        : "";

    // Add default values to prevent undefined errors
    const safeData = {
      sale_qty: totalData.sale_qty || 0,
      sale_amt: totalData.sale_amt || 0,
      discounted_amt: totalData.discounted_amt || 0,
      gross_sales: totalData.gross_sales || 0,
      nett_sales: totalData.nett_sales || 0,
      tax_amount: totalData.tax_amount || 0,
      nett_sales_after_tax: totalData.nett_sales_after_tax || 0,
      transaction_count: totalData.transaction_count || 0,
      days_with_sales: totalData.days_with_sales || 0,
      total_days: totalData.total_days || 1,
      sales_coverage: totalData.sales_coverage || 0,
      aur: totalData.aur || 0,
      growth_amt: totalData.growth_amt || 0,
      growth_pct: totalData.growth_pct || 0,
      ly_data: totalData.ly_data || null,
    };

    return { fromDate, toDate, monthTitle, lastYearMonthTitle, safeData };
  }, [summaryData]);

  const { fromDate, toDate, monthTitle, lastYearMonthTitle, safeData } =
    processedData;

  const shouldRenderCharts = useModalChartRenderer(visible);

  return (
    <Modal
      visible={visible}
      onHide={onHide}
      header={`MTD Sales Summary: ${monthTitle}`}
      className="w-[1200px]"
    >
      <div className="space-y-6 p-5">
        <div className="border-b border-gray-200 pb-4 text-center dark:border-gray-700">
          <h2 className="mb-2 text-lg font-medium">
            Period: {fromDate} - {toDate}
          </h2>
          {showYoY && safeData.ly_data && (
            <>
              <div className="mt-2 text-sm text-gray-500">
                Compared to {lastYearMonthTitle}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                <i className="pi pi-info-circle mr-1"></i>
                Day-of-week aligned comparison (52 weeks prior)
              </div>
            </>
          )}
        </div>
        {showYoY && safeData.ly_data ? (
          // Year over year comparison view
          <>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">This Year (TY)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Qty Sold
                    </div>
                    <div className="text-2xl font-bold">
                      {safeData.sale_qty}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Total Sales
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumberToIDR(safeData.sale_amt)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Transactions
                    </div>
                    <div className="text-2xl font-bold">
                      {safeData.transaction_count}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Net After Tax
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumberToIDR(safeData.nett_sales_after_tax)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Coverage
                    </div>
                    <div className="text-2xl font-bold">
                      {safeData.sales_coverage.toFixed(1)}%
                    </div>
                  </div> */}

                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">AUR</div>
                    <div className="text-2xl font-bold">
                      {formatNumberToIDR(safeData.aur)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Last Year (LY)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Qty Sold
                    </div>
                    <div className="text-2xl font-bold">
                      {safeData.ly_data?.sale_qty || 0}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Total Sales
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumberToIDR(safeData.ly_data?.sale_amt || 0)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Transactions
                    </div>
                    <div className="text-2xl font-bold">
                      {safeData.ly_data?.transaction_count || 0}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Net After Tax
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumberToIDR(
                        safeData.ly_data?.nett_sales_after_tax || 0,
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Coverage
                    </div>
                    <div className="text-2xl font-bold">
                      {(safeData.ly_data?.sales_coverage || 0).toFixed(1)}%
                    </div>
                  </div> */}

                  <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-500">AUR</div>
                    <div className="text-2xl font-bold">
                      {formatNumberToIDR(safeData.ly_data?.aur || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            {showYoY && safeData.ly_data && shouldRenderCharts && (
              <>
                <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
                  <YearComparisonChart
                    title="Sales Amount Comparison"
                    currentYearValue={safeData.sale_amt}
                    lastYearValue={safeData.ly_data?.sale_amt || 0}
                    formatValue={(value) => formatNumberToIDR(value)}
                  />

                  <YearComparisonChart
                    title="Transaction Count Comparison"
                    currentYearValue={safeData.transaction_count}
                    lastYearValue={safeData.ly_data?.transaction_count || 0}
                  />

                  <YearComparisonChart
                    title="AUR Comparison"
                    currentYearValue={safeData.aur}
                    lastYearValue={safeData.ly_data?.aur || 0}
                    formatValue={(value) => formatNumberToIDR(value)}
                  />
                </div>

                {/* <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
                  <YearComparisonChart
                    title="Coverage Rate Comparison"
                    currentYearValue={safeData.sales_coverage}
                    lastYearValue={safeData.ly_data?.sales_coverage || 0}
                    formatValue={(value) => `${value.toFixed(1)}%`}
                  />
                </div> */}
              </>
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
                      growthValue={safeData.growth_pct}
                      isPercentage={true}
                      size="lg"
                      className="text-3xl font-bold"
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {formatNumberToIDR(safeData.growth_amt || 0)} difference
                  </div>
                </div>

                <div className="flex flex-col items-center rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-500">
                    Quantity Change
                  </div>
                  <div className="mt-3 flex items-center">
                    <GrowthIndicator
                      growthValue={
                        safeData.sale_qty && safeData.ly_data?.sale_qty
                          ? (safeData.sale_qty / safeData.ly_data.sale_qty) *
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
                    {safeData.sale_qty - (safeData.ly_data?.sale_qty || 0) > 0
                      ? "+"
                      : ""}
                    {safeData.sale_qty - (safeData.ly_data?.sale_qty || 0)}{" "}
                    units
                  </div>
                </div>

                <div className="flex flex-col items-center rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-500">
                    Transaction Change
                  </div>
                  <div className="mt-3 flex items-center">
                    <GrowthIndicator
                      growthValue={
                        safeData.transaction_count &&
                        safeData.ly_data?.transaction_count
                          ? (safeData.transaction_count /
                              safeData.ly_data.transaction_count) *
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
                    {safeData.transaction_count -
                      (safeData.ly_data?.transaction_count || 0) >
                    0
                      ? "+"
                      : ""}
                    {safeData.transaction_count -
                      (safeData.ly_data?.transaction_count || 0)}{" "}
                    transactions
                  </div>
                </div>
              </div>

              {/* Secondary metrics - Bottom section */}
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* AUR comparison */}
                <div className="flex flex-col rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">
                      <i className="pi pi-dollar mr-2 text-green-500"></i>
                      Average Unit Retail (AUR)
                    </div>
                    <GrowthIndicator
                      growthValue={
                        safeData.aur && safeData.ly_data?.aur
                          ? (safeData.aur / safeData.ly_data.aur) * 100 - 100
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
                        {formatNumberToIDR(safeData.aur)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                      <div className="text-xs text-gray-500">Last Year</div>
                      <div className="text-lg font-semibold">
                        {formatNumberToIDR(safeData.ly_data?.aur || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discount comparison */}
                <div className="flex flex-col rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">
                      <i className="pi pi-tag mr-2 text-yellow-500"></i>
                      Discount Amount
                    </div>
                    <GrowthIndicator
                      growthValue={
                        safeData.discounted_amt &&
                        safeData.ly_data?.discounted_amt
                          ? (safeData.discounted_amt /
                              safeData.ly_data.discounted_amt) *
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
                        {formatNumberToIDR(safeData.discounted_amt)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                      <div className="text-xs text-gray-500">Last Year</div>
                      <div className="text-lg font-semibold">
                        {formatNumberToIDR(
                          safeData.ly_data?.discounted_amt || 0,
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Standard view (no year-over-year comparison)
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Qty Sold
                </div>
                <div className="text-2xl font-bold">{safeData.sale_qty}</div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Gross Sales
                </div>
                <div className="text-2xl font-bold">
                  {formatNumberToIDR(safeData.gross_sales)}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 shadow-sm dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-500">
                  Discount Amount
                </div>
                <div className="text-xl font-bold">
                  {formatNumberToIDR(safeData.discounted_amt)}
                </div>
              </div>
            </div>
            {/* 
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    {safeData.transaction_count}
                  </div>
                  <div className="text-sm text-gray-500">
                    Avg.{" "}
                    {(
                      safeData.transaction_count /
                      (safeData.days_with_sales || 1)
                    ).toFixed(1)}{" "}
                    per day
                  </div>
                </div>
              </div> */}

              <div className="rounded-lg bg-green-50 p-4 shadow-sm dark:bg-green-900/20">
                <div className="text-sm font-medium text-gray-500">
                  Net Before Tax
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {formatNumberToIDR(safeData.nett_sales)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-indigo-50 p-4 shadow-sm dark:bg-indigo-900/20">
                <div className="text-sm font-medium text-gray-500">
                  Net After Tax
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {formatNumberToIDR(safeData.nett_sales_after_tax)}
                  </div>
                  {/* <div className="text-sm text-gray-500">
                    {safeData.nett_sales > 0
                      ? `${((safeData.nett_sales_after_tax / safeData.nett_sales) * 100).toFixed(1)}% of net`
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

export default MtdSummary;
