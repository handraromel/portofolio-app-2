import React, { JSX, useCallback, useEffect, useState } from "react";
import {
  DataTable,
  DataTablePageEvent,
  DataTableValueArray,
  DataTableSelectionMultipleChangeEvent,
  DataTableRowClickEvent,
} from "primereact/datatable";
import { Column, ColumnProps } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button, ButtonProps } from "primereact/button";
import { FilterMatchMode } from "primereact/api";
import { debounce } from "lodash";
import { useRef, useLayoutEffect } from "react";
import "@/assets/styles/datatable.css";

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
    | "success"
    | "secondary"
    | "info"
    | "warning"
    | "danger"
    | "help"
    | "contrast"
    | ((
        rowData: T,
      ) =>
        | "success"
        | "secondary"
        | "info"
        | "warning"
        | "danger"
        | "help"
        | "contrast");
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
  visible?: boolean | (() => boolean);
}

type DataTableSelection<T> = T[] | null;

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
  bulkActions?: Array<{
    label: string;
    icon?: string;
    severity?: ButtonProps["severity"];
    onClick: () => void;
    visible?: () => boolean;
    disabled?: boolean;
    className?: string;
  }>;
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
  selectionMode?: "multiple" | "checkbox" | null;
  selectedItem?: DataTableSelection<T>;
  onSelectionChange?: (selection: DataTableSelection<T>) => void;
}

const Table = <T extends { [key: string]: unknown }>({
  data,
  columns,
  title,
  loading = false,
  globalSearchFields = [],
  actionButton,
  otherActions = [],
  bulkActions = [],
  totalRecords,
  paginator,
  onSearch,
  hideSearch = false,
  actions,
  dataKey,
  selectionMode = "multiple",
  selectedItem,
  onSelectionChange,
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

  const handleRowClick = (event: DataTableRowClickEvent) => {
    if (!selectionMode || !onSelectionChange) return;

    const clickedRow = event.data as T;
    const keyField = getUniqueKeyField() as keyof T;

    // Get current selection
    const current = selectedItem || [];

    // Check if already selected
    const isSelected = current.some(
      (item) => item[keyField] === clickedRow[keyField],
    );

    let newSelection: T[];

    if (isSelected) {
      // Remove from selection
      newSelection = current.filter(
        (item) => item[keyField] !== clickedRow[keyField],
      );
    } else {
      // Add to selection
      newSelection = [...current, clickedRow];
    }

    // Update selection (null if empty)
    onSelectionChange(newSelection.length > 0 ? newSelection : null);
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
          className={`flex gap-2 px-8 ${actions.align === "center" ? "justify-center" : actions.align === "right" ? "justify-end" : "justify-start"}`}
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
            const buttonSeverity =
              typeof button.severity === "function"
                ? button.severity(rowData)
                : button.severity;

            return (
              <Button
                key={index}
                size="small"
                rounded
                icon={getIconName}
                tooltip={tooltipText}
                severity={buttonSeverity}
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
        align: "center",
        width: "100%",
      };

      const updatedColumns = [...columns, actionColumn];
      setDisplayColumns(updatedColumns);
    } else {
      setDisplayColumns(columns);
    }
  }, [columns, actions, renderActions]);

  const [displayColumns, setDisplayColumns] = useState<ColumnDef<T>[]>(columns);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState("500px");

  useLayoutEffect(() => {
    if (tableContainerRef.current) {
      const calculateHeight = () => {
        const containerTop =
          tableContainerRef.current?.getBoundingClientRect().top || 0;
        const availableHeight = window.innerHeight - containerTop - 296;
        setTableHeight(`${Math.max(300, availableHeight)}px`);
      };

      calculateHeight();
      window.addEventListener("resize", calculateHeight);
      return () => window.removeEventListener("resize", calculateHeight);
    }
  }, []);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const renderHeader = () => {
    return (
      <div className="mb-5 flex flex-col flex-wrap items-center justify-between md:flex-row">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">
            <span className="text-slate-600 dark:text-slate-100">{title}</span>
            {totalRecords !== undefined && totalRecords > 0 && (
              <p className="text-sm text-gray-500">
                {totalRecords} Record{`${totalRecords === 1 ? "" : "s"}`} found
              </p>
            )}
          </h2>
        </div>

        <div className="flex flex-col flex-wrap gap-2 md:flex-row">
          {!hideSearch && (
            <span className="p-input-icon-left">
              <i className="pi pi-search text-gray-500" />
              <InputText
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                placeholder="Search..."
                className="h-[2.35rem] w-full pl-8"
                style={{ fontSize: "13px" }}
              />
            </span>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {actionButton?.visible && (
              <Button
                label={actionButton.label}
                size="small"
                className="h-11"
                onClick={actionButton.onClick}
              />
            )}

            {otherActions
              .filter((action) => {
                if (typeof action.visible === "function") {
                  return action.visible();
                }
                return action.visible !== false;
              })
              .map((action, index) => (
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

            {bulkActions.map((action, index) => (
              <Button
                key={`bulk-action-${index}`}
                icon={action.icon}
                label={`${action.label} (${selectedItem?.length || 0})`}
                severity={action.severity || "secondary"}
                size="small"
                onClick={action.onClick}
                disabled={action.disabled || !selectedItem}
                className={`whitespace-nowrap ${action.className || ""}`}
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
    <div
      ref={tableContainerRef}
      className="flex h-full flex-col overflow-hidden"
    >
      <DataTable
        value={data}
        paginator={true}
        paginatorClassName="fixed-bottom-paginator border-t border-gray-200"
        paginatorPosition="bottom"
        rows={currentRows}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        size="small"
        dataKey={getUniqueKeyField()}
        filters={filters}
        filterDisplay="menu"
        loading={loading}
        globalFilterFields={globalSearchFields as string[]}
        header={renderHeader}
        emptyMessage="No data found."
        scrollHeight={tableHeight}
        scrollable={true}
        resizableColumns={false}
        columnResizeMode="fit"
        tableStyle={{ minWidth: "100%" }}
        totalRecords={totalRecords}
        lazy={!!paginator}
        first={paginator ? (paginator.currentPage - 1) * currentRows : 0}
        onPage={handlePage}
        selectionMode={selectionMode}
        selection={selectedItem as unknown as DataTableValueArray}
        onSelectionChange={(e: DataTableSelectionMultipleChangeEvent<T[]>) =>
          onSelectionChange &&
          onSelectionChange(e.value as DataTableSelection<T>)
        }
        onRowClick={handleRowClick}
        rowClassName={() => "cursor-pointer hover:bg-gray-50"}
        className="table-with-fixed-paginator"
        pt={{
          tbody: { className: "text-[13px]" },
          headerRow: { className: "text-[14px] font-semibold" },
          paginator: { root: { className: "sticky-paginator" } },
          root: { className: "flex flex-col h-full" },
          wrapper: { className: "flex-grow" },
        }}
      >
        {displayColumns.map((col, index) => (
          <Column key={index} {...convertToColumnProps(col)} />
        ))}
      </DataTable>
    </div>
  );
};

export default Table as <T>(props: TableProps<T>) => JSX.Element;
