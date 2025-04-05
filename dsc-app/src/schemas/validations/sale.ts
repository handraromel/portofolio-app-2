import * as yup from "yup";
import { SaleSubmission } from "@/types/sale";

export const saleSubmissionSchema = yup.object<SaleSubmission>().shape({
  sale_qty: yup
    .number()
    .required("Sale quantity is required")
    .min(0, "Sale quantity cannot be negative")
    .integer("Sale quantity must be a whole number"),

  discounted_amt: yup
    .number()
    .required("Discount amount is required")
    .min(0, "Discount amount cannot be negative")
    .test(
      "is-decimal",
      "Discount amount can have up to 2 decimal places",
      (value) => {
        if (value === undefined) return true;
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      },
    ),

  sale_amt: yup
    .number()
    .required("Sale amount is required")
    .min(0, "Sale amount cannot be negative")
    .test(
      "is-decimal",
      "Sale amount can have up to 2 decimal places",
      (value) => {
        if (value === undefined) return true;
        return /^\d+(\.\d{1,2})?$/.test(value.toString());
      },
    ),

  sku: yup.string().nullable().max(50, "SKU cannot exceed 50 characters"),

  item_no: yup
    .string()
    .nullable()
    .max(50, "Item number cannot exceed 50 characters"),

  input_date: yup
    .string()
    .required("Input date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),

  description: yup
    .string()
    .nullable()
    .max(255, "Description cannot exceed 255 characters"),

  product_brand_id: yup
    .string()
    .required("Product brand is required")
    .uuid("Invalid brand ID format"),

  product_group_id: yup
    .string()
    .required("Product group is required")
    .uuid("Invalid group ID format"),

  product_division_id: yup
    .string()
    .required("Product division is required")
    .uuid("Invalid division ID format"),

  product_category_id: yup
    .string()
    .required("Product category is required")
    .uuid("Invalid category ID format"),
});
