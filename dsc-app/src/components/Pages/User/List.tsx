import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { AppDispatch, RootState } from "@/store/config";
import { fetchUsers } from "@/store/actions/userActions";
import { formatDate } from "@/utils/formatDate";
import { User } from "@/types/user";
import { EditModal, DetailModal } from "./Modals";

const UserList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, isLoading } = useSelector((state: RootState) => state.user);
  const [filters, setFilters] = useState({
    global: {
      value: null as string | null,
      matchMode: FilterMatchMode.CONTAINS,
    },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsUpdateModalVisible(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalVisible(true);
  };

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

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

  const renderHeader = () => {
    return (
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Users</h2>
        <span className="p-input-icon-left">
          <MagnifyingGlassIcon className="h-4 w-5" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search..."
          />
        </span>
      </div>
    );
  };

  const renderFooter = () => {
    const { totalUsers, currentPage, totalPages } = useSelector(
      (state: RootState) => state.user,
    );

    return (
      <div className="flex justify-between px-2 py-1 text-sm">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <span>Total Users: {totalUsers}</span>
      </div>
    );
  };

  const columns = [
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
      body: (rowData: User) => {
        return (
          <div className="flex justify-center gap-2">
            <Button
              label="Edit"
              severity="success"
              outlined
              size="small"
              className="h-7"
              text
              raised
              onClick={() => handleEdit(rowData)}
            />
            <Button
              label="Delete"
              severity="danger"
              outlined
              size="small"
              className="h-7"
              text
              raised
            />
            <Button
              label="View"
              severity="info"
              outlined
              size="small"
              className="h-7"
              text
              raised
              onClick={() => handleView(rowData)}
            />
            <Button
              label="Activate"
              severity="help"
              outlined
              size="small"
              className="h-7"
              text
              raised
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        value={users}
        paginator
        rows={10}
        size="small"
        dataKey="id"
        filters={filters}
        filterDisplay="menu"
        loading={isLoading}
        globalFilterFields={["email", "username", "first_name", "last_name"]}
        header={renderHeader}
        footer={renderFooter}
        emptyMessage="No users found."
        className="p-datatable-lg flex flex-1 flex-col"
        scrollable
        scrollHeight="flex"
      >
        {columns.map((col, index) => (
          <Column key={index} {...col} />
        ))}
      </DataTable>
      <EditModal
        visible={isUpdateModalVisible}
        onHide={() => setIsUpdateModalVisible(false)}
        user={selectedUser}
      />

      <DetailModal
        visible={isDetailModalVisible}
        onHide={() => setIsDetailModalVisible(false)}
        user={selectedUser}
      />
    </>
  );
};

export default UserList;
