import React, { useState } from "react";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import { formatNumberToIDR } from "@/utils/formatCurrency";
import { useSale } from "@/actions/useSale";
import { FilterData } from "@/types/sale";
import Table, { ColumnDef } from "@/components/Common/Table";
import Filter from "../Modal/Filter";
import DailySummary from "../Modal/DailySummary";
import { useModal } from "@/hooks";
import GrowthIndicator from "@/components/Pages/Sale/Components/GrowthIndicator";

interface DailySalesProps {
  onRefresh: () => void;
}

interface BrandSalesData {
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
    alias: string | null;
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
  ly_data?: {
    sale_qty: number;
    sale_amt: number;
    discounted_amt: number;
    gross_sales: number;
    nett_sales: number;
    tax_amount: number;
    nett_sales_after_tax: number;
    transaction_count: number;
  } | null;
  growth_amt?: number | null;
  growth_pct?: number | null;
}

const DailySales: React.FC<DailySalesProps> = ({ onRefresh }) => {
  const {
    dailySalesSummary,
    isDailyReportLoading,
    fetchDailySales,
    dailyReportParams,
  } = useSale();

  const filterModal = useModal();
  const summaryModal = useModal();

  const [activeComparisonTab, setActiveComparisonTab] = useState<number>(0);

  const handleFilterApply = (filters: FilterData) => {
    const { date, brand_id, group_id, division_id, category_id } = filters;

    fetchDailySales({
      date,
      brand_id,
      group_id,
      division_id,
      category_id,
    });

    filterModal.close();
  };

  const indexTemplate = (rowData: BrandSalesData) => {
    const index =
      dailySalesSummary?.brands.findIndex((item) => item === rowData) ?? -1;
    return index + 1;
  };

  const getStandardColumns = (): ColumnDef<BrandSalesData>[] => {
    return [
      {
        header: "No",
        body: indexTemplate,
        style: { width: "60px", textAlign: "center" },
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
        field: "tax_amount",
        header: "Tax Amount",
        body: (rowData) => formatNumberToIDR(rowData.tax_amount),
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
    ];
  };

  // YoY comparison columns
  const getComparisonColumns = (): ColumnDef<BrandSalesData>[] => {
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
        <h2 className="text-xl font-semibold">Daily Sales by Brand</h2>
        <div className="flex gap-2">
          <Button
            icon="pi pi-chart-bar"
            label="Summary"
            className="p-button-info p-button-outlined"
            onClick={summaryModal.open}
            disabled={!dailySalesSummary}
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

      <TabView
        activeIndex={activeComparisonTab}
        onTabChange={(e) => setActiveComparisonTab(e.index)}
        className="border-none"
        pt={{
          root: { className: "border-0" },
          nav: {
            className: "flex flex-row flex-nowrap border-0 mb-8",
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
        <TabPanel header="Standard View (TY)">
          <div className="mt-4 text-sm text-gray-500">
            Standard daily sales metrics by brand
          </div>
        </TabPanel>
        <TabPanel header="Year-over-Year Comparison (LY)">
          <div className="mt-4 text-sm text-gray-500">
            Comparing current sales with the same date last year (
            {dailySalesSummary?.last_year_date
              ? new Date(dailySalesSummary.last_year_date).toLocaleDateString()
              : ""}
            )
          </div>
        </TabPanel>
      </TabView>

      <Table
        title=""
        data={dailySalesSummary?.brands || []}
        columns={columns}
        loading={isDailyReportLoading}
        dataKey="brand_id"
        hideSearch
        paginator={{
          currentPage: dailySalesSummary?.current_page || 1,
          totalPages: dailySalesSummary?.pages || 1,
          onPageChange: (page) => {
            fetchDailySales({
              ...dailyReportParams,
              page,
            });
          },
          rows: dailyReportParams.per_page,
          onRowsPerPageChange: (rows) => {
            fetchDailySales({
              ...dailyReportParams,
              per_page: rows,
              page: 1,
            });
          },
        }}
        totalRecords={dailySalesSummary?.total_records}
      />

      <Filter
        visible={filterModal.isOpen}
        onHide={filterModal.close}
        onApply={handleFilterApply}
        currentFilters={{
          ...dailyReportParams,
          date: dailyReportParams.date || undefined,
        }}
        filterType="daily"
      />

      <DailySummary
        visible={summaryModal.isOpen}
        onHide={summaryModal.close}
        summaryData={dailySalesSummary || null}
        showYoY={activeComparisonTab === 1}
      />
    </div>
  );
};

export default DailySales;
