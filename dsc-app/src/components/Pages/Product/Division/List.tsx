import React, { useCallback, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import { ProductDivision } from "@/types/product";
import { Confirmation, ColumnDef } from "@/components/Common";
import { useModal, usePermission } from "@/hooks";
import { useToast } from "@/context/Toast";
import { useDivision } from "@/actions/product/useDivision";
import Table from "@/components/Common/Table";
import Submission from "./Modals/Submission";
import Detail from "./Modals/Detail";

const DivisionList: React.FC = () => {
  const { canEdit, canDelete } = usePermission();
  const {
    divisions,
    pagination,
    isLoading,
    error,
    fetchDivisions,
    deleteDivision,
    searchDivisions,
    changePage,
    changePerPage,
    divisionsQuery,
    filters,
  } = useDivision();

  const { showWarning, showError } = useToast();
  const responseMsg = divisionsQuery.data?.msg;
  const [selectedDivision, setSelectedDivision] =
    useState<ProductDivision | null>(null);
  const submissionModal = useModal();
  const detailModal = useModal();
  const [triggerDelete, setTriggerDelete] = useState(false);

  const handleSubmission = (division?: ProductDivision) => {
    setSelectedDivision(division ?? null);
    submissionModal.open();
  };

  const handleView = (division: ProductDivision) => {
    setSelectedDivision(division);
    detailModal.open();
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedDivision) {
      try {
        await deleteDivision(selectedDivision.uuid);
        showWarning(responseMsg || "Division deleted successfully");
        setTriggerDelete(false);
      } catch {
        showError(responseMsg || "Failed to delete division");
      }
    }
  }, [selectedDivision, deleteDivision, responseMsg, showWarning, showError]);

  const indexTemplate = (rowData: ProductDivision) => {
    const index = divisions.findIndex(
      (division) => division.uuid === rowData.uuid,
    );
    return (
      (pagination.currentPage || 1) * (filters.per_page || 10) -
      (filters.per_page || 10) +
      index +
      1
    );
  };

  const handleRefresh = useCallback(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  const columns: ColumnDef<ProductDivision>[] = [
    {
      header: "No",
      body: indexTemplate,
    },
    {
      field: "name",
      header: "Division Name",
      sortable: true,
    },
    {
      field: "alias",
      header: "Alias",
      body: (rowData: ProductDivision) => rowData.alias || "-",
      sortable: true,
    },
    {
      field: "created_at",
      header: "Created At",
      body: (rowData: ProductDivision) => formatDate(rowData.created_at),
      sortable: true,
    },
    {
      field: "updated_at",
      header: "Updated At",
      body: (rowData: ProductDivision) => formatDate(rowData.updated_at),
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
        data={divisions}
        columns={columns}
        title="Manage Product Divisions"
        loading={isLoading}
        globalSearchFields={["name", "alias"]}
        actionButton={{
          label: "Add Division",
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
        onSearch={searchDivisions}
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
              onClick: (rowData) => {
                setSelectedDivision(rowData);
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
        division={selectedDivision}
      />

      <Detail
        visible={detailModal.isOpen}
        onHide={detailModal.close}
        division={selectedDivision}
      />

      <Confirmation
        visible={triggerDelete}
        onHide={() => setTriggerDelete(false)}
        onConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete division ${selectedDivision?.name}?`}
        header="Delete Division"
        icon="pi pi-exclamation-triangle"
        acceptLabel="Delete"
        rejectLabel="Cancel"
      />
    </>
  );
};

export default DivisionList;
