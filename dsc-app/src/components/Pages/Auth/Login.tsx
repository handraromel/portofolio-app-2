import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector, useAutoDismiss } from "@/hooks";
import { setMessage } from "@/store/slices/authSlice";
import { useAuth } from "@/actions/useAuth";
import { InputField } from "@/components/Inputs";
import { Message } from "@/components/Common";
import { Button } from "primereact/button";
import { loginSchema } from "@/utils/validationSchemas";
import { LoginData } from "@/types/auth";
import { ApiError } from "@/types/api";

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const { message } = useAppSelector((state) => state.auth);
  const loginForm = useForm<LoginData>({
    resolver: yupResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const { isValid, isDirty } = loginForm.formState;

  useAutoDismiss(message);

  useEffect(() => {
    if (
      location.state &&
      "message" in location.state &&
      "type" in location.state
    ) {
      dispatch(
        setMessage({
          text: location.state.message as string,
          type: location.state.type as "success" | "error" | "info",
        }),
      );
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, dispatch, navigate, location.pathname]);

  const onSubmit = async (values: LoginData) => {
    try {
      await login(values);
      navigate("/");
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data.msg || "Login failed";
      dispatch(
        setMessage({
          text: errorMessage,
          type: "error",
        }),
      );
    }
  };

  return (
    <div>
      <h3 className="mt-2 mb-5 text-center text-xl">
        Sign in to your account
        <br />
      </h3>
      <div className="mb-5">
        {message && <Message message={message.text} type={message.type} />}
      </div>
      <FormProvider {...loginForm}>
        <form
          onSubmit={loginForm.handleSubmit(onSubmit)}
          className="space-y-12"
        >
          <div className="space-y-3">
            <InputField
              id="username"
              name="username"
              type="text"
              label="Username"
              placeholder="Username"
            />
            <InputField
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Password"
            />
          </div>

          <div className="flex justify-center pb-2">
            <Button
              type="submit"
              label="Sign in"
              className="w-32"
              size="small"
              loading={isLoading}
              rounded
              disabled={!isDirty || !isValid || isLoading}
            />
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default Login;
