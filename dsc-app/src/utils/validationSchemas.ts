import * as Yup from "yup";

const passwordRules =
  /^(?=.*\d)(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[a-z])[A-Za-z\d!@#$%^&*]{8,20}$/;

export const loginSchema = Yup.object().shape({
  username: Yup.string()
    .required("Username is required")
    .min(3, "Name should at least more than 2 characters"),
  password: Yup.string()
    .matches(passwordRules, {
      message:
        "Password must be 8-20 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character",
    })
    .required("Password is required"),
});

export const registerSchema = Yup.object().shape({
  username: Yup.string()
    .required("Name is required")
    .min(3, "Name should at least more than 2 characters"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  first_name: Yup.string().required("First name is required"),
  last_name: Yup.string().required("Last name is required"),
  password: Yup.string()
    .matches(passwordRules, {
      message:
        "Password must be 8-20 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character",
    })
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
});

export const userSubmissionSchema = (isUpdate = false) =>
  Yup.object().shape({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    username: Yup.string().required("Username is required"),
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    ...(isUpdate
      ? {}
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
  });

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
