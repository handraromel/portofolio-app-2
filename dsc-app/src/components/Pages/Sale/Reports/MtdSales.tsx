import React, { useState } from "react";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import { formatNumberToIDR } from "@/utils/formatCurrency";
import { useSale } from "@/actions/useSale";
import { FilterData, MtdYearOverYearData } from "@/types/sale";
import Table, { ColumnDef } from "@/components/Common/Table";
import Filter from "../Modal/Filter";
import MtdSummary from "../Modal/MtdSummary";
import { useModal } from "@/hooks";
import GrowthIndicator from "../Components/GrowthIndicator";

interface MtdSalesProps {
  onRefresh: () => void;
}

interface BrandMtdSalesData {
  brand_id: string;
  brand_name: string;
  group: {
    id: string;
    uuid: string;
    name: string;
  };
  division: {
    uuid: string;
    name: string;
    alias: string;
  };
  category: {
    uuid: string;
    name: string;
  };
  sale_qty: number;
  sale_amt: number;
  discounted_amt: number;
  gross_sales: number;
  nett_sales: number;
  tax_rate: number;
  tax_amount: number;
  nett_sales_after_tax: number;
  transaction_count: number;
  from_date: string;
  to_date: string;
  days_with_sales: number;
  total_days: number;
  sales_coverage: number;
  daily_avg_sales: number;
  ly_data?: MtdYearOverYearData | null;
  growth_amt?: number | null;
  growth_pct?: number | null;
}

