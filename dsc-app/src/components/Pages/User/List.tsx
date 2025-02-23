import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/hooks";
import { useUserManagement } from "@/store/actions/useUserManagement";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { formatDate } from "@/utils/formatDate";
import { User } from "@/types/user";
import { Submission as SubmissionModal, Detail as DetailModal } from "./Modals";
import { useModal, usePermission } from "@/hooks";
import { ColumnDef, Confirmation } from "@/components/Common";
import { useToast } from "@/context/Toast";

import Table from "@/components/Common/Table";

const UserList: React.FC = () => {
  const { canEdit, canDelete, hasRole } = usePermission();
  const isSuperAdmin = hasRole("superadmin");
  const isAdmin = hasRole("admin");
  const currentUser = useAppSelector((state) => state.auth.user);

  // Use React Query hooks
  const { users, isLoading, error, fetchUsers, deleteUser, activateUser } =
    useUserManagement();

  const { showSuccess, showWarning, showError } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const submissionModal = useModal();
  const detailModal = useModal();
  const [triggerDelete, setTriggerDelete] = useState(false);
  const [triggerActivate, setTriggerActivate] = useState(false);

  const handleSubmission = (user?: User) => {
    setSelectedUser(user ?? null);
    submissionModal.open();
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    detailModal.open();
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedUser) {
      try {
        await deleteUser(selectedUser.id);
        await fetchUsers();
        showWarning("User is now deleted");
      } catch {
        showError("Failed to delete user");
      }
    }
  }, [selectedUser, deleteUser, fetchUsers, showWarning, showError]);

  const handleActivateConfirm = useCallback(async () => {
    if (selectedUser) {
      try {
        await activateUser(selectedUser.id, !selectedUser.is_active);
        await fetchUsers();
        if (selectedUser.is_active) {
          showWarning("User is now deactivated");
        } else {
          showSuccess("User is now activated");
        }
      } catch {
        showError("Failed to update user status");
      }
    }
  }, [
    selectedUser,
    activateUser,
    fetchUsers,
    showSuccess,
    showWarning,
    showError,
  ]);

  const statusBodyTemplate = (rowData: User) => {
    return (
      <Tag
        value={rowData.is_active ? "Active" : "Inactive"}
        severity={rowData.is_active ? "success" : "secondary"}
      />
    );
  };

  const roleBodyTemplate = (rowData: User) => {
    const getSeverity = (role: string) => {
      switch (role.toLowerCase()) {
        case "superadmin":
          return "danger";
        case "admin":
          return "warning";
        default:
          return "info";
      }
    };

    return <Tag value={rowData.role} severity={getSeverity(rowData.role)} />;
  };

  const fullNameTemplate = (rowData: User) => {
    return `${rowData.first_name} ${rowData.last_name}`;
  };

  const indexTemplate = (rowData: User) => {
    return users.indexOf(rowData) + 1;
  };

  const handleRefresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const isEditDisabled = (user: User) => {
    return (
      (isSuperAdmin && currentUser?.id === user.id) ||
      (user.role === "superadmin" && !isSuperAdmin)
    );
  };

  const isDeleteDisabled = (user: User) => {
    return (
      !isSuperAdmin ||
      (isSuperAdmin && currentUser?.id === user.id) ||
      user.is_active
    );
  };

  const isActivateDisabled = (user: User) => {
    return (
      (isSuperAdmin && currentUser?.id === user.id) ||
      (isAdmin && currentUser?.id === user.id) ||
      (!isSuperAdmin && user.role === "superadmin") ||
      (!isSuperAdmin && !isAdmin)
    );
  };

  const renderActions = (rowData: User) => {
    const editDisabled = isEditDisabled(rowData);
    const deleteDisabled = isDeleteDisabled(rowData);
    const activateDisabled = isActivateDisabled(rowData);

    return (
      <div className="flex justify-center gap-2">
        {canEdit() && (
          <Button
            label="Edit"
            severity="success"
            size="small"
            className="h-7"
            raised
            onClick={() => handleSubmission(rowData)}
            disabled={editDisabled}
            outlined={editDisabled}
            text={editDisabled}
          />
        )}
        {canDelete() && (
          <Button
            label="Delete"
            severity="danger"
            size="small"
            className="h-7"
            raised
            onClick={() => {
              setSelectedUser(rowData);
              setTriggerDelete(true);
            }}
            disabled={deleteDisabled}
            outlined={deleteDisabled}
            text={deleteDisabled}
          />
        )}
        <Button
          label="View"
          severity="info"
          size="small"
          className="h-7"
          raised
          onClick={() => handleView(rowData)}
        />
        {(isAdmin || isSuperAdmin) && (
          <Button
            label={rowData.is_active ? "Deactivate" : "Activate"}
            severity="help"
            size="small"
            className="h-7"
            raised
            onClick={() => {
              setSelectedUser(rowData);
              setTriggerActivate(true);
            }}
            disabled={activateDisabled}
            outlined={activateDisabled}
            text={activateDisabled}
          />
        )}
      </div>
    );
  };

  const columns: ColumnDef<User>[] = [
    {
      header: "No",
      body: indexTemplate,
    },
    {
      field: "email",
      header: "Email",
      sortable: true,
    },
    {
      field: "username",
      header: "Username",
      sortable: true,
    },
    {
      header: "Full Name",
      body: fullNameTemplate,
      sortable: true,
    },
    {
      field: "role",
      header: "Role",
      body: roleBodyTemplate,
      sortable: true,
    },
    {
      field: "is_active",
      header: "Status",
      body: statusBodyTemplate,
      sortable: true,
    },
    {
      field: "created_at",
      header: "Created At",
      body: (rowData: User) => formatDate(rowData.created_at),
      sortable: true,
    },
    {
      field: "updated_at",
      header: "Updated At",
      body: (rowData: User) => formatDate(rowData.updated_at),
      sortable: true,
    },
    {
      header: "Actions",
      body: renderActions,
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
        data={users}
        columns={columns}
        title="Manage Users"
        loading={isLoading}
        globalSearchFields={["email", "username", "first_name", "last_name"]}
        actionButton={{
          label: "Add User",
          onClick: () => handleSubmission(),
          visible: canEdit(),
        }}
        onRefresh={handleRefresh}
      />

      <SubmissionModal
        visible={submissionModal.isOpen}
        onHide={submissionModal.close}
        user={selectedUser}
      />

      <DetailModal
        visible={detailModal.isOpen}
        onHide={detailModal.close}
        user={selectedUser}
      />

      <Confirmation
        visible={triggerDelete}
        onHide={() => setTriggerDelete(false)}
        onConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete user ${selectedUser?.email}?`}
        header="Delete User"
        icon="pi pi-exclamation-triangle"
        acceptLabel="Delete"
        rejectLabel="Cancel"
      />

      <Confirmation
        visible={triggerActivate}
        onHide={() => setTriggerActivate(false)}
        onConfirm={handleActivateConfirm}
        message={`Are you sure you want to ${selectedUser?.is_active ? "deactivate" : "activate"} user ${selectedUser?.email}?`}
        header={`${selectedUser?.is_active ? "Deactivate" : "Activate"} User`}
        icon="pi pi-exclamation-triangle"
        acceptLabel={selectedUser?.is_active ? "Deactivate" : "Activate"}
        rejectLabel="Cancel"
      />
    </>
  );
};

export default UserList;
