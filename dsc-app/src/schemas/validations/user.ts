import { UserDataSubmission } from "@/types/user";
import * as Yup from "yup";
import { passwordRules } from "@/utils/passwordRules";

export const userSubmissionSchema = (isUpdate = false) =>
  Yup.object().shape({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    username: Yup.string().required("Username is required"),
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    role: Yup.string()
      .oneOf(["superadmin", "admin", "user"] as const)
      .required("Role is required"),
    ...(isUpdate
      ? {
          password: Yup.string().optional(),
          confirmPassword: Yup.string().optional(),
        }
      : {
          password: Yup.string()
            .matches(passwordRules, {
              message:
                "Password must be 8-20 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character",
            })
            .required("Password is required"),
          confirmPassword: Yup.string()
            .oneOf([Yup.ref("password")], "Passwords must match")
            .required("Confirm Password is required"),
        }),
  }) as Yup.ObjectSchema<UserDataSubmission>;

export const passwordChangeSchema = (
  checkPassword: (password: string) => boolean,
) =>
  Yup.object().shape({
    password: Yup.string()
      .required("Password is required")
      .matches(passwordRules, {
        message:
          "Password must be 8-20 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character",
      })
      .test({
        name: "not-same-as-current",
        message: "New password must be different from current password",
        test: (value) => {
          if (!value) return true;
          return !checkPassword(value);
        },
      }),
    confirmPassword: Yup.string()
      .required("Confirm Password is required")
      .oneOf([Yup.ref("password")], "Passwords must match"),
  });
