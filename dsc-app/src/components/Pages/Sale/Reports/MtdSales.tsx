import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useSale } from "@/actions/useSale";
import { useModal } from "@/hooks";
import Filter from "../Modal/Filter";
import { formatDate } from "@/utils/formatDate";
import { MtdSalesSummary, FilterData } from "@/types/sale";

interface MtdSalesProps {
  onRefresh?: () => void;
}

const MtdSales: React.FC<MtdSalesProps> = ({ onRefresh }) => {
  const { mtdSalesSummary, fetchMtdSales, mtdReportParams } = useSale();

  const [summary, setSummary] = useState<MtdSalesSummary | null>(null);
  const filterModal = useModal();

  useEffect(() => {
    if (mtdSalesSummary) {
      setSummary(mtdSalesSummary);
    }
  }, [mtdSalesSummary]);

  const handleFilterApply = (filters: FilterData) => {
    fetchMtdSales(filters);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const dateRange = summary
    ? `${formatDate(summary.from_date)} - ${formatDate(summary.to_date)}`
    : formatDate(new Date(), { format: "MMMM yyyy" });

  // Format month display for header
  const monthDisplay = summary?.month
    ? formatDate(new Date(summary.month + "-01"), { format: "MMMM yyyy" })
    : formatDate(new Date(), { format: "MMMM yyyy" });

  // Calculate last year date range
  const lastYearFromDate = summary
    ? formatDate(
        new Date(
          new Date(summary.from_date).setFullYear(
            new Date(summary.from_date).getFullYear() - 1,
          ),
        ),
      )
    : "";

  const lastYearToDate = summary
    ? formatDate(
        new Date(
          new Date(summary.to_date).setFullYear(
            new Date(summary.to_date).getFullYear() - 1,
          ),
        ),
      )
    : "";

  const lastYearDateRange = summary
    ? `${lastYearFromDate} - ${lastYearToDate}`
    : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
        <h2 className="text-xl font-bold">
          Month to Date Sales: {monthDisplay}
        </h2>
        <div className="flex gap-2">
          <Button
            icon="pi pi-filter"
            tooltip="Filter"
            tooltipOptions={{ position: "left" }}
            outlined
            size="small"
            onClick={filterModal.open}
          />
          {onRefresh && (
            <Button
              icon="pi pi-refresh"
              tooltip="Refresh"
              tooltipOptions={{ position: "left" }}
              outlined
              size="small"
              onClick={onRefresh}
            />
          )}
        </div>
      </div>

      {summary ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* This Year Card */}
          <Card title="This Year" subTitle={dateRange} className="shadow-sm">
            <DataTable value={[summary.ty]} showGridlines stripedRows>
              <Column field="sale_qty" header="Quantity" />
              <Column
                field="sale_amt"
                header="Sale Amount"
                body={(data) => formatCurrency(data.sale_amt)}
              />
              <Column
                field="discounted_amt"
                header="Discount Amount"
                body={(data) => formatCurrency(data.discounted_amt)}
              />
              <Column
                field="gross_sales"
                header="Gross Sales"
                body={(data) => formatCurrency(data.gross_sales)}
              />
              <Column
                field="nett_sales"
                header="Net Sales"
                body={(data) => formatCurrency(data.nett_sales)}
              />
              <Column
                field="tax_rate"
                header="Tax Rate"
                body={(data) => `${data.tax_rate}%`}
              />
              <Column
                field="tax_amount"
                header="Tax Amount"
                body={(data) => formatCurrency(data.tax_amount)}
              />
              <Column
                field="nett_sales_after_tax"
                header="Net Sales After Tax"
                body={(data) => formatCurrency(data.nett_sales_after_tax)}
              />
              <Column field="transaction_count" header="Transactions" />
              <Column field="days_with_sales" header="Days with Sales" />
              <Column field="total_days" header="Total Days" />
              <Column
                field="sales_coverage"
                header="Sales Coverage"
                body={(data) => formatPercent(data.sales_coverage)}
              />
              <Column
                field="daily_avg_sales"
                header="Daily Avg Sales"
                body={(data) => formatCurrency(data.daily_avg_sales)}
              />
            </DataTable>
          </Card>

          {/* Last Year Card */}
          <Card
            title="Last Year"
            subTitle={lastYearDateRange}
            className="shadow-sm"
          >
            <DataTable value={[summary.ly]} showGridlines stripedRows>
              <Column field="sale_qty" header="Quantity" />
              <Column
                field="sale_amt"
                header="Sale Amount"
                body={(data) => formatCurrency(data.sale_amt)}
              />
              <Column
                field="discounted_amt"
                header="Discount Amount"
                body={(data) => formatCurrency(data.discounted_amt)}
              />
              <Column
                field="gross_sales"
                header="Gross Sales"
                body={(data) => formatCurrency(data.gross_sales)}
              />
              <Column
                field="nett_sales"
                header="Net Sales"
                body={(data) => formatCurrency(data.nett_sales)}
              />
              <Column
                field="tax_rate"
                header="Tax Rate"
                body={(data) => `${data.tax_rate}%`}
              />
              <Column
                field="tax_amount"
                header="Tax Amount"
                body={(data) => formatCurrency(data.tax_amount)}
              />
              <Column
                field="nett_sales_after_tax"
                header="Net Sales After Tax"
                body={(data) => formatCurrency(data.nett_sales_after_tax)}
              />
              <Column field="transaction_count" header="Transactions" />
              <Column field="days_with_sales" header="Days with Sales" />
              <Column field="total_days" header="Total Days" />
              <Column
                field="sales_coverage"
                header="Sales Coverage"
                body={(data) => formatPercent(data.sales_coverage)}
              />
              <Column
                field="daily_avg_sales"
                header="Daily Avg Sales"
                body={(data) => formatCurrency(data.daily_avg_sales)}
              />
            </DataTable>
          </Card>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-900">
          <p className="text-lg text-gray-500">No MTD sales data available.</p>
        </div>
      )}

      {/* YoY Comparison */}
      {summary && (
        <Card title="Year over Year Comparison" className="shadow-sm">
          <DataTable value={[summary.yoy_changes]} showGridlines stripedRows>
            <Column
              field="sale_qty_change"
              header="Quantity Change"
              body={(data) => formatPercent(data.sale_qty_change)}
            />
            <Column
              field="sale_amt_change"
              header="Sale Amount Change"
              body={(data) => formatPercent(data.sale_amt_change)}
            />
            <Column
              field="discounted_amt_change"
              header="Discount Amount Change"
              body={(data) => formatPercent(data.discounted_amt_change)}
            />
            <Column
              field="gross_sales_change"
              header="Gross Sales Change"
              body={(data) => formatPercent(data.gross_sales_change)}
            />
            <Column
              field="nett_sales_change"
              header="Net Sales Change"
              body={(data) => formatPercent(data.nett_sales_change)}
            />
            <Column
              field="nett_sales_after_tax_change"
              header="Net After Tax Change"
              body={(data) => formatPercent(data.nett_sales_after_tax_change)}
            />
            <Column
              field="transaction_count_change"
              header="Transaction Count Change"
              body={(data) => formatPercent(data.transaction_count_change)}
            />
          </DataTable>
        </Card>
      )}

      <Filter
        visible={filterModal.isOpen}
        onHide={filterModal.close}
        onApply={handleFilterApply}
        currentFilters={{
          ...mtdReportParams,
          date: mtdReportParams.date ?? undefined,
        }}
        filterType="mtd"
      />
    </div>
  );
};

export default MtdSales;
