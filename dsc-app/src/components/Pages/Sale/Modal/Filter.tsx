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
import { getTodayFormatted } from "@/utils/formatDate";
import { FilterData } from "@/types/sale";

interface FilterProps {
  visible: boolean;
  onHide: () => void;
  onApply: (filters: SaleFilters) => void;
  currentFilters?: SaleFilters;
  filterType: "list" | "daily" | "mtd";
}

interface SaleFilters {
  start_date?: string;
  end_date?: string;
  brand_id?: string;
  group_id?: string;
  division_id?: string;
  category_id?: string;
  date?: string; // For daily and mtd reports
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

  const filterForm = useForm<SaleFilters>({
    defaultValues: {
      start_date: "",
      end_date: "",
      brand_id: "",
      group_id: "",
      division_id: "",
      category_id: "",
      date: getTodayFormatted(),
    },
  });

  const { handleSubmit, reset } = filterForm;

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      reset({
        ...currentFilters,
      });
    }
  }, [visible, reset, currentFilters]);

  const onSubmit = (data: SaleFilters) => {
    // Clean up empty strings
    const cleanData = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (value !== "") {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, FilterData>,
    );

    onApply(cleanData as SaleFilters);
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
  };

  // Transform arrays to dropdown options
  const brandOptions = brands.map((brand) => ({
    label: brand.name,
    value: brand.uuid,
  }));
  const groupOptions = groups.map((group) => ({
    label: group.name,
    value: group.uuid,
  }));
  const divisionOptions = divisions.map((division) => ({
    label: division.name,
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
      onHide={onHide}
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
                onClick={onHide}
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
