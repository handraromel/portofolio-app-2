import React, { useCallback, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import { ProductBrand } from "@/types/product";
import { Confirmation, ColumnDef } from "@/components/Common";
import { useModal, usePermission, useTableSelection } from "@/hooks";
import { useToast } from "@/context/Toast";
import { useBrand } from "@/actions/product/useBrand";
import { useBrandFileMgmt } from "@/actions/product/useBrandFileMgmt";
import Table from "@/components/Common/Table";
import Submission from "./Modals/Submission";
import Detail from "./Modals/Detail";
import ImportModal from "./Modals/Import";

const BrandList: React.FC = () => {
  const { canEdit, canDelete } = usePermission();
  const {
    brands,
    pagination,
    isLoading,
    error,
    fetchBrands,
    deleteBrand,
    searchBrands,
    changePage,
    changePerPage,
    brandsQuery,
    filters,
  } = useBrand();

  const {
    downloadSample,
    importBrands,
    confirmImport,
    cancelImport,
    isDownloading,
    isImporting,
    isConfirming,
    importResult,
    importError,
    setImportResult,
    setImportError,
  } = useBrandFileMgmt();

  const { showWarning, showError } = useToast();
  const responseMsg = brandsQuery.data?.msg;
  const [selectedBrand, setSelectedBrand] = useState<ProductBrand | null>(null);
  const submissionModal = useModal();
  const detailModal = useModal();
  const importModal = useModal();
  const [triggerDelete, setTriggerDelete] = useState(false);

  const selection = useTableSelection<ProductBrand>({
    idField: "uuid",
    onSelectionChange: (items, current) => {
      if (current) {
        setSelectedBrand(current);
      }
    },
  });

  const handleSubmission = (brand?: ProductBrand) => {
    setSelectedBrand(brand ?? null);
    if (brand) {
      selection.selectItem(brand);
    } else {
      selection.clearSelection();
    }
    submissionModal.open();
  };

  const handleDelete = (brand: ProductBrand) => {
    setSelectedBrand(brand);
    selection.selectItem(brand);
    setTriggerDelete(true);
  };

  const handleView = (brand: ProductBrand) => {
    setSelectedBrand(brand);
    selection.selectItem(brand);
    detailModal.open();
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedBrand) {
      try {
        await deleteBrand(selectedBrand.uuid);
        showWarning(responseMsg || "Brand deleted successfully");
        setTriggerDelete(false);
      } catch {
        showError(responseMsg || "Failed to delete brand");
      }
    }
  }, [selectedBrand, deleteBrand, responseMsg, showWarning, showError]);

  // const handleRefresh = useCallback(() => {
  //   fetchBrands();
  // }, [fetchBrands]);

  // Import handling functions
  const handleImport = async (file: File) => {
    await importBrands(file);
  };

  const handleConfirmImport = async () => {
    const success = await confirmImport();
    if (success) {
      importModal.close();
      fetchBrands();
    }
  };

  const handleCancelImport = async () => {
    await cancelImport();
    importModal.close();
  };

  const handleClearImportStates = () => {
    setImportResult(null);
    setImportError(null);
  };

  const indexTemplate = (rowData: ProductBrand) => {
    const index = brands.findIndex((brand) => brand.uuid === rowData.uuid);
    return (
      (pagination.currentPage || 1) * (filters.per_page || 10) -
      (filters.per_page || 10) +
      index +
      1
    );
  };

  const columns: ColumnDef<ProductBrand>[] = [
    {
      header: "No",
      body: indexTemplate,
    },
    {
      field: "id",
      header: "ID",
      sortable: true,
      style: { whiteSpace: "nowrap" },
      width: "20%",
    },
    {
      field: "name",
      header: "Brand Name",
      sortable: true,
      style: { whiteSpace: "nowrap" },
      width: "20%",
    },
    {
      field: "created_at",
      header: "Created At",
      body: (rowData: ProductBrand) => formatDate(rowData.created_at),
      sortable: true,
      style: { whiteSpace: "nowrap" },
      width: "20%",
    },
    {
      field: "updated_at",
      header: "Updated At",
      body: (rowData: ProductBrand) => formatDate(rowData.updated_at),
      sortable: true,
      style: { whiteSpace: "nowrap" },
      width: "20%",
    },
  ];

  React.useEffect(() => {
    if (error) {
      showError(error instanceof Error ? error.message : "An error occurred");
    }
  }, [error, showError]);

  return (
    <>
      <Table
        data={brands}
        columns={columns}
        title="Manage Product Brands"
        loading={isLoading}
        globalSearchFields={["id", "name"]}
        actionButton={{
          label: "Add Brand",
          onClick: () => handleSubmission(),
          visible: canEdit(),
        }}
        otherActions={[
          // {
          //   icon: "pi pi-refresh",
          //   tooltip: "Refresh list",
          //   severity: "info",
          //   onClick: handleRefresh,
          // },
          {
            icon: "pi pi-upload",
            tooltip: "Import brands",
            severity: "success",
            onClick: importModal.open,
            disabled: isImporting || isLoading,
            visible: canEdit(),
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
        onSearch={searchBrands}
        actions={{
          header: "Actions",
          align: "center",
          buttons: [
            {
              icon: "pi pi-pencil",
              tooltip: "Edit",
              severity: "success",
              onClick: (rowData) => handleSubmission(rowData),
              visible: () => canEdit(),
            },
            {
              icon: "pi pi-trash",
              tooltip: "Delete",
              severity: "danger",
              onClick: (rowData) => handleDelete(rowData),
              visible: () => canDelete(),
            },
            {
              icon: "pi pi-eye",
              tooltip: "View",
              severity: "info",
              onClick: (rowData) => handleView(rowData),
            },
          ],
        }}
        selectionMode="multiple"
        selectedItem={selection.selectedItems}
        onSelectionChange={selection.handleSelectionChange}
      />

      <Submission
        visible={submissionModal.isOpen}
        onHide={submissionModal.close}
        brand={selectedBrand}
      />

      <Detail
        visible={detailModal.isOpen}
        onHide={detailModal.close}
        brand={selectedBrand}
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
        isImporting={isImporting}
        isDownloading={isDownloading}
        isConfirming={isConfirming}
        importError={importError}
        importResult={importResult}
        onClearStates={handleClearImportStates}
      />

      <Confirmation
        visible={triggerDelete}
        onHide={() => setTriggerDelete(false)}
        onConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete brand ${selectedBrand?.name}?`}
        header="Delete Brand"
        icon="pi pi-exclamation-triangle"
        acceptLabel="Delete"
        rejectLabel="Cancel"
      />
    </>
  );
};

export default BrandList;
