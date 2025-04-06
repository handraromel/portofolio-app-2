import React, { useEffect } from "react";
import { Modal } from "@/components/Common";
import { useForm, FormProvider } from "react-hook-form";
import { InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { useBrand } from "@/actions/product/useBrand";
import { useGroup } from "@/actions/product/useGroup";
import { useDivision } from "@/actions/product/useDivision";
import { useCategory } from "@/actions/product/useCategory";
import FieldSelect from "@/components/Inputs/InputSelect";
import { FilterData } from "@/types/sale";
import { getTodayFormatted, formatDateForAPI } from "@/utils/formatDate";

interface FilterProps {
  visible: boolean;
  onHide: () => void;
  onApply: (filters: FilterData) => void;
  currentFilters?: FilterData;
  filterType: "list" | "daily" | "mtd";
}

const Filter: React.FC<FilterProps> = ({
  visible,
  onHide,
  onApply,
  currentFilters = {},
  filterType,
}) => {
  // Get product data for dropdowns
  const { brands } = useBrand();
  const { groups } = useGroup();
  const { divisions } = useDivision();
  const { categories } = useCategory();

  const defaultValues: FilterData = {
    start_date: "",
    end_date: "",
    brand_id: "",
    group_id: "",
    division_id: "",
    category_id: "",
    date: getTodayFormatted(),
  };

  const filterForm = useForm<FilterData>({
    defaultValues,
  });

  const { handleSubmit, reset } = filterForm;

  // Reset form when modal opens with current filters
  useEffect(() => {
    if (visible) {
      const initialValues = {
        ...defaultValues,
        ...currentFilters,
      };

      // Reset with current filters or defaults
      reset(initialValues);
    }
  }, [visible, reset, currentFilters]);

  const onSubmit = (data: FilterData) => {
    // Format dates properly before sending them to the API
    const formattedData = { ...data };

    if (formattedData.start_date) {
      formattedData.start_date =
        formatDateForAPI(formattedData.start_date) || "";
    }

    if (formattedData.end_date) {
      formattedData.end_date = formatDateForAPI(formattedData.end_date) || "";
    }

    if (formattedData.date) {
      formattedData.date = formatDateForAPI(formattedData.date) || "";
    }

    // Clean up empty strings
    const cleanData = Object.entries(formattedData).reduce(
      (acc, [key, value]) => {
        if (value !== "") {
          acc[key as keyof FilterData] = value;
        }
        return acc;
      },
      {} as Partial<FilterData>,
    );

    onApply(cleanData);
    onHide();
  };

  const handleClear = () => {
    const emptyFilters =
      filterType === "list"
        ? {
            start_date: "",
            end_date: "",
            brand_id: "",
            group_id: "",
            division_id: "",
            category_id: "",
          }
        : {
            date: getTodayFormatted(),
            brand_id: "",
            group_id: "",
            division_id: "",
            category_id: "",
          };

    reset(emptyFilters);

    // Apply the cleared filters
    onApply({});
    onHide();
  };

  // Handle cancel button to close modal without applying filters
  const handleCancel = () => {
    onHide();
  };

  // Transform arrays to dropdown options
  const brandOptions = brands.map((brand) => ({
    label: `${brand.id} - ${brand.name}`,
    value: brand.uuid,
  }));
  const groupOptions = groups.map((group) => ({
    label: `${group.id} - ${group.name}`,
    value: group.uuid,
  }));
  const divisionOptions = divisions.map((division) => ({
    label: `${division.name} - ${division.alias}`,
    value: division.uuid,
  }));
  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.uuid,
  }));

  // Add empty option for each dropdown
  const emptyOption = { label: "-- Select --", value: "" };
  brandOptions.unshift(emptyOption);
  groupOptions.unshift(emptyOption);
  divisionOptions.unshift(emptyOption);
  categoryOptions.unshift(emptyOption);

  return (
    <Modal
      visible={visible}
      onHide={handleCancel}
      header={`${filterType === "list" ? "Sales" : filterType === "daily" ? "Daily Sales" : "MTD Sales"} Filters`}
      className="w-[600px]"
      blockOutsideClick
    >
      <div className="p-4">
        <FormProvider {...filterForm}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {filterType === "list" ? (
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  id="start_date"
                  name="start_date"
                  type="datepicker"
                  label="Start Date"
                  placeholder="Select start date"
                />
                <InputField
                  id="end_date"
                  name="end_date"
                  type="datepicker"
                  label="End Date"
                  placeholder="Select end date"
                />
              </div>
            ) : (
              <div className="mb-4">
                <InputField
                  id="date"
                  name="date"
                  type="datepicker"
                  maxDate={new Date()}
                  label={
                    filterType === "daily" ? "Select Date" : "Select Month"
                  }
                  placeholder={
                    filterType === "daily" ? "Select date" : "Select month"
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FieldSelect
                id="brand_id"
                name="brand_id"
                label="Brand"
                options={brandOptions}
                placeholder="Select brand"
              />
              <FieldSelect
                id="group_id"
                name="group_id"
                label="Group"
                options={groupOptions}
                placeholder="Select group"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldSelect
                id="division_id"
                name="division_id"
                label="Division"
                options={divisionOptions}
                placeholder="Select division"
              />
              <FieldSelect
                id="category_id"
                name="category_id"
                label="Category"
                options={categoryOptions}
                placeholder="Select category"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                label="Clear"
                severity="secondary"
                outlined
                size="small"
                onClick={handleClear}
              />
              <Button
                type="button"
                label="Cancel"
                severity="secondary"
                outlined
                size="small"
                onClick={handleCancel}
              />
              <Button type="submit" label="Apply Filters" size="small" />
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
};

export default Filter;
