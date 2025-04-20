import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
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
  aur: number;
  ly_data?: MtdYearOverYearData | null;
  growth_amt?: number | null;
  growth_pct?: number | null;
}

interface ViewOption {
  label: string;
  value: number;
  icon: string;
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
      },
      {
        header: "Department",
        body: (rowData) => `${rowData.brand_id} - ${rowData.brand_name}`,
      },
      {
        field: "sale_qty",
        header: "Quantity",
      },
      {
        field: "sale_amt",
        header: "Sale Amount",
        body: (rowData) => formatNumberToIDR(rowData.sale_amt),
      },
      {
        field: "discounted_amt",
        header: "Discount",
        body: (rowData) => formatNumberToIDR(rowData.discounted_amt),
      },
      {
        field: "gross_sales",
        header: "Gross Sales",
        body: (rowData) => formatNumberToIDR(rowData.gross_sales),
      },
      // {
      //   field: "nett_sales",
      //   header: "Net Sales",
      //   body: (rowData) => formatNumberToIDR(rowData.nett_sales),
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
      // {
      //   field: "sales_coverage",
      //   header: "Coverage",
      //   body: (rowData) => `${rowData.sales_coverage.toFixed(1)}%`,
      //   sortable: true,
      // },
      {
        field: "aur",
        header: "AUR",
        body: (rowData) => formatNumberToIDR(rowData.aur),
      },
    ];
  };

  const getComparisonColumns = (): ColumnDef<BrandMtdSalesData>[] => {
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
      return <span>Select View</span>;
    }
    return (
      <div className="flex items-center gap-2">
        <i className={option.icon}></i>
        <span>{option.label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Month-to-Date Sales by Brand</h2>
        <div className="flex flex-wrap gap-2">
          <Dropdown
            id="view-selector"
            value={activeComparisonTab}
            options={viewOptions}
            onChange={(e) => setActiveComparisonTab(e.value)}
            optionLabel="label"
            placeholder="Select View"
            className="w-72"
            valueTemplate={viewOptionTemplate}
            itemTemplate={viewOptionTemplate}
          />
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
