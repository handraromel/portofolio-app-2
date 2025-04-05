import React, { useCallback, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import { TaxConfiguration } from "@/types/tax";
import { Confirmation, ColumnDef } from "@/components/Common";
import { useModal, usePermission } from "@/hooks";
import { useToast } from "@/context/Toast";
import { useTax } from "@/actions/useTax";
import Table from "@/components/Common/Table";
import Submission from "./Modals/Submission";
import Details from "./Modals/Details";
import { Tag } from "primereact/tag";
import { dateFormats } from "@/constants/dateFormats";

const TaxConfigurationList: React.FC = () => {
  const { canEdit, canDelete } = usePermission();
  const {
    taxConfigurations,
    pagination,
    isLoading,
    error,
    fetchTaxConfigs,
    deleteTaxConfig,
    searchTaxConfigs,
    changePage,
    changePerPage,
    taxConfigsQuery,
    filters,
  } = useTax();

  const { showWarning, showError } = useToast();
  const responseMsg = taxConfigsQuery.data?.msg;
  const [selectedTaxConfig, setSelectedTaxConfig] =
    useState<TaxConfiguration | null>(null);
  const submissionModal = useModal();
  const detailModal = useModal();
  const [triggerDelete, setTriggerDelete] = useState(false);

  const handleSubmission = (taxConfig?: TaxConfiguration) => {
    setSelectedTaxConfig(taxConfig ?? null);
    submissionModal.open();
  };

  const handleView = (taxConfig: TaxConfiguration) => {
    setSelectedTaxConfig(taxConfig);
    detailModal.open();
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedTaxConfig) {
      try {
        await deleteTaxConfig(selectedTaxConfig.uuid);
        showWarning(responseMsg || "Tax configuration deleted successfully");
        setTriggerDelete(false);
      } catch {
        showError(responseMsg || "Failed to delete tax configuration");
      }
    }
  }, [selectedTaxConfig, deleteTaxConfig, responseMsg, showWarning, showError]);

  const indexTemplate = (rowData: TaxConfiguration) => {
    const index = taxConfigurations.findIndex(
      (taxConfig) => taxConfig.uuid === rowData.uuid,
    );
    return (
      (pagination.currentPage || 1) * (filters.per_page || 10) -
      (filters.per_page || 10) +
      index +
      1
    );
  };

  const handleRefresh = useCallback(() => {
    fetchTaxConfigs();
  }, [fetchTaxConfigs]);

  const activeTemplate = (rowData: TaxConfiguration) => (
    <Tag
      value={rowData.is_active ? "Active" : "Inactive"}
      severity={rowData.is_active ? "success" : "warning"}
    />
  );

  const effectivePeriodTemplate = (rowData: TaxConfiguration) => {
    const effectiveFrom = formatDate(rowData.effective_from, {
      format: dateFormats.CALENDAR_DATE,
    });
    const effectiveUntil = rowData.effective_until
      ? formatDate(rowData.effective_until, {
          format: dateFormats.CALENDAR_DATE,
        })
      : "No end date";

    return (
      <div className="flex flex-col">
        <span>{effectiveFrom}</span>
        <span className="text-xs text-gray-500">to {effectiveUntil}</span>
      </div>
    );
  };

  const columns: ColumnDef<TaxConfiguration>[] = [
    {
      header: "No",
      body: indexTemplate,
    },
    {
      field: "name",
      header: "Name",
      sortable: true,
    },
    {
      field: "tax_rate",
      header: "Tax Rate",
      body: (rowData: TaxConfiguration) => `${rowData.tax_rate}%`,
      sortable: true,
    },
    {
      field: "is_active",
      header: "Status",
      body: activeTemplate,
      sortable: true,
    },
    {
      header: "Effective Period",
      body: effectivePeriodTemplate,
    },
    {
      field: "created_at",
      header: "Created At",
      body: (rowData: TaxConfiguration) => formatDate(rowData.created_at),
      sortable: true,
    },
    {
      field: "updated_at",
      header: "Updated At",
      body: (rowData: TaxConfiguration) => formatDate(rowData.updated_at),
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
        data={taxConfigurations}
        columns={columns}
        title="Manage Tax Configurations"
        loading={isLoading}
        globalSearchFields={["name", "description"]}
        actionButton={{
          label: "Add Tax Configuration",
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
        onSearch={searchTaxConfigs}
        actions={{
          header: "Actions",
          buttons: [
            {
              icon: "pi pi-pencil",
              tooltip: "Edit",
              severity: "success",
              onClick: (rowData) => handleSubmission(rowData),
              visible: () => canEdit(),
            },
            {
              icon: "pi pi-eye",
              tooltip: "View",
              severity: "info",
              onClick: (rowData) => handleView(rowData),
              visible: () => true,
            },
            {
              icon: "pi pi-trash",
              tooltip: "Delete",
              severity: "danger",
              onClick: (rowData) => {
                setSelectedTaxConfig(rowData);
                setTriggerDelete(true);
              },
              visible: () => canDelete(),
              disabled: (rowData) => rowData.is_active,
            },
          ],
        }}
      />

      <Submission
        visible={submissionModal.isOpen}
        onHide={submissionModal.close}
        taxConfig={selectedTaxConfig}
      />

      <Details
        visible={detailModal.isOpen}
        onHide={detailModal.close}
        taxConfig={selectedTaxConfig}
      />

      <Confirmation
        visible={triggerDelete}
        onHide={() => setTriggerDelete(false)}
        onConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete tax configuration "${selectedTaxConfig?.name}"?`}
        header="Delete Tax Configuration"
        icon="pi pi-exclamation-triangle"
        acceptLabel="Delete"
        rejectLabel="Cancel"
      />
    </>
  );
};

export default TaxConfigurationList;
