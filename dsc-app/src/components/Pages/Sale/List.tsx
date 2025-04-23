import React, { useCallback, useEffect, useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { formatDate } from "@/utils/formatDate";
import { formatNumberToIDR } from "@/utils/formatCurrency";
import { Sale } from "@/types/sale";
import { Confirmation, ColumnDef } from "@/components/Common";
import { useModal, usePermission, useTableSelection } from "@/hooks";
import { useToast } from "@/context/Toast";
import { useSale } from "@/actions/useSale";
import Table from "@/components/Common/Table";
import { FilterData } from "@/types/sale";
import DailySales from "./Reports/DailySales";
import MtdSales from "./Reports/MtdSales";
import Filter from "./Modal/Filter";
import Detail from "./Modal/Detail";
import Submission from "./Modal/Submission";
import ImportModal from "./Modal/Import";
import { useFileMgmt } from "@/actions/useFileMgmt";

const SaleList: React.FC = () => {
  const { canEdit, canDelete } = usePermission();
  const {
    sales,
    pagination,
    isLoading,
    error,
    fetchSales,
    deleteSale,
    deleteMultipleSales,
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

  const {
    downloadSample,
    exportSales,
    importSales,
    setImportError,
    setImportResult,
    confirmImport,
    cancelImport,
    startIncrementalImport: processAllRecords,
    cancelIncrementalImport,
    isProcessingIncremental,
    isIncrementalCompleted,
    importProgress,
    incrementalImportActive,
    setIncrementalImportActive,
    isDownloading,
    isExporting,
    isImporting,
    importResult,
    isConfirming,
    importError,
  } = useFileMgmt();

  const { showWarning, showError } = useToast();
  const responseMsg = salesQuery.data?.msg;
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [triggerDelete, setTriggerDelete] = useState(false);
  const [triggerBulkDelete, setTriggerBulkDelete] = useState(false);

  // Modals
  const filterModal = useModal();
  const detailModal = useModal();
  const submissionModal = useModal();
  const importModal = useModal();

  const selection = useTableSelection<Sale>({
    idField: "uuid",
    onSelectionChange: (items, current) => {
      if (current) {
        setSelectedSale(current);
      }
    },
  });

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

        const currentTotalRecords = pagination.totalRecords || 0;
        const currentPage = pagination.currentPage || 1;
        const itemsPerPage = filters.per_page || 10;

        if (
          currentPage > 1 &&
          currentTotalRecords - 1 <= (currentPage - 1) * itemsPerPage
        ) {
          changePage(currentPage - 1);
        } else {
          fetchSales();
        }

        showWarning(responseMsg || "Sale record deleted successfully");
        setTriggerDelete(false);
      } catch {
        showError(responseMsg || "Failed to delete sale record");
      }
    }
  }, [
    selectedSale,
    deleteSale,
    responseMsg,
    showWarning,
    showError,
    pagination.totalRecords,
    pagination.currentPage,
    filters.per_page,
    changePage,
    fetchSales,
  ]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selection.selectedItems && selection.selectedItems.length > 0) {
      try {
        const saleIds = selection.selectedItems.map((item) => item.uuid);
        await deleteMultipleSales(saleIds);

        // Refresh the list
        fetchSales();

        // Clear selection
        selection.clearSelection();

        // Show success message
        showWarning(`Successfully deleted ${saleIds.length} sale records`);
        setTriggerBulkDelete(false);
      } catch {
        showError(responseMsg || "Failed to delete selected sale records");
      }
    }
  }, [
    selection.selectedItems,
    deleteMultipleSales,
    fetchSales,
    showWarning,
    showError,
    selection,
  ]);

  const handleBulkDelete = () => {
    if (selection.selectedItems && selection.selectedItems.length > 0) {
      setTriggerBulkDelete(true);
    } else {
      showWarning("Please select at least one record to delete");
    }
  };

  const handleFilterApply = (filterData: FilterData) => {
    const {
      start_date,
      end_date,
      brand_id,
      group_id,
      division_id,
      category_id,
    } = filterData;

    changeDateRange(start_date, end_date);

    changeProductFilters(brand_id, group_id, division_id, category_id);

    fetchSales();
  };

  const handleView = (sale: Sale) => {
    setSelectedSale(sale);
    detailModal.open();
  };

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    selection.selectItem(sale);
    submissionModal.open();
  };

  const handleAdd = () => {
    setSelectedSale(null);
    submissionModal.open();
  };

  const handleDelete = (sale: Sale) => {
    setSelectedSale(sale);
    selection.selectItem(sale);
    setTriggerDelete(true);
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

  const handleExportToExcel = async () => {
    await exportSales("xlsx", filters);
  };

  // const handleExportToCSV = async () => {
  //   await exportSales("csv", filters);
  // };

  const handleImport = async (file: File) => {
    await importSales(file);
  };

  const handleConfirmImport = async () => {
    const success = await confirmImport();
    if (success) {
      importModal.close();
      fetchSales();
    }
  };

  // Handle cancel function
  const handleCancelImport = async () => {
    await cancelImport();
    importModal.close();
  };

  // Clear states function
  const handleClearImportStates = () => {
    setImportResult(null);
    setImportError(null);
  };

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
    },
    {
      header: "Brand",
      body: (rowData: Sale) => `${rowData.brand.id} - ${rowData.brand.name}`,
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      header: "Division",
      body: (rowData: Sale) =>
        `${rowData.division.name}${rowData.division.alias ? ` - ${rowData.division.alias}` : ""}`,
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      header: "Group",
      body: (rowData: Sale) => `${rowData.group.id} - ${rowData.group.name}`,
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      header: "Category",
      body: (rowData: Sale) => rowData.category.name,
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      field: "description",
      header: "Description",
      body: (rowData: Sale) => rowData.description || "-",
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      field: "sku",
      header: "SKU",
      body: (rowData: Sale) => rowData.sku || "-",
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      field: "item_no",
      header: "Item No.",
      body: (rowData: Sale) => rowData.item_no || "-",
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      field: "input_date",
      header: "Input Date",
      body: (rowData: Sale) =>
        formatDate(rowData.input_date, { format: "DD MMM YYYY" }),
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      field: "user",
      header: "Input By",
      body: (rowData: Sale) => rowData.user.name || rowData.user.username,
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      field: "gross_sales",
      header: "Gross Sales",
      body: (rowData: Sale) => formatNumberToIDR(rowData.gross_sales),
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      field: "discounted_amt",
      header: "Discount",
      body: (rowData: Sale) => formatNumberToIDR(rowData.discounted_amt),
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      field: "sale_amt",
      header: "Sale Amount",
      body: (rowData: Sale) => formatNumberToIDR(rowData.sale_amt),
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    {
      field: "sale_qty",
      header: "Quantity",
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
    // {
    //   field: "nett_sales",
    //   header: "Net Sales",
    //   body: (rowData: Sale) => formatNumberToIDR(rowData.nett_sales),
    //   sortable: true,
    // },
    // {
    //   field: "tax_amount",
    //   header: "Tax Amount",
    //   body: (rowData: Sale) => formatNumberToIDR(rowData.tax_amount),
    //   sortable: true,
    // },
    {
      field: "nett_sales_after_tax",
      header: "Net After Tax",
      body: (rowData: Sale) => formatNumberToIDR(rowData.nett_sales_after_tax),
      sortable: true,
      style: { whiteSpace: "nowrap", padding: "0 20px" },
    },
  ];

  useEffect(() => {
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
          root: { className: "border-0 w-full h-10" },
          nav: {
            className:
              "flex flex-row border-0 overflow-x-auto overflow-y-hidden -mb-5",
            style: {
              border: "none",
            },
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
        <TabPanel
          header={
            <div className="ml-[35px] border-b-2 whitespace-nowrap">
              Sales List
            </div>
          }
        >
          <div className="p-2">
            <Table
              data={sales}
              columns={columns}
              title="Sales Records"
              loading={isLoading}
              key="uuid"
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
                {
                  icon: "pi pi-upload",
                  tooltip: "Import sales",
                  severity: "success",
                  onClick: importModal.open,
                  disabled: isImporting || isExporting,
                },
                {
                  icon: isExporting
                    ? "pi pi-spin pi-spinner"
                    : "pi pi-file-excel",
                  tooltip: isExporting ? "Exporting..." : "Export to Excel",
                  severity: "success",
                  onClick: handleExportToExcel,
                  disabled: isExporting || isImporting,
                },
                // {
                //   icon: isExporting ? "pi pi-spin pi-spinner" : "pi pi-file",
                //   tooltip: isExporting ? "Exporting..." : "Export to CSV",
                //   severity: "success",
                //   onClick: handleExportToCSV,
                //   disabled: isExporting || isImporting,
                // },
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
                align: "center",
                buttons: [
                  {
                    icon: "pi pi-pencil",
                    tooltip: "Edit",
                    severity: "success",
                    onClick: handleEdit,
                    visible: () => !!canEdit(),
                  },
                  {
                    icon: "pi pi-trash",
                    tooltip: "Delete",
                    severity: "danger",
                    onClick: handleDelete,
                    visible: () => !!canDelete(),
                  },
                  {
                    icon: "pi pi-eye",
                    tooltip: "View",
                    severity: "info",
                    onClick: handleView,
                  },
                ],
              }}
              bulkActions={[
                {
                  label: "Delete Selected Items",
                  icon: "pi pi-trash",
                  severity: "danger",
                  onClick: handleBulkDelete,
                  visible: () =>
                    !!canDelete() &&
                    !!selection.selectedItems &&
                    selection.selectedItems.length > 0,
                },
              ]}
              selectionMode="multiple"
              selectedItem={selection.selectedItems}
              onSelectionChange={selection.handleSelectionChange}
            />
          </div>
        </TabPanel>
        <TabPanel
          header={
            <div className="ml-[35px] border-b-2 whitespace-nowrap">
              Daily Sales
            </div>
          }
        >
          <DailySales onRefresh={handleRefresh} />
        </TabPanel>
        <TabPanel
          header={
            <div className="ml-[35px] border-b-2 whitespace-nowrap">
              MTD Sales
            </div>
          }
        >
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
        message={`Are you sure you want to delete this sale record from ${formatDate(selectedSale?.input_date, { format: "DD MMM yy" })}?`}
        header="Delete Sale Record"
        icon="pi pi-exclamation-triangle"
        acceptLabel="Delete"
        rejectLabel="Cancel"
      />

      <Confirmation
        visible={triggerBulkDelete}
        onHide={() => setTriggerBulkDelete(false)}
        onConfirm={handleBulkDeleteConfirm}
        message={`Are you sure you want to delete ${selection.selectedItems?.length || 0} selected sale record(s)?`}
        header="Delete Multiple Sale Records"
        icon="pi pi-exclamation-triangle"
        acceptLabel="Delete All"
        rejectLabel="Cancel"
      />

      <ImportModal
        visible={importModal.isOpen}
        onHide={importModal.close}
        onImport={handleImport}
        onConfirmImport={handleConfirmImport}
        onCancelImport={handleCancelImport}
        onDownloadSample={async () => {
          await downloadSample();
        }}
        onStartIncrementalImport={async () => {
          await processAllRecords();
        }}
        onCancelIncrementalImport={async () => {
          await cancelIncrementalImport();
        }}
        isProcessingIncremental={isProcessingIncremental}
        isIncrementalCompleted={isIncrementalCompleted}
        importProgress={importProgress}
        incrementalImportActive={incrementalImportActive}
        setIncrementalImportActive={setIncrementalImportActive}
        isImporting={isImporting}
        isDownloading={isDownloading}
        isConfirming={isConfirming}
        importError={importError}
        importResult={importResult}
        onClearStates={handleClearImportStates}
      />
    </>
  );
};

export default SaleList;
