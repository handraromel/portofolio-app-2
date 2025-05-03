import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
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

// Create view options interface
interface ViewOption {
  label: string;
  value: number;
  icon: string;
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

  // Define view options for dropdown
  const viewOptions: ViewOption[] = [
    { label: "Standard View (TY)", value: 0, icon: "pi pi-table" },
    {
      label: "Year-over-Year (LY)",
      value: 1,
      icon: "pi pi-chart-line",
    },
  ];

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

    const itemsPerPage = dailyReportParams.per_page;
    const currentPage = dailySalesSummary?.current_page || 1;

    return (currentPage - 1) * itemsPerPage + index + 1;
  };

  const getStandardColumns = (): ColumnDef<BrandSalesData>[] => {
    return [
      {
        header: "No",
        body: indexTemplate,
      },
      {
        header: "Department",
        body: (rowData) => `${rowData.brand_id} - ${rowData.brand_name}`,
      },
      {
        field: "gross_sales",
        header: "Gross Sales",
        body: (rowData) => formatNumberToIDR(rowData.gross_sales),
      },
      {
        field: "discounted_amt",
        header: "Discount",
        body: (rowData) => formatNumberToIDR(rowData.discounted_amt),
      },
      {
        field: "sale_amt",
        header: "Sale Amount",
        body: (rowData) => formatNumberToIDR(rowData.sale_amt),
      },
      {
        field: "sale_qty",
        header: "Quantity",
      },
      // {
      //   field: "nett_sales",
      //   header: "Net Sales",
      //   body: (rowData) => formatNumberToIDR(rowData.nett_sales),
      //   sortable: true,
      // },
      // {
      //   field: "tax_amount",
      //   header: "Tax Amount",
      //   body: (rowData) => formatNumberToIDR(rowData.tax_amount),
      //   sortable: true,
      // },
      {
        field: "nett_sales_after_tax",
        header: "Net After Tax",
        body: (rowData) => formatNumberToIDR(rowData.nett_sales_after_tax),
      },
      // {
      //   field: "transaction_count",
      //   header: "Transactions",
      //   sortable: true,
      // },
    ];
  };

  // YoY comparison columns
  const getComparisonColumns = (): ColumnDef<BrandSalesData>[] => {
    return [
      {
        header: "No",
        body: indexTemplate,
      },
      {
        header: "Department",
        body: (rowData) => `${rowData.brand_id} - ${rowData.brand_name}`,
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
      },
      {
        header: "Quantity (LY)",
        body: (rowData) => (rowData.ly_data ? rowData.ly_data.sale_qty : "-"),
      },
      {
        header: "Sales Amount (LY)",
        body: (rowData) =>
          rowData.ly_data ? formatNumberToIDR(rowData.ly_data.sale_amt) : "-",
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
      },
    ];
  };

  const columns =
    activeComparisonTab === 0 ? getStandardColumns() : getComparisonColumns();

  const viewOptionTemplate = (option: ViewOption) => {
    if (!option) {
      return <span className="flex h-full items-center">Select View</span>;
    }
    return (
      <div className="flex h-full items-center gap-2 text-sm">
        <i className={`${option.icon} flex items-center`}></i>
        <span className="flex items-center">{option.label}</span>
      </div>
    );
  };

  return (
    <div className="px-2">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-4">
          <div className="flex flex-wrap gap-2">
            <Dropdown
              id="view-selector"
              value={activeComparisonTab}
              options={viewOptions}
              onChange={(e) => setActiveComparisonTab(e.value)}
              optionLabel="label"
              placeholder="Select View"
              className="h-[2.3rem] w-72"
              valueTemplate={viewOptionTemplate}
              itemTemplate={viewOptionTemplate}
            />
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

        <Table
          title="Daily Sales by Brand"
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
    </div>
  );
};

export default DailySales;
