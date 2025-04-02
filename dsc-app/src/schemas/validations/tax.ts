import * as yup from "yup";

export const taxConfigurationSchema = yup.object({
  name: yup.string().required("Configuration name is required"),
  tax_rate: yup
    .number()
    .required("Tax rate is required")
    .min(0, "Tax rate must be at least 0"),
  effective_from: yup.string().required("Effective from date is required"),
  effective_until: yup.string().nullable(),
  description: yup.string().nullable(),
});
