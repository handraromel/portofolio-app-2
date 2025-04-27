import React, { useEffect } from "react";
import { Modal } from "@/components/Common";
import { productCategorySchema } from "@/schemas/validations/product";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ProductCategory, ProductCategorySubmission } from "@/types/product";
import { InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useToast } from "@/context/Toast";
import { useCategory } from "@/actions/product/useCategory";
import { ApiError } from "@/types/api";

interface SubmissionProps {
  visible: boolean;
  onHide: () => void;
  category: ProductCategory | null;
}

const defaultValues: ProductCategorySubmission = {
  name: "",
};

const Submission: React.FC<SubmissionProps> = ({
  visible,
  onHide,
  category,
}) => {
  const { showSuccess, showError } = useToast();
  const { createCategory, updateCategory, isLoading } = useCategory();

  const extractCategoryValues = (
    category: ProductCategory | null,
  ): ProductCategorySubmission => {
    if (!category) return defaultValues;

    return {
      name: category.name,
    };
  };

  const submissionForm = useForm<ProductCategorySubmission>({
    resolver: yupResolver<ProductCategorySubmission>(productCategorySchema),
    mode: "onBlur",
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (visible) {
      submissionForm.reset(
        category ? extractCategoryValues(category) : defaultValues,
      );
    }
  }, [visible, category, submissionForm]);

  const { isValid, isDirty, isSubmitting } = submissionForm.formState;

  const handleReset = () => {
    submissionForm.reset(
      category ? extractCategoryValues(category) : defaultValues,
    );
  };

  const handleSubmit = async (values: ProductCategorySubmission) => {
    try {
      if (category) {
        await updateCategory(category.uuid, values);
        showSuccess("Category updated successfully");
      } else {
        await createCategory(values);
        showSuccess("Category created successfully");
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
      header={category ? "Update Category" : "Create Category"}
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
              label="Category Name"
              placeholder="Category Name"
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
                label={category ? "Update" : "Submit"}
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
