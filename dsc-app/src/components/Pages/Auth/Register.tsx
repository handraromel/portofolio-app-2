import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector, useAutoDismiss } from "@/hooks";
import { setMessage } from "@/store/slices/authSlice";
import { useAuth } from "@/actions/useAuth";
import { InputField } from "@/components/Inputs";
import { Message } from "@/components/Common";
import { Button } from "primereact/button";
import { registerSchema } from "@/schemas/validations/auth";
import { RegisterSubmission } from "@/types/auth";
import { ApiError } from "@/types/api";

const Register: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuth();
  const { message } = useAppSelector((state) => state.auth);

  const registerForm = useForm<
    RegisterSubmission & { confirmPassword: string }
  >({
    resolver: yupResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      confirmPassword: "",
    },
  });

  const { isValid, isDirty } = registerForm.formState;

  useAutoDismiss(message);

  const onSubmit = async (
    values: RegisterSubmission & { confirmPassword: string },
  ) => {
    const submitData: RegisterSubmission = {
      username: values.username,
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
      password: values.password,
    };

    try {
      const response = await registerUser(submitData);
      if (response?.success) {
        navigate("/login", {
          replace: true,
          state: {
            message:
              "Registration successful. Please check your email to activate your account.",
          },
        });
      }
    } catch (error) {
      const err = error as ApiError;
      const errorMessage = err.response?.data.msg || "Operation failed";
      dispatch(setMessage({ text: errorMessage, type: "error" }));
    }
  };

  return (
    <div className="relative">
      <div className="absolute -top-14 -right-9 opacity-50 drop-shadow transition-all duration-300 hover:opacity-100 max-sm:-right-4">
        <button className="outline-none" onClick={() => navigate("/login")}>
          <i className="pi pi-times h-6 w-6" />
        </button>
      </div>

      <h3 className="mt-2 mb-5 text-center text-xl text-gray-600">
        Create your account
      </h3>

      <div className="mb-5">
        {message && <Message message={message.text} type={message.type} />}
      </div>

      <FormProvider {...registerForm}>
        <form
          onSubmit={registerForm.handleSubmit(onSubmit)}
          className="space-y-12"
        >
          <div className="space-y-3">
            <InputField
              id="username"
              name="username"
              type="text"
              label="Username (will be used for login after your account is activated)"
              placeholder="Username"
            />
            <InputField
              id="email"
              name="email"
              type="text"
              label="Email address"
              placeholder="Email address"
            />
            <InputField
              id="first_name"
              name="first_name"
              type="text"
              label="First Name"
              placeholder="First Name"
            />
            <InputField
              id="last_name"
              name="last_name"
              type="text"
              label="Last Name"
              placeholder="Last Name"
            />
            <InputField
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Password"
              passwordFeedback
            />
            <InputField
              id="confirm-password"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Confirm Password"
            />
          </div>

          <div className="flex justify-center pb-2">
            <Button
              type="submit"
              label="Create Account"
              size="small"
              rounded
              loading={isLoading}
              disabled={!isDirty || !isValid || isLoading}
            />
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default Register;
