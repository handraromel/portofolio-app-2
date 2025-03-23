import React, { useEffect } from "react";
import { Modal } from "@/components/Common";
import { productDivisionSchema } from "@/schemas/validations/product";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ProductDivision, ProductDivisionSubmission } from "@/types/product";
import { InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useToast } from "@/context/Toast";
import { useDivision } from "@/actions/product/useDivision";
import { ApiError } from "@/types/api";

interface SubmissionProps {
  visible: boolean;
  onHide: () => void;
  division: ProductDivision | null;
}

const defaultValues: ProductDivisionSubmission = {
  name: "",
  alias: null,
};

const Submission: React.FC<SubmissionProps> = ({
  visible,
  onHide,
  division,
}) => {
  const { showSuccess, showError } = useToast();
  const { createDivision, updateDivision, isLoading } = useDivision();

  const extractDivisionValues = (
    division: ProductDivision | null,
  ): ProductDivisionSubmission => {
    if (!division) return defaultValues;

    return {
      name: division.name,
      alias: division.alias,
    };
  };

  const submissionForm = useForm<ProductDivisionSubmission>({
    resolver: yupResolver<ProductDivisionSubmission>(productDivisionSchema),
    mode: "onBlur",
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (visible) {
      submissionForm.reset(
        division ? extractDivisionValues(division) : defaultValues,
      );
    }
  }, [visible, division, submissionForm]);

  const { isValid, isDirty, isSubmitting } = submissionForm.formState;

  const handleReset = () => {
    submissionForm.reset(
      division ? extractDivisionValues(division) : defaultValues,
    );
  };

  const handleSubmit = async (values: ProductDivisionSubmission) => {
    try {
      if (division) {
        await updateDivision(division.uuid, values);
        showSuccess("Division updated successfully");
      } else {
        await createDivision(values);
        showSuccess("Division created successfully");
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
      header={division ? "Update Division" : "Create Division"}
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
              label="Division Name"
              placeholder="Division Name"
            />
            <InputField
              id="alias"
              name="alias"
              type="text"
              label="Alias (Optional)"
              placeholder="Division Alias"
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
                label="Submit"
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
