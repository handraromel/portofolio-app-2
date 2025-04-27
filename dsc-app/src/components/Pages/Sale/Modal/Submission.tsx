import React, { useEffect } from "react";
import { Modal } from "@/components/Common";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useToast } from "@/context/Toast";
import { useSale } from "@/actions/useSale";
import { Sale, SaleSubmission } from "@/types/sale";
import {
  formatDateForAPI,
  formatDateFromAPI,
  getTodayFormatted,
} from "@/utils/formatDate";
import { useBrand } from "@/actions/product/useBrand";
import { useGroup } from "@/actions/product/useGroup";
import { useDivision } from "@/actions/product/useDivision";
import { useCategory } from "@/actions/product/useCategory";
import { saleSubmissionSchema } from "@/schemas/validations/sale";
import FieldSelect from "@/components/Inputs/InputSelect";
import { ApiError } from "@/types/api";

interface SubmissionProps {
  visible: boolean;
  onHide: () => void;
  sale?: Sale | null;
}

const defaultValues: SaleSubmission = {
  sale_qty: 0,
  discounted_amt: 0,
  sale_amt: 0,
  sku: "",
  item_no: "",
  input_date: getTodayFormatted(),
  description: "",
  product_brand_id: "",
  product_group_id: "",
  product_division_id: "",
  product_category_id: "",
};

const Submission: React.FC<SubmissionProps> = ({ visible, onHide, sale }) => {
  const { showSuccess, showError } = useToast();
  const { createSale, updateSale, isLoading } = useSale();

  const { allBrands } = useBrand();
  const { allGroups } = useGroup();
  const { allDivisions } = useDivision();
  const { allCategories } = useCategory();

  const extractSaleValues = (sale: Sale | null): SaleSubmission => {
    if (!sale) return defaultValues;

    return {
      sale_qty: sale.sale_qty,
      discounted_amt: sale.discounted_amt,
      sale_amt: sale.sale_amt,
      sku: sale.sku,
      item_no: sale.item_no,
      input_date: formatDateFromAPI(sale.input_date) || "",
      description: sale.description,
      product_brand_id: sale.brand.uuid,
      product_group_id: sale.group.uuid,
      product_division_id: sale.division.uuid,
      product_category_id: sale.category.uuid,
    };
  };

  const submissionForm = useForm<SaleSubmission>({
    resolver: yupResolver<SaleSubmission>(saleSubmissionSchema),
    mode: "onBlur",
    defaultValues,
  });

  useEffect(() => {
    if (visible) {
      submissionForm.reset(sale ? extractSaleValues(sale) : defaultValues);
    }
  }, [visible, sale, submissionForm]);

  const { isValid, isDirty, isSubmitting } = submissionForm.formState;

  const handleReset = () => {
    submissionForm.reset(sale ? extractSaleValues(sale) : defaultValues);
  };

  const handleSubmit = async (values: SaleSubmission) => {
    try {
      const submissionData = {
        ...values,
        input_date: formatDateForAPI(values.input_date) || "",
      };

      if (sale) {
        await updateSale(sale.uuid, submissionData);
        showSuccess("Sale record updated successfully");
      } else {
        await createSale(submissionData);
        showSuccess("Sale record created successfully");
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

  const handleClose = () => {
    onHide();
    submissionForm.reset(defaultValues);
  };

  const brandOptions = allBrands.map((brand) => ({
    label: `${brand.id} - ${brand.name}`,
    value: brand.uuid,
  }));
  const groupOptions = allGroups.map((group) => ({
    label: `${group.id} - ${group.name}`,
    value: group.uuid,
  }));
  const divisionOptions = allDivisions.map((division) => ({
    label: `${division.name} - ${division.alias}`,
    value: division.uuid,
  }));
  const categoryOptions = allCategories.map((category) => ({
    label: category.name,
    value: category.uuid,
  }));

  return (
    <Modal
      visible={visible}
      onHide={handleClose}
      header={sale ? "Edit Sale Record" : "Add Sale Record"}
      className="w-[600px]"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                id="sale_qty"
                name="sale_qty"
                type="number"
                label="Quantity"
                placeholder="Enter sale quantity"
              />

              <InputField
                id="sale_amt"
                name="sale_amt"
                type="number"
                label="Sale Amount"
                placeholder="Enter sale amount"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                id="discounted_amt"
                name="discounted_amt"
                type="number"
                label="Discount Amount"
                placeholder="Enter discount amount"
              />

              <InputField
                id="input_date"
                name="input_date"
                maxDate={new Date()}
                type="datepicker"
                label="Input Date"
                placeholder="Select sale input date"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                id="sku"
                name="sku"
                type="text"
                label="SKU (Optional)"
                placeholder="Enter SKU"
              />

              <InputField
                id="item_no"
                name="item_no"
                type="text"
                label="Item Number (Optional)"
                placeholder="Enter item number"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldSelect
                id="product_brand_id"
                name="product_brand_id"
                label="Brand"
                options={brandOptions}
                placeholder="Select brand"
              />

              <FieldSelect
                id="product_group_id"
                name="product_group_id"
                label="Group"
                options={groupOptions}
                placeholder="Select group"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldSelect
                id="product_division_id"
                name="product_division_id"
                label="Division"
                options={divisionOptions}
                placeholder="Select division"
              />

              <FieldSelect
                id="product_category_id"
                name="product_category_id"
                label="Category"
                options={categoryOptions}
                placeholder="Select category"
              />
            </div>

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
                label={sale ? "Update" : "Submit"}
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
