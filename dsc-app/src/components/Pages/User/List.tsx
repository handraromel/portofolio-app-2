import React, { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks";
import {
  deleteUser,
  activateUser,
  fetchUsers,
} from "@/store/actions/userActions";
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
  const dispatch = useAppDispatch();
  const { canEdit, canDelete, hasRole } = usePermission();
  const isSuperAdmin = hasRole("superadmin");
  const isAdmin = hasRole("admin");
  const { users, isLoading, currentUser, error } = useAppSelector((state) => ({
    ...state.user,
    currentUser: state.auth.user,
  }));
  const { showSuccess, showWarning, showError } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const submissionModal = useModal();
  const detailModal = useModal();
  const [triggerDelete, setTriggerDelete] = useState(false);
  const [triggerActivate, setTriggerActivate] = useState(false);

  const handleSubmission = (user?: User) => {
    setSelectedUser(user ? user : null);
    submissionModal.open();
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    detailModal.open();
  };

  const handleDeleteConfirm = useCallback(() => {
    if (selectedUser) {
      dispatch(deleteUser(selectedUser.id))
        .unwrap()
        .then(() => {
          dispatch(fetchUsers());
        });
      showWarning("User is now deleted");
    }
  }, [dispatch, selectedUser]);

  const handleActivateConfirm = useCallback(() => {
    if (selectedUser) {
      dispatch(
        activateUser({
          userId: selectedUser.id,
          isActive: !selectedUser.is_active,
        }),
      )
        .unwrap()
        .then(() => {
          dispatch(fetchUsers());
        });
      if (selectedUser.is_active) {
        showWarning("User is now deactivated");
      } else {
        showSuccess("User is now activated");
      }
    }
  }, [dispatch, selectedUser]);

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
    dispatch(fetchUsers()); // Your refresh logic here
  }, [dispatch]);

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
    if (error?.message) {
      showError(error.message);
    }
  }, [error, showError, selectedUser]);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

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
