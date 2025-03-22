import * as yup from "yup";
import {
  ProductBrandSubmission,
  ProductCategorySubmission,
} from "@/types/product";

export const productBrandSchema = yup.object<ProductBrandSubmission>().shape({
  id: yup
    .number()
    .required("Brand ID is required")
    .positive("Brand ID must be positive"),
  name: yup
    .string()
    .required("Brand name is required")
    .min(1, "Brand name is required")
    .max(25, "Brand name must be at most 25 characters"),
});

export const productCategorySchema = yup
  .object<ProductCategorySubmission>()
  .shape({
    name: yup
      .string()
      .required("Category name is required")
      .max(25, "Brand name must be at most 25 characters"),
  });
