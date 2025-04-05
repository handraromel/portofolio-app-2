import React, { useCallback, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import { ProductGroup } from "@/types/product";
import { Confirmation, ColumnDef } from "@/components/Common";
import { useModal, usePermission } from "@/hooks";
import { useToast } from "@/context/Toast";
import { useGroup } from "@/actions/product/useGroup";
import Table from "@/components/Common/Table";
import Submission from "./Modals/Submission";
import Detail from "./Modals/Detail";

const GroupList: React.FC = () => {
  const { canEdit, canDelete } = usePermission();
  const {
    groups,
    pagination,
    isLoading,
    error,
    fetchGroups,
    deleteGroup,
    searchGroups,
    changePage,
    changePerPage,
    groupsQuery,
    filters,
  } = useGroup();

  const { showWarning, showError } = useToast();
  const responseMsg = groupsQuery.data?.msg;
  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);
  const submissionModal = useModal();
  const detailModal = useModal();
  const [triggerDelete, setTriggerDelete] = useState(false);

  const handleSubmission = (group?: ProductGroup) => {
    setSelectedGroup(group ?? null);
    submissionModal.open();
  };

  const handleView = (group: ProductGroup) => {
    setSelectedGroup(group);
    detailModal.open();
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedGroup) {
      try {
        await deleteGroup(selectedGroup.uuid);
        showWarning(responseMsg || "Group deleted successfully");
        setTriggerDelete(false);
      } catch {
        showError(responseMsg || "Failed to delete group");
      }
    }
  }, [selectedGroup, deleteGroup, responseMsg, showWarning, showError]);

  const indexTemplate = (rowData: ProductGroup) => {
    const index = groups.findIndex((group) => group.uuid === rowData.uuid);
    return (
      (pagination.currentPage || 1) * (filters.per_page || 10) -
      (filters.per_page || 10) +
      index +
      1
    );
  };

  const handleRefresh = useCallback(() => {
    fetchGroups();
  }, [fetchGroups]);

  const columns: ColumnDef<ProductGroup>[] = [
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
      header: "Group Name",
      sortable: true,
    },
    {
      field: "created_at",
      header: "Created At",
      body: (rowData: ProductGroup) => formatDate(rowData.created_at),
      sortable: true,
    },
    {
      field: "updated_at",
      header: "Updated At",
      body: (rowData: ProductGroup) => formatDate(rowData.updated_at),
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
        data={groups}
        columns={columns}
        title="Manage Product Groups"
        loading={isLoading}
        globalSearchFields={["id", "name"]}
        actionButton={{
          label: "Add Group",
          onClick: () => handleSubmission(),
          visible: canEdit(),
        }}
        otherActions={[
          {
            icon: "pi pi-refresh",
            tooltip: "Refresh list",
            severity: "info",
            onClick: handleRefresh,
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
        onSearch={searchGroups}
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
                setSelectedGroup(rowData);
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
        group={selectedGroup}
      />

      <Detail
        visible={detailModal.isOpen}
        onHide={detailModal.close}
        group={selectedGroup}
      />

      <Confirmation
        visible={triggerDelete}
        onHide={() => setTriggerDelete(false)}
        onConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete group ${selectedGroup?.name}?`}
        header="Delete Group"
        icon="pi pi-exclamation-triangle"
        acceptLabel="Delete"
        rejectLabel="Cancel"
      />
    </>
  );
};

export default GroupList;