const MtdSales: React.FC<MtdSalesProps> = ({ onRefresh }) => {
  const {
    mtdSalesSummary,
    isMtdReportLoading,
    fetchMtdSales,
    mtdReportParams,
  } = useSale();

  const filterModal = useModal();
  const summaryModal = useModal();

  const [activeComparisonTab, setActiveComparisonTab] = useState<number>(0);

  const handleFilterApply = (filters: FilterData) => {
    const { date, brand_id, group_id, division_id, category_id } = filters;

    fetchMtdSales({
      date,
      brand_id,
      group_id,
      division_id,
      category_id,
    });

    filterModal.close();
  };

  const indexTemplate = (rowData: BrandMtdSalesData) => {
    const index =
      mtdSalesSummary?.brands.findIndex((item) => item === rowData) ?? -1;
    return index + 1;
  };

  const getStandardColumns = (): ColumnDef<BrandMtdSalesData>[] => {
    return [
      {
        header: "No",
        body: indexTemplate,
        style: { textAlign: "center" },
      },
      {
        header: "Department",
        body: (rowData) => `${rowData.brand_id} - ${rowData.brand_name}`,
        sortable: true,
      },
      {
        field: "sale_qty",
        header: "Quantity",
        sortable: true,
      },
      {
        field: "sale_amt",
        header: "Sale Amount",
        body: (rowData) => formatNumberToIDR(rowData.sale_amt),
        sortable: true,
      },
      {
        field: "discounted_amt",
        header: "Discount",
        body: (rowData) => formatNumberToIDR(rowData.discounted_amt),
        sortable: true,
      },
      {
        field: "gross_sales",
        header: "Gross Sales",
        body: (rowData) => formatNumberToIDR(rowData.gross_sales),
        sortable: true,
      },
      {
        field: "nett_sales",
        header: "Net Sales",
        body: (rowData) => formatNumberToIDR(rowData.nett_sales),
        sortable: true,
      },
      {
        field: "nett_sales_after_tax",
        header: "Net After Tax",
        body: (rowData) => formatNumberToIDR(rowData.nett_sales_after_tax),
        sortable: true,
      },
      {
        field: "transaction_count",
        header: "Transactions",
        sortable: true,
      },
      // {
      //   field: "sales_coverage",
      //   header: "Coverage",
      //   body: (rowData) => `${rowData.sales_coverage.toFixed(1)}%`,
      //   sortable: true,
      // },
      {
        field: "daily_avg_sales",
        header: "Daily Avg",
        body: (rowData) => formatNumberToIDR(rowData.daily_avg_sales),
        sortable: true,
      },
    ];
  };

  const getComparisonColumns = (): ColumnDef<BrandMtdSalesData>[] => {
    return [
      {
        header: "No",
        body: indexTemplate,
        style: { textAlign: "center" },
      },
      {
        header: "Department",
        body: (rowData) => `${rowData.brand_id} - ${rowData.brand_name}`,
        sortable: true,
      },
      {
        header: "Quantity (TY)",
        field: "sale_qty",
        body: (rowData) => (
          <div className="flex items-center justify-between">
            <span>{rowData.sale_qty}</span>
            {rowData.ly_data && (
              <GrowthIndicator
                growthValue={rowData.growth_pct ?? null}
                isPercentage={true}
                size="sm"
                className="ml-2"
              />
            )}
          </div>
        ),
        sortable: true,
      },
      {
        header: "Sales Amount (TY)",
        body: (rowData) => (
          <div className="flex items-center justify-between">
            <span>{formatNumberToIDR(rowData.sale_amt)}</span>
            {rowData.ly_data && (
              <GrowthIndicator
                growthValue={rowData.growth_pct ?? null}
                isPercentage={true}
                size="sm"
                className="ml-2"
              />
            )}
          </div>
        ),
        sortable: true,
      },
      {
        header: "Quantity (LY)",
        body: (rowData) => (rowData.ly_data ? rowData.ly_data.sale_qty : "-"),
        sortable: true,
      },
      {
        header: "Sales Amount (LY)",
        body: (rowData) =>
          rowData.ly_data ? formatNumberToIDR(rowData.ly_data.sale_amt) : "-",
        sortable: true,
      },
      // {
      //   header: "Coverage (TY)",
      //   body: (rowData) => `${rowData.sales_coverage.toFixed(1)}%`,
      //   sortable: true,
      // },
      // {
      //   header: "Coverage (LY)",
      //   body: (rowData) =>
      //     rowData.ly_data
      //       ? `${rowData.ly_data.sales_coverage.toFixed(1)}%`
      //       : "-",
      //   sortable: true,
      // },
      {
        header: "Growth (Amt)",
        body: (rowData) => (
          <GrowthIndicator
            growthValue={rowData.growth_amt ?? null}
            colorOnly={false}
            size="md"
          />
        ),
        sortable: true,
      },
      {
        header: "Growth (%)",
        body: (rowData) => (
          <GrowthIndicator
            growthValue={rowData.growth_pct ?? null}
            isPercentage={true}
            colorOnly={false}
            size="md"
          />
        ),
        sortable: true,
      },
    ];
  };

  const columns =
    activeComparisonTab === 0 ? getStandardColumns() : getComparisonColumns();

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Month-to-Date Sales by Brand</h2>
        <div className="flex gap-2">
          <Button
            icon="pi pi-chart-bar"
            label="Summary"
            className="p-button-info p-button-outlined"
            onClick={summaryModal.open}
            disabled={!mtdSalesSummary}
          />
          <Button
            icon="pi pi-filter"
            label="Filter"
            className="p-button-outlined"
            onClick={filterModal.open}
          />
          <Button
            icon="pi pi-refresh"
            className="p-button-outlined"
            onClick={() => onRefresh()}
            tooltip="Refresh Data"
            tooltipOptions={{ position: "top" }}
          />
        </div>
      </div>

      {/* Add TabView for comparison toggle */}
      <TabView
        activeIndex={activeComparisonTab}
        onTabChange={(e) => setActiveComparisonTab(e.index)}
        className="border-none"
        pt={{
          root: { className: "border-0" },
          nav: {
            className: "flex flex-row flex-nowrap border-0 -mb-8",
            style: { border: "none", borderBottom: "none" },
          },
          navContainer: {
            className: "border-0",
            style: { borderBottom: "none" },
          },
          navContent: { className: "border-0" },
          panelContainer: { className: "border-0" },
          inkbar: {
            style: {
              display: "none",
            },
          },
        }}
      >
        <TabPanel header="Standard View (TY)" />
        <TabPanel header="Year-over-Year Comparison (LY)" />
      </TabView>

      <Table
        title=""
        data={mtdSalesSummary?.brands || []}
        columns={columns}
        loading={isMtdReportLoading}
        hideSearch
        dataKey="brand_id"
        paginator={{
          currentPage: mtdSalesSummary?.current_page || 1,
          totalPages: mtdSalesSummary?.pages || 1,
          onPageChange: (page) => {
            fetchMtdSales({
              ...mtdReportParams,
              page,
            });
          },
          rows: mtdReportParams.per_page,
          onRowsPerPageChange: (rows) => {
            fetchMtdSales({
              ...mtdReportParams,
              per_page: rows,
              page: 1,
            });
          },
        }}
        totalRecords={mtdSalesSummary?.total_records}
      />

      <Filter
        visible={filterModal.isOpen}
        onHide={filterModal.close}
        onApply={handleFilterApply}
        currentFilters={{
          ...mtdReportParams,
          date: mtdReportParams.date || undefined,
        }}
        filterType="mtd"
      />

      <MtdSummary
        visible={summaryModal.isOpen}
        onHide={summaryModal.close}
        summaryData={mtdSalesSummary || null}
        showYoY={activeComparisonTab === 1}
      />
    </div>
  );
};

export default MtdSales;
