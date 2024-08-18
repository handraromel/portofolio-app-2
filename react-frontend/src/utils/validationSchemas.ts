import * as Yup from "yup";

const passwordRules = /^(?=.*\d)(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[a-z]).{8,}$/;

export const loginSchema = Yup.object().shape({
  username: Yup.string()
    .required("Username is required")
    .min(3, "Name should at least more than 2 characters"),
  password: Yup.string()
    .matches(passwordRules, {
      message:
        "Password must contain at least 8 characters, one uppercase letter, one number, and one special character",
    })
    .required("Password is required"),
});

export const registerSchema = Yup.object().shape({
  username: Yup.string()
    .required("Name is required")
    .min(3, "Name should at least more than 2 characters"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .matches(passwordRules, {
      message:
        "Password must contain at least 8 characters, one uppercase letter, one number, and one special character",
    })
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
});
