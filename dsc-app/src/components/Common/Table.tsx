import React, { JSX, useCallback, useEffect, useState } from "react";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column, ColumnProps } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";
import { debounce } from "lodash";

export interface ColumnDef<T> extends Omit<ColumnProps, "field" | "body"> {
  field?: keyof T;
  header: string;
  body?: (data: T) => React.ReactNode;
  sortable?: boolean;
  style?: React.CSSProperties;
  width?: string;
}

export interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  rows?: number;
  onRowsPerPageChange?: (rows: number) => void;
}

export interface ActionButton<T> {
  icon: string | ((rowData: T) => string);
  tooltip?: string | ((rowData: T) => string);
  severity?:
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "help"
    | "contrast";
  onClick: (rowData: T) => void;
  disabled?: (rowData: T) => boolean;
  visible?: (rowData: T) => boolean;
  className?: string;
  tooltipOptions?: object;
}

export interface TableAction {
  icon: string;
  tooltip?: string;
  severity?:
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "help"
    | "contrast";
  onClick: () => void;
  tooltipOptions?: object;
  className?: string;
  disabled?: boolean;
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
  otherActions?: TableAction[];
  totalRecords?: number;
  paginator?: PaginatorProps;
  onSearch?: (search: string) => void;
  hideSearch?: boolean;
  actions?: {
    header?: string;
    buttons: ActionButton<T>[];
    align?: "left" | "center" | "right";
  };
  dataKey?: string;
}

const Table = <T extends { [key: string]: unknown }>({
  data,
  columns,
  title,
  loading = false,
  globalSearchFields = [],
  actionButton,
  otherActions = [],
  totalRecords,
  paginator,
  onSearch,
  hideSearch = false,
  actions,
  dataKey,
}: TableProps<T>) => {
  const [filters, setFilters] = useState({
    global: {
      value: null as string | null,
      matchMode: FilterMatchMode.CONTAINS,
    },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [currentRows, setCurrentRows] = useState(paginator?.rows || 10);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (onSearch) {
        onSearch(value);
      }
    }, 500),
    [onSearch],
  );

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
    debouncedSearch(value);
  };

  const renderActions = useCallback(
    (rowData: T) => {
      if (!actions?.buttons.length) return null;

      // Calculate appropriate width for actions column based on number of buttons
      const actionWidth =
        actions.buttons.filter((b) => !b.visible || b.visible(rowData)).length *
          40 +
        "px";

      return (
        <div
          className={`flex gap-2 ${actions.align === "center" ? "justify-center" : actions.align === "right" ? "justify-end" : "justify-start"}`}
          style={{ minWidth: actionWidth }}
        >
          {actions.buttons.map((button, index) => {
            // Check if button should be visible
            const isVisible = button.visible ? button.visible(rowData) : true;
            if (!isVisible) return null;

            const isDisabled = button.disabled
              ? button.disabled(rowData)
              : false;

            const getIconName =
              typeof button.icon === "function"
                ? button.icon(rowData)
                : button.icon;
            const tooltipText =
              typeof button.tooltip === "function"
                ? button.tooltip(rowData)
                : button.tooltip;

            return (
              <Button
                key={index}
                size="small"
                rounded
                icon={getIconName}
                tooltip={tooltipText}
                severity={button.severity}
                tooltipOptions={
                  button.tooltipOptions || {
                    position: "top",
                    style: { fontSize: "12px" },
                  }
                }
                pt={{
                  root: {
                    style: { height: "37px", width: "30px" },
                  },
                }}
                className={button.className}
                raised
                onClick={() => button.onClick(rowData)}
                disabled={isDisabled}
                outlined={isDisabled}
                text={isDisabled}
              />
            );
          })}
        </div>
      );
    },
    [actions],
  );

  useEffect(() => {
    if (
      actions &&
      actions.buttons.length > 0 &&
      !columns.some(
        (col) => col.header === actions.header || col.header === "Actions",
      )
    ) {
      const actionColumn: ColumnDef<T> = {
        header: actions.header || "Actions",
        body: renderActions,
        width: actions.buttons.length * 40 + "px",
      };

      const updatedColumns = [...columns, actionColumn];
      setDisplayColumns(updatedColumns);
    } else {
      setDisplayColumns(columns);
    }
  }, [columns, actions, renderActions]);

  const [displayColumns, setDisplayColumns] = useState<ColumnDef<T>[]>(columns);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const renderHeader = () => {
    return (
      <div className="flex flex-col justify-between max-sm:space-y-3 sm:flex-row">
        <div className="flex gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          {!hideSearch && ( // Conditionally render the search input
            <span className="p-input-icon-left">
              <i className="pi pi-search text-gray-500" />
              <InputText
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                placeholder="Search..."
                className="h-12 w-full pl-8"
              />
            </span>
          )}
          <div className="flex items-center gap-3">
            {actionButton?.visible && (
              <Button
                label={actionButton.label}
                size="small"
                className="h-11"
                onClick={actionButton.onClick}
              />
            )}

            {/* Render all other action buttons */}
            {otherActions.map((action, index) => (
              <Button
                key={index}
                icon={action.icon}
                rounded
                size="small"
                severity={action.severity || "info"}
                aria-label={action.tooltip || action.icon}
                tooltip={action.tooltip}
                tooltipOptions={action.tooltipOptions || { position: "top" }}
                onClick={action.onClick}
                className={`h-11 p-1 ${action.className || ""}`}
                disabled={action.disabled}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const convertToColumnProps = (col: ColumnDef<T>): ColumnProps => {
    const style: React.CSSProperties = {
      ...(col.style || {}),
      ...(col.width ? { width: col.width, maxWidth: col.width } : {}),
    };

    return {
      ...col,
      field: col.field as string,
      style: Object.keys(style).length > 0 ? style : undefined,
      frozen: false,
    };
  };

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

  const getUniqueKeyField = () => {
    if (dataKey && data.length > 0 && dataKey in data[0]) {
      return dataKey;
    }

    if (data.length > 0 && "uuid" in data[0]) {
      return "uuid";
    }

    const possibleKeys = ["id", "key", "uuid", "code"];

    for (const key of possibleKeys) {
      if (data.length > 0 && key in data[0]) {
        return key;
      }
    }

    return "id";
  };

  return (
    <DataTable
      value={data}
      paginator={true}
      rows={currentRows}
      rowsPerPageOptions={[5, 10, 25, 50]}
      size="small"
      dataKey={getUniqueKeyField()}
      filters={filters}
      filterDisplay="menu"
      loading={loading}
      globalFilterFields={globalSearchFields as string[]}
      header={renderHeader}
      footer={footerTemplate}
      emptyMessage="No data found."
      className="p-datatable-lg flex flex-1 flex-col [&_.p-column-header-content]:!w-full [&_.p-column-header-content]:!overflow-hidden [&_.p-column-title]:!whitespace-nowrap [&_.p-datatable-scrollable-header]:!z-2 [&_.p-datatable-scrollable-table>.p-datatable-thead]:!z-2 [&_.p-datatable-thead]:!z-2"
      scrollable={true}
      scrollHeight="flex"
      resizableColumns={false}
      columnResizeMode="fit"
      tableStyle={{ minWidth: "100%" }}
      totalRecords={totalRecords}
      lazy={!!paginator}
      first={paginator ? (paginator.currentPage - 1) * currentRows : 0}
      onPage={handlePage}
    >
      {displayColumns.map((col, index) => (
        <Column key={index} {...convertToColumnProps(col)} />
      ))}
    </DataTable>
  );
};

export default Table as <T>(props: TableProps<T>) => JSX.Element;
