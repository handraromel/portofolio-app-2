import React, { useCallback, useEffect, useRef, useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { formatDate } from "@/utils/formatDate";
import { formatNumberToIDR } from "@/utils/formatCurrency";
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
import { useFileMgmt } from "@/actions/useFileMgmt";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload"; // Add this import
import { Dialog } from "primereact/dialog"; // Add this import
import { ProgressBar } from "primereact/progressbar"; // Add this import
import { Message } from "primereact/message"; // Add this import
import { Button } from "primereact/button";

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

  const {
    downloadSample,
    exportSales,
    importSales,
    setImportError,
    setImportResult,
    isDownloading,
    isExporting,
    isImporting,
    importResult,
    importError,
  } = useFileMgmt();

  const { showWarning, showError } = useToast();
  const responseMsg = salesQuery.data?.msg;
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [triggerDelete, setTriggerDelete] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileUploadRef = useRef<FileUpload>(null);

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

  const handleExportToExcel = async () => {
    await exportSales("xlsx", filters);
  };

  const handleExportToCSV = async () => {
    await exportSales("csv", filters);
  };

  const handleDownloadSample = async () => {
    await downloadSample();
  };

  const handleImportDialogOpen = () => {
    setShowImportDialog(true);
  };

  const handleImportDialogClose = () => {
    setShowImportDialog(false);

    // Clear the file upload component
    if (fileUploadRef.current) {
      fileUploadRef.current.clear();
    }

    // Reset the import result and error states when closing the dialog
    if (importResult || importError) {
      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        // These state setters should be available from your useFileMgmt hook
        setImportResult(null);
        setImportError(null);
      }, 0);
    }
  };

  const handleFileUpload = async (event: FileUploadHandlerEvent) => {
    if (event.files && event.files.length > 0) {
      try {
        const file = event.files[0];
        await importSales(file);
        fetchSales(); // Refresh the list after import
      } catch (error) {
        console.error("Import error:", error);
      }
    }
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
      sortable: true,
    },
    {
      header: "Division",
      body: (rowData: Sale) =>
        `${rowData.division.name}${rowData.division.alias ? ` - ${rowData.division.alias}` : ""}`,
      sortable: true,
      style: { whiteSpace: "nowrap" },
    },
    {
      header: "Group",
      body: (rowData: Sale) => `${rowData.group.id} - ${rowData.group.name}`,
      sortable: true,
      style: { whiteSpace: "nowrap" },
    },
    {
      header: "Category",
      body: (rowData: Sale) => rowData.category.name,
      sortable: true,
      style: { whiteSpace: "nowrap" },
    },
    {
      field: "description",
      header: "Description",
      body: (rowData: Sale) =>
        rowData.item_no
          ? `${rowData.item_no} - ${rowData.description || "-"}`
          : "-",
      sortable: true,
    },
    {
      field: "sku",
      header: "SKU",
      body: (rowData: Sale) => rowData.sku || "-",
      sortable: true,
    },
    {
      field: "input_date",
      header: "Input Date",
      body: (rowData: Sale) =>
        formatDate(rowData.input_date, { format: "DD MMM YYYY" }),
      sortable: true,
    },
    {
      field: "gross_sales",
      header: "Gross Sales",
      body: (rowData: Sale) => formatNumberToIDR(rowData.gross_sales),
      sortable: true,
    },
    {
      field: "discounted_amt",
      header: "Discount",
      body: (rowData: Sale) => formatNumberToIDR(rowData.discounted_amt),
      sortable: true,
    },
    {
      field: "sale_amt",
      header: "Sale Amount",
      body: (rowData: Sale) => formatNumberToIDR(rowData.sale_amt),
      sortable: true,
    },
    {
      field: "sale_qty",
      header: "Quantity",
      sortable: true,
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
    },
  ];

  useEffect(() => {
    if (error) {
      showError(error instanceof Error ? error.message : "An error occurred");
    }
  }, [error, showError]);

  // Import Result Dialog
  const renderImportResultDialog = () => {
    if (!importResult) return null;

    return (
      <Dialog
        header="Import Results"
        visible={importResult !== null && !isImporting}
        onHide={() => handleImportDialogClose()}
        style={{ width: "50vw" }}
        footer={
          <div className="flex justify-end">
            <Button
              label="Close"
              icon="pi pi-times"
              onClick={handleImportDialogClose}
              className="p-button-text"
            />
          </div>
        }
      >
        <div className="p-4">
          <h3 className="mb-4 text-xl">{importResult.message}</h3>

          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <div className="text-2xl font-bold text-slate-600">
                {importResult.details.total_records}
              </div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {importResult.details.success_count}
              </div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {importResult.details.error_count}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          {importResult.details.error_count > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-lg">Errors:</h4>
              <ul className="list-disc pl-6">
                {importResult.details.errors.map((error, index) => (
                  <li key={index} className="mb-1 text-red-600">
                    {error}
                  </li>
                ))}
              </ul>
              {importResult.details.has_more_errors && (
                <p className="mt-2 text-sm text-gray-600">
                  There are more errors not shown here.
                </p>
              )}
            </div>
          )}
        </div>
      </Dialog>
    );
  };

  // Import Dialog
  const renderImportDialog = () => {
    return (
      <Dialog
        header="Import Sales Data"
        visible={showImportDialog}
        onHide={handleImportDialogClose}
        style={{ width: "50vw" }}
        footer={
          <div className="flex justify-end">
            <Button
              label="Download Sample"
              icon="pi pi-download"
              onClick={handleDownloadSample}
              className="p-button-outlined"
              disabled={isDownloading}
            />
          </div>
        }
      >
        <div className="p-4">
          <p className="mb-4">
            Upload a CSV or Excel file with sales data. Please ensure your file
            follows the correct format.
          </p>

          <div className="mb-4">
            <Message
              severity="info"
              text="For Group and Brand fields, use ID-NAME format (e.g., 123-NAME). For Division, use NAME-ALIAS format or could be NAME only (e.g., DIVISI 2-FOOTWEAR or DIVISI 2)."
            />
          </div>

          <FileUpload
            ref={fileUploadRef}
            name="file"
            customUpload
            uploadHandler={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            maxFileSize={10000000}
            chooseLabel="Select File"
            uploadLabel="Import"
            cancelLabel="Cancel"
            className="w-full"
            emptyTemplate={
              <p className="m-0">
                Drag and drop a file here or click to browse
              </p>
            }
          />

          {isImporting && (
            <div className="mt-4">
              <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
              <p className="mt-2 text-center">
                Processing import, please wait...
              </p>
            </div>
          )}

          {importError && (
            <div className="mt-4">
              <Message
                severity="error"
                text={
                  importError.response?.data?.msg ||
                  "An error occurred during import"
                }
              />
            </div>
          )}
        </div>
      </Dialog>
    );
  };

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
                  onClick: handleImportDialogOpen,
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
                {
                  icon: isExporting ? "pi pi-spin pi-spinner" : "pi pi-file",
                  tooltip: isExporting ? "Exporting..." : "Export to CSV",
                  severity: "success",
                  onClick: handleExportToCSV,
                  disabled: isExporting || isImporting,
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

      {/* New Import/Export Related Dialogs */}
      {renderImportDialog()}
      {renderImportResultDialog()}
    </>
  );
};

export default SaleList;
