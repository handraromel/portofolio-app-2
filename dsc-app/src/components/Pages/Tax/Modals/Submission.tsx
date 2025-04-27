import React, { useEffect } from "react";
import { Modal } from "@/components/Common";
import { taxConfigurationSchema } from "@/schemas/validations/tax";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { TaxConfiguration, TaxConfigurationSubmission } from "@/types/tax";
import { InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useToast } from "@/context/Toast";
import { useTax } from "@/actions/useTax";
import { ApiError } from "@/types/api";
import {
  getTodayFormatted,
  formatDateFromAPI,
  formatDateForAPI,
} from "@/utils/formatDate";

interface SubmissionProps {
  visible: boolean;
  onHide: () => void;
  taxConfig?: TaxConfiguration | null;
}

const defaultValues: TaxConfigurationSubmission = {
  name: "",
  tax_rate: 0,
  effective_from: getTodayFormatted(),
  effective_until: null,
  description: null,
};

const Submission: React.FC<SubmissionProps> = ({
  visible,
  onHide,
  taxConfig,
}) => {
  const { showSuccess, showError } = useToast();
  const { createTaxConfig, updateTaxConfig, isLoading } = useTax();

  const extractTaxConfigValues = (
    taxConfig: TaxConfiguration | null,
  ): TaxConfigurationSubmission => {
    if (!taxConfig) return defaultValues;

    return {
      name: taxConfig.name,
      tax_rate: taxConfig.tax_rate,
      effective_from:
        formatDateFromAPI(taxConfig.effective_from) || getTodayFormatted(),
      effective_until: formatDateFromAPI(taxConfig.effective_until),
      description: taxConfig.description,
    };
  };

  const submissionForm = useForm<TaxConfigurationSubmission>({
    resolver: yupResolver<TaxConfigurationSubmission>(taxConfigurationSchema),
    mode: "onBlur",
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (visible) {
      submissionForm.reset(
        taxConfig ? extractTaxConfigValues(taxConfig) : defaultValues,
      );
    }
  }, [visible, taxConfig, submissionForm]);

  const { isValid, isDirty, isSubmitting } = submissionForm.formState;

  const handleReset = () => {
    submissionForm.reset(
      taxConfig ? extractTaxConfigValues(taxConfig) : defaultValues,
    );
  };

  const handleSubmit = async (values: TaxConfigurationSubmission) => {
    try {
      // Format dates properly for API submission
      const formattedValues = {
        ...values,
        effective_from:
          formatDateForAPI(values.effective_from) || getTodayFormatted(),
        effective_until: formatDateForAPI(values.effective_until),
      };

      if (taxConfig) {
        await updateTaxConfig(taxConfig.uuid, formattedValues);
        showSuccess("Tax configuration updated successfully");
      } else {
        await createTaxConfig(formattedValues);
        showSuccess("Tax configuration created successfully");
      }
      onHide();
      submissionForm.reset(defaultValues);
    } catch (err) {
      const error = err as ApiError;
      const errorMessage = error.response?.data?.msg || "Operation failed";
      showError(errorMessage);
    }
  };

  const modalIcons = (
    <>
      <Tooltip target=".resetIcon" position="top" content="Reset form" />
      <div
        onClick={handleReset}
        className="resetIcon group relative h-8 w-8 cursor-pointer rounded-full text-center text-gray-400 transition-all hover:bg-gray-500/7 hover:text-gray-700 dark:hover:bg-gray-100/3 dark:hover:text-gray-100"
        aria-label="Reset form"
      >
        <i className="pi pi-refresh mt-[7px]" />
      </div>
    </>
  );

  // Close handler that ensures form is reset
  const handleClose = () => {
    onHide();
    submissionForm.reset(defaultValues);
  };

  return (
    <Modal
      visible={visible}
      onHide={handleClose}
      header={
        taxConfig ? "Update Tax Configuration" : "Create Tax Configuration"
      }
      className="w-[500px]"
      onClose={handleReset}
      icons={modalIcons}
      blockOutsideClick
    >
      <div className="p-4">
        <FormProvider {...submissionForm}>
          <form
            onSubmit={submissionForm.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <InputField
              id="name"
              name="name"
              type="text"
              label="Configuration Name"
              placeholder="Enter tax configuration name"
            />

            <InputField
              id="tax_rate"
              name="tax_rate"
              type="number"
              label="Tax Rate (%)"
              placeholder="Enter tax rate percentage"
            />

            <InputField
              id="effective_from"
              name="effective_from"
              type="datepicker"
              label="Effective From"
              placeholder="Select start date"
            />

            <InputField
              id="effective_until"
              name="effective_until"
              type="datepicker"
              label="Effective Until (Optional)"
              placeholder="Select end date (leave empty for no end date)"
            />

            <InputField
              id="description"
              name="description"
              type="text"
              label="Description (Optional)"
              placeholder="Enter a description"
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                label="Cancel"
                severity="secondary"
                outlined
                size="small"
                onClick={handleClose}
              />
              <Button
                type="submit"
                label={taxConfig ? "Update" : "Submit"}
                size="small"
                loading={isSubmitting || isLoading}
                disabled={!isValid || !isDirty || isSubmitting || isLoading}
              />
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
};

export default Submission;
