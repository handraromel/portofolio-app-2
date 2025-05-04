import React, { useCallback, useState, useEffect } from "react";
import { formatDate } from "@/utils/formatDate";
import { ProductCategory } from "@/types/product";
import { Confirmation, ColumnDef } from "@/components/Common";
import { useModal, usePermission, useTableSelection } from "@/hooks";
import { useToast } from "@/context/Toast";
import { useCategory } from "@/actions/product/useCategory";
import Table from "@/components/Common/Table";
import Submission from "./Modals/Submission";
import Detail from "./Modals/Detail";

const CategoryList: React.FC = () => {
  const { canEdit, canDelete } = usePermission();
  const {
    categories,
    pagination,
    isLoading,
    error,
    // fetchCategories,
    deleteCategory,
    searchCategories,
    changePage,
    changePerPage,
    categoriesQuery,
    filters,
  } = useCategory();

  const { showWarning, showError } = useToast();
  const responseMsg = categoriesQuery.data?.msg;
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | null>(null);
  const submissionModal = useModal();
  const detailModal = useModal();
  const [triggerDelete, setTriggerDelete] = useState(false);

  const selection = useTableSelection<ProductCategory>({
    idField: "uuid",
    onSelectionChange: (items, current) => {
      if (current) {
        setSelectedCategory(current);
      }
    },
  });

  const handleSubmission = (category?: ProductCategory) => {
    setSelectedCategory(category ?? null);
    if (category) {
      selection.selectItem(category);
    } else {
      selection.clearSelection();
    }
    submissionModal.open();
  };

  const handleDelete = (category: ProductCategory) => {
    setSelectedCategory(category);
    selection.selectItem(category);
    setTriggerDelete(true);
  };

  const handleView = (category: ProductCategory) => {
    setSelectedCategory(category);
    selection.selectItem(category);
    detailModal.open();
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedCategory) {
      try {
        await deleteCategory(selectedCategory.uuid);
        showWarning(responseMsg || "Category deleted successfully");
        setTriggerDelete(false);
      } catch {
        showError(responseMsg || "Failed to delete category");
      }
    }
  }, [selectedCategory, deleteCategory, responseMsg, showWarning, showError]);

  const indexTemplate = (rowData: ProductCategory) => {
    const index = categories.findIndex(
      (category) => category.uuid === rowData.uuid,
    );
    return (
      (pagination.currentPage || 1) * (filters.per_page || 10) -
      (filters.per_page || 10) +
      index +
      1
    );
  };

  // const handleRefresh = useCallback(() => {
  //   fetchCategories();
  // }, [fetchCategories]);

  const columns: ColumnDef<ProductCategory>[] = [
    {
      header: "No",
      body: indexTemplate,
    },
    {
      field: "name",
      header: "Category Name",
      sortable: true,
      style: { whiteSpace: "nowrap" },
      width: "30%",
    },
    {
      field: "created_at",
      header: "Created At",
      body: (rowData: ProductCategory) => formatDate(rowData.created_at),
      sortable: true,
      style: { whiteSpace: "nowrap" },
      width: "30%",
    },
    {
      field: "updated_at",
      header: "Updated At",
      body: (rowData: ProductCategory) => formatDate(rowData.updated_at),
      sortable: true,
      style: { whiteSpace: "nowrap" },
      width: "30%",
    },
  ];

  useEffect(() => {
    if (error) {
      showError(error instanceof Error ? error.message : "An error occurred");
    }
  }, [error, showError]);

  return (
    <>
      <Table
        data={categories}
        columns={columns}
        title="Manage Product Categories"
        loading={isLoading}
        globalSearchFields={["name"]}
        mainActions={[
          // {
          //   icon: "pi pi-refresh",
          //   tooltip: "Refresh list",
          //   severity: "info",
          //   onClick: handleRefresh,
          // },
          {
            label: "Add Category",
            onClick: () => handleSubmission(),
            visible: canEdit(),
            icon: "pi pi-plus",
            severity: "success",
            rounded: true,
            outlined: true,
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
        onSearch={searchCategories}
        actions={{
          header: "Actions",
          align: "center",
          buttons: [
            {
              icon: "pi pi-pencil",
              tooltip: "Edit",
              severity: "contrast",
              onClick: (rowData) => handleSubmission(rowData),
              visible: () => canEdit(),
            },
            {
              icon: "pi pi-eye",
              tooltip: "View",
              severity: "info",
              onClick: (rowData) => handleView(rowData),
            },
            {
              icon: "pi pi-trash",
              tooltip: "Delete",
              severity: "danger",
              onClick: (rowData) => handleDelete(rowData),
              visible: () => canDelete(),
            },
          ],
        }}
        onSelectionChange={selection.handleSelectionChange}
        selectionMode="multiple"
        selectedItem={selection.selectedItems}
      />

      <Submission
        visible={submissionModal.isOpen}
        onHide={submissionModal.close}
        category={selectedCategory}
      />

      <Detail
        visible={detailModal.isOpen}
        onHide={detailModal.close}
        category={selectedCategory}
      />

      <Confirmation
        visible={triggerDelete}
        onHide={() => setTriggerDelete(false)}
        onConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete category ${selectedCategory?.name}?`}
        header="Delete Category"
        icon="pi pi-exclamation-triangle"
        acceptLabel="Delete"
        rejectLabel="Cancel"
      />
    </>
  );
};

export default CategoryList;
