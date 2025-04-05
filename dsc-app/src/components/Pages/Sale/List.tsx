import React, { useCallback, useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { formatDate } from "@/utils/formatDate";
import { Sale } from "@/types/sale";
import { Confirmation, ColumnDef } from "@/components/Common";
import { useModal, usePermission } from "@/hooks";
import { useToast } from "@/context/Toast";
import { useSale } from "@/actions/useSale";
import Table from "@/components/Common/Table";
import { FilterData } from "@/types/sale";
import DailySales from "./Reports/DailySales";
import MtdSales from "./Reports/MtdSales";
import Filter from "./Modal/Filter";
import Detail from "./Modal/Detail";
import Submission from "./Modal/Submission";

const SaleList: React.FC = () => {
  const { canEdit, canDelete } = usePermission();
  const {
    sales,
    pagination,
    isLoading,
    error,
    fetchSales,
    deleteSale,
    searchSales,
    changePage,
    changePerPage,
    changeDateRange,
    changeProductFilters,
    salesQuery,
    filters,
    fetchDailySales,
    fetchMtdSales,
    activeTab,
    setActiveTab,
  } = useSale();

  const { showWarning, showError } = useToast();
  const responseMsg = salesQuery.data?.msg;
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [triggerDelete, setTriggerDelete] = useState(false);

  // Modals
  const filterModal = useModal();
  const detailModal = useModal();
  const submissionModal = useModal();

  const handleFetchData = (e: { index: number }) => {
    setActiveTab(e.index);

    if (e.index === 0 && (!salesQuery.data || salesQuery.isStale)) {
      fetchSales();
    }
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedSale) {
      try {
        await deleteSale(selectedSale.uuid);
        showWarning(responseMsg || "Sale record deleted successfully");
        setTriggerDelete(false);
      } catch {
        showError(responseMsg || "Failed to delete sale record");
      }
    }
  }, [selectedSale, deleteSale, responseMsg, showWarning, showError]);

  const handleFilterApply = (filterData: FilterData) => {
    // Extract date range if available
    const {
      start_date,
      end_date,
      brand_id,
      group_id,
      division_id,
      category_id,
    } = filterData;

    // Apply date range filter if provided
    if (start_date || end_date) {
      changeDateRange(start_date, end_date);
    }

    // Apply product filters if provided
    changeProductFilters(brand_id, group_id, division_id, category_id);
  };

  const handleView = (sale: Sale) => {
    setSelectedSale(sale);
    detailModal.open();
  };

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    submissionModal.open();
  };

  const handleAdd = () => {
    setSelectedSale(null);
    submissionModal.open();
  };

  const handleRefresh = useCallback(() => {
    if (activeTab === 0) {
      fetchSales();
    } else if (activeTab === 1) {
      fetchDailySales();
    } else if (activeTab === 2) {
      fetchMtdSales();
    }
  }, [fetchSales, fetchDailySales, fetchMtdSales, activeTab]);

  const indexTemplate = (rowData: Sale) => {
    const index = sales.findIndex((sale) => sale.uuid === rowData.uuid);
    return (
      (pagination.currentPage || 1) * (filters.per_page || 10) -
      (filters.per_page || 10) +
      index +
      1
    );
  };

  const columns: ColumnDef<Sale>[] = [
    {
      header: "No",
      body: indexTemplate,
      width: "30px",
    },
    {
      header: "Brand",
      body: (rowData: Sale) => rowData.brand.name,
      sortable: true,
      width: "200px",
    },
    {
      header: "Division",
      body: (rowData: Sale) => rowData.division.name,
      sortable: true,
      width: "200px",
    },
    {
      header: "Group",
      body: (rowData: Sale) => rowData.group.name,
      sortable: true,
      width: "200px",
    },
    {
      header: "Category",
      body: (rowData: Sale) => rowData.category.name,
      sortable: true,
      width: "200px",
    },
    {
      field: "description",
      header: "Description",
      body: (rowData: Sale) => rowData.description || "-",
      sortable: true,
      width: "200px",
    },
    {
      field: "sku",
      header: "SKU",
      body: (rowData: Sale) => rowData.sku || "-",
      sortable: true,
      width: "200px",
    },
    {
      field: "item_no",
      header: "Item No",
      body: (rowData: Sale) => rowData.item_no || "-",
      sortable: true,
      width: "200px",
    },
    {
      field: "input_date",
      header: "Input Date",
      body: (rowData: Sale) =>
        formatDate(rowData.input_date, { format: "DD MMM YYYY" }),
      sortable: true,
      width: "200px",
    },
    {
      field: "sale_qty",
      header: "Quantity",
      sortable: true,
      width: "200px",
    },
    {
      field: "sale_amt",
      header: "Sale Amount",
      body: (rowData: Sale) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "IDR",
        }).format(rowData.sale_amt),
      sortable: true,
      width: "200px",
    },
    {
      field: "gross_sales",
      header: "Gross Sales",
      body: (rowData: Sale) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "IDR",
        }).format(rowData.gross_sales),
      sortable: true,
      width: "200px",
    },
    {
      field: "discounted_amt",
      header: "Discount Amount",
      body: (rowData: Sale) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "IDR",
        }).format(rowData.discounted_amt),
      sortable: true,
      width: "200px",
    },
    {
      field: "nett_sales",
      header: "Net Sales",
      body: (rowData: Sale) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "IDR",
        }).format(rowData.nett_sales),
      sortable: true,
      width: "200px",
    },
    {
      field: "tax_amount",
      header: "Tax Amount",
      body: (rowData: Sale) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "IDR",
        }).format(rowData.tax_amount),
      sortable: true,
      width: "200px",
    },
    {
      field: "nett_sales_after_tax",
      header: "Net After Tax",
      body: (rowData: Sale) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "IDR",
        }).format(rowData.nett_sales_after_tax),
      sortable: true,
      width: "200px",
    },
  ];

  React.useEffect(() => {
    if (error) {
      showError(error instanceof Error ? error.message : "An error occurred");
    }
  }, [error, showError]);

  return (
    <>
      <TabView
        activeIndex={activeTab}
        onTabChange={handleFetchData}
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
        <TabPanel header="Sales List">
          <div className="p-2">
            <Table
              data={sales}
              columns={columns}
              title="Sales Records"
              loading={isLoading}
              globalSearchFields={["sku", "item_no", "description"]}
              actionButton={{
                label: "Add Sale",
                onClick: handleAdd,
                visible: canEdit(),
              }}
              otherActions={[
                {
                  icon: "pi pi-refresh",
                  tooltip: "Refresh list",
                  severity: "info",
                  onClick: handleRefresh,
                },
                {
                  icon: "pi pi-filter",
                  tooltip: "Advanced filters",
                  severity: "help",
                  onClick: filterModal.open,
                },
              ]}
              totalRecords={pagination.totalRecords}
              paginator={{
                currentPage: pagination.currentPage || 1,
                totalPages: pagination.totalPages || 1,
                onPageChange: changePage,
                rows: filters.per_page,
                onRowsPerPageChange: changePerPage,
              }}
              onSearch={searchSales}
              actions={{
                header: "Actions",
                buttons: [
                  {
                    icon: "pi pi-pencil",
                    tooltip: "Edit",
                    severity: "success",
                    onClick: handleEdit,
                    visible: () => canEdit(),
                  },
                  {
                    icon: "pi pi-trash",
                    tooltip: "Delete",
                    severity: "danger",
                    onClick: (rowData) => {
                      setSelectedSale(rowData);
                      setTriggerDelete(true);
                    },
                    visible: () => canDelete(),
                  },
                  {
                    icon: "pi pi-eye",
                    tooltip: "View",
                    severity: "info",
                    onClick: handleView,
                    visible: () => true,
                  },
                ],
              }}
            />
          </div>
        </TabPanel>
        <TabPanel header="Daily Sales">
          <DailySales onRefresh={handleRefresh} />
        </TabPanel>
        <TabPanel header="MTD Sales">
          <MtdSales onRefresh={handleRefresh} />
        </TabPanel>
      </TabView>

      {/* Modals */}
      <Filter
        visible={filterModal.isOpen}
        onHide={filterModal.close}
        onApply={handleFilterApply}
        currentFilters={filters}
        filterType="list"
      />

      <Detail
        visible={detailModal.isOpen}
        onHide={detailModal.close}
        sale={selectedSale}
      />

      <Submission
        visible={submissionModal.isOpen}
        onHide={submissionModal.close}
        sale={selectedSale}
      />

      <Confirmation
        visible={triggerDelete}
        onHide={() => setTriggerDelete(false)}
        onConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete this sale record from ${selectedSale?.input_date}?`}
        header="Delete Sale Record"
        icon="pi pi-exclamation-triangle"
        acceptLabel="Delete"
        rejectLabel="Cancel"
      />
    </>
  );
};

export default SaleList;
