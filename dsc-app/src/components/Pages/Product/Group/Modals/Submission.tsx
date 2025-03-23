import React, { useEffect } from "react";
import { Modal } from "@/components/Common";
import { productGroupSchema } from "@/schemas/validations/product";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ProductGroup, ProductGroupSubmission } from "@/types/product";
import { InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useToast } from "@/context/Toast";
import { useGroup } from "@/actions/product/useGroup";
import { ApiError } from "@/types/api";

interface SubmissionProps {
  visible: boolean;
  onHide: () => void;
  group: ProductGroup | null;
}

const defaultValues: ProductGroupSubmission = {
  id: null,
  name: "",
};

const Submission: React.FC<SubmissionProps> = ({ visible, onHide, group }) => {
  const { showSuccess, showError } = useToast();
  const { createGroup, updateGroup, isLoading } = useGroup();

  const extractGroupValues = (
    group: ProductGroup | null,
  ): ProductGroupSubmission => {
    if (!group) return defaultValues;

    return {
      id: group.id,
      name: group.name,
    };
  };

  const submissionForm = useForm<ProductGroupSubmission>({
    resolver: yupResolver<ProductGroupSubmission>(productGroupSchema),
    mode: "onBlur",
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (visible) {
      submissionForm.reset(group ? extractGroupValues(group) : defaultValues);
    }
  }, [visible, group, submissionForm]);

  const { isValid, isDirty, isSubmitting } = submissionForm.formState;

  const handleReset = () => {
    submissionForm.reset(group ? extractGroupValues(group) : defaultValues);
  };

  const handleSubmit = async (values: ProductGroupSubmission) => {
    try {
      if (group) {
        await updateGroup(group.uuid, values);
        showSuccess("Group updated successfully");
      } else {
        await createGroup(values);
        showSuccess("Group created successfully");
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
      header={group ? "Update Group" : "Create Group"}
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
              id="id"
              name="id"
              type="text"
              label="Group ID"
              placeholder="Group ID"
              numericOnly
              disabled={!!group}
            />
            <InputField
              id="name"
              name="name"
              type="text"
              label="Group Name"
              placeholder="Group Name"
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
