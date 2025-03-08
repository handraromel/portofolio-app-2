import * as yup from "yup";

export const productBrandSchema = yup.object().shape({
  id: yup
    .number()
    .required("Brand ID is required")
    .positive("Brand ID must be positive"),
  name: yup
    .string()
    .required("Brand name is required")
    .min(1, "Brand name is required")
    .max(100, "Brand name must be at most 100 characters"),
});
