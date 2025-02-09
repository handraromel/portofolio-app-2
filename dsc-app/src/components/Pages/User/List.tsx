import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Tag } from "primereact/tag";
import { AppDispatch, RootState } from "@/store/config";
import { fetchUsers } from "@/store/actions/userActions";
import { User } from "@/types/user";

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
        severity={rowData.is_active ? "success" : "danger"}
      />
    );
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
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Keyword Search"
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
      field: "is_active",
      header: "Status",
      body: statusBodyTemplate,
      sortable: true,
    },
    {
      field: "created_at",
      header: "Created At",
      sortable: true,
    },
    {
      field: "updated_at",
      header: "Updated At",
      sortable: true,
    },
  ];

  return (
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
  );
};

export default UserList;
