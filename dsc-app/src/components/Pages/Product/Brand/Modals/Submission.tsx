import React, { useEffect } from "react";
import { Modal } from "@/components/Common";
import { productBrandSchema } from "@/schemas/validations/product";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ProductBrand, ProductBrandSubmission } from "@/types/product";
import { InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useToast } from "@/context/Toast";
import { useBrand } from "@/actions/product/useBrand";
import { ApiError } from "@/types/api";

interface SubmissionProps {
  visible: boolean;
  onHide: () => void;
  brand: ProductBrand | null;
}

const defaultValues: ProductBrandSubmission = {
  id: "",
  name: "",
};

const Submission: React.FC<SubmissionProps> = ({ visible, onHide, brand }) => {
  const { showSuccess, showError } = useToast();
  const { createBrand, updateBrand, isLoading } = useBrand();

  const extractBrandValues = (
    brand: ProductBrand | null,
  ): ProductBrandSubmission => {
    if (!brand) return defaultValues;

    return {
      id: brand.id,
      name: brand.name,
    };
  };

  const submissionForm = useForm<ProductBrandSubmission>({
    resolver: yupResolver<ProductBrandSubmission>(productBrandSchema),
    mode: "onBlur",
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (visible) {
      submissionForm.reset(brand ? extractBrandValues(brand) : defaultValues);
    }
  }, [visible, brand, submissionForm]);

  const { isValid, isDirty, isSubmitting } = submissionForm.formState;

  const handleReset = () => {
    submissionForm.reset(brand ? extractBrandValues(brand) : defaultValues);
  };

  const handleSubmit = async (values: ProductBrandSubmission) => {
    try {
      if (brand) {
        await updateBrand(brand.uuid, values);
        showSuccess("Brand updated successfully");
      } else {
        await createBrand(values);
        showSuccess("Brand created successfully");
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
      header={brand ? "Update Brand" : "Create Brand"}
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
              label="Brand ID"
              placeholder="Brand ID"
              numericOnly
              disabled={!!brand}
            />
            <InputField
              id="name"
              name="name"
              type="text"
              label="Brand Name"
              placeholder="Brand Name"
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
                label={brand ? "Update" : "Submit"}
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
