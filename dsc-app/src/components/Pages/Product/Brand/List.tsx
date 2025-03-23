import React, { useCallback, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import { ProductBrand } from "@/types/product";
import { Confirmation, ColumnDef } from "@/components/Common";
import { useModal, usePermission } from "@/hooks";
import { useToast } from "@/context/Toast";
import { useBrand } from "@/actions/product/useBrand";
import Table from "@/components/Common/Table";
import Submission from "./Modals/Submission";
import Detail from "./Modals/Detail";

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

  const { showWarning, showError } = useToast();
  const responseMsg = brandsQuery.data?.msg;
  const [selectedBrand, setSelectedBrand] = useState<ProductBrand | null>(null);
  const submissionModal = useModal();
  const detailModal = useModal();
  const [triggerDelete, setTriggerDelete] = useState(false);

  const handleSubmission = (brand?: ProductBrand) => {
    setSelectedBrand(brand ?? null);
    submissionModal.open();
  };

  const handleView = (brand: ProductBrand) => {
    setSelectedBrand(brand);
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

  const indexTemplate = (rowData: ProductBrand) => {
    const index = brands.findIndex((brand) => brand.uuid === rowData.uuid);
    return (
      (pagination.currentPage || 1) * (filters.per_page || 10) -
      (filters.per_page || 10) +
      index +
      1
    );
  };

  const handleRefresh = useCallback(() => {
    fetchBrands();
  }, [fetchBrands]);

  const columns: ColumnDef<ProductBrand>[] = [
    {
      header: "No",
      body: indexTemplate,
    },
    {
      field: "id",
      header: "ID",
      sortable: true,
    },
    {
      field: "name",
      header: "Brand Name",
      sortable: true,
    },
    {
      field: "created_at",
      header: "Created At",
      body: (rowData: ProductBrand) => formatDate(rowData.created_at),
      sortable: true,
    },
    {
      field: "updated_at",
      header: "Updated At",
      body: (rowData: ProductBrand) => formatDate(rowData.updated_at),
      sortable: true,
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
        onRefresh={handleRefresh}
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
              onClick: (rowData) => {
                setSelectedBrand(rowData);
                setTriggerDelete(true);
              },
              visible: () => canDelete(),
            },
            {
              icon: "pi pi-eye",
              tooltip: "View",
              severity: "info",
              onClick: (rowData) => handleView(rowData),
              visible: () => true,
            },
          ],
        }}
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
