import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useSale } from "@/actions/useSale";
import { useModal } from "@/hooks";
import { formatDate } from "@/utils/formatDate";
import Filter from "../Modal/Filter";
import { DailySalesSummary, FilterData } from "@/types/sale";

interface DailySalesProps {
  onRefresh?: () => void;
}

const DailySales: React.FC<DailySalesProps> = ({ onRefresh }) => {
  const { dailySalesSummary, fetchDailySales, dailyReportParams } = useSale();

  const [summary, setSummary] = useState<DailySalesSummary | null>(null);
  const filterModal = useModal();

  useEffect(() => {
    if (dailySalesSummary) {
      setSummary(dailySalesSummary);
    }
  }, [dailySalesSummary]);

  const handleFilterApply = (filters: FilterData) => {
    fetchDailySales(filters);
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

  const lastYearDate = summary?.date
    ? formatDate(
        new Date(
          new Date(summary.date).setFullYear(
            new Date(summary.date).getFullYear() - 1,
          ),
        ),
      )
    : "";

  // Format date for display
  const formattedDate = summary?.date
    ? formatDate(summary.date)
    : formatDate(new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
        <h2 className="text-xl font-bold">
          Daily Sales Report: {formattedDate}
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
          <Card
            title="This Year"
            subTitle={formattedDate}
            className="shadow-sm"
          >
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
            </DataTable>
          </Card>

          {/* Last Year Card */}
          <Card title="Last Year" subTitle={lastYearDate} className="shadow-sm">
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
            </DataTable>
          </Card>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-900">
          <p className="text-lg text-gray-500">
            No daily sales data available.
          </p>
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
          ...dailyReportParams,
          date: dailyReportParams.date ?? undefined,
        }}
        filterType="daily"
      />
    </div>
  );
};

export default DailySales;
