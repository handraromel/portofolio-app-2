import React, { JSX, useState } from "react";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column, ColumnProps } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";

export interface ColumnDef<T> extends Omit<ColumnProps, "field" | "body"> {
  field?: keyof T;
  header: string;
  body?: (data: T) => React.ReactNode;
  sortable?: boolean;
  style?: React.CSSProperties;
}

export interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  rows?: number;
  onRowsPerPageChange?: (rows: number) => void;
}

export interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  title: string;
  loading?: boolean;
  globalSearchFields?: Array<keyof T>;
  actionButton?: {
    label: string;
    onClick: () => void;
    visible?: boolean;
  };
  onRefresh?: () => void;
  totalRecords?: number;
  paginator?: PaginatorProps;
  onSearch?: (search: string) => void;
}

const Table = <T extends { [key: string]: unknown }>({
  data,
  columns,
  title,
  loading = false,
  globalSearchFields = [],
  actionButton,
  onRefresh,
  totalRecords,
  paginator,
  onSearch,
}: TableProps<T>) => {
  const [filters, setFilters] = useState({
    global: {
      value: null as string | null,
      matchMode: FilterMatchMode.CONTAINS,
    },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [currentRows, setCurrentRows] = useState(paginator?.rows || 10);

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);

    if (onSearch) {
      onSearch(value);
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col justify-between max-sm:space-y-3 sm:flex-row">
        <div className="flex gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <span className="p-input-icon-left">
            <i className="pi pi-search text-gray-500" />
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Search..."
              className="h-12 w-full pl-8"
            />
          </span>
          <div className="flex items-center gap-3">
            {actionButton?.visible && (
              <Button
                label={actionButton.label}
                size="small"
                className="h-11"
                onClick={actionButton.onClick}
              />
            )}
            {onRefresh && (
              <Button
                icon="pi pi-refresh"
                rounded
                size="small"
                severity="info"
                aria-label="Refresh"
                tooltip="Refresh list"
                tooltipOptions={{ position: "top" }}
                onClick={onRefresh}
                className="h-11 p-1"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const convertToColumnProps = (col: ColumnDef<T>): ColumnProps => ({
    ...col,
    field: col.field as string,
  });

  const footerTemplate = () => {
    if (totalRecords !== undefined) {
      return (
        <div className="px-4 py-2">
          <div>Total records: {totalRecords}</div>
        </div>
      );
    }
    return null;
  };

  // Handle pagination events (page change and rows per page change)
  const handlePage = (event: DataTablePageEvent) => {
    if (paginator) {
      // Handle page change
      if (event.page !== undefined) {
        const newPage = event.page + 1;
        paginator.onPageChange(newPage);
      }

      // Handle rows per page change
      if (event.rows !== undefined && event.rows !== currentRows) {
        setCurrentRows(event.rows);
        if (paginator.onRowsPerPageChange) {
          paginator.onRowsPerPageChange(event.rows);
        }
      }
    }
  };

  return (
    <DataTable
      value={data}
      paginator={true}
      rows={currentRows}
      rowsPerPageOptions={[5, 10, 25, 50]}
      size="small"
      dataKey="id"
      filters={filters}
      filterDisplay="menu"
      loading={loading}
      globalFilterFields={globalSearchFields as string[]}
      header={renderHeader}
      footer={footerTemplate}
      emptyMessage="No data found."
      className="p-datatable-lg flex flex-1 flex-col [&_.p-datatable-scrollable-header]:!z-2 [&_.p-datatable-scrollable-table>.p-datatable-thead]:!z-2 [&_.p-datatable-thead]:!z-2"
      scrollable
      scrollHeight="flex"
      totalRecords={totalRecords}
      lazy={!!paginator}
      first={paginator ? (paginator.currentPage - 1) * currentRows : 0}
      onPage={handlePage}
    >
      {columns.map((col, index) => (
        <Column key={index} {...convertToColumnProps(col)} />
      ))}
    </DataTable>
  );
};

export default Table as <T>(props: TableProps<T>) => JSX.Element;
