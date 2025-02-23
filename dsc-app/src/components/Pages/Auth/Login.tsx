import React, { useEffect } from "react";
import { Formik, Form, Field } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector, useAutoDismiss } from "@/hooks";
import { setMessage } from "@/store/slices/authSlice";
import { useAuth } from "@/store/actions/useAuth";
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

  const FormInitialValues = {
    username: "",
    password: "",
  };

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

  const handleSubmit = async (values: LoginData) => {
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

      <Formik
        initialValues={FormInitialValues}
        validationSchema={loginSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isValid, dirty }) => (
          <Form className="space-y-12">
            <div className="space-y-3">
              <Field
                as={InputField}
                id="username"
                name="username"
                type="text"
                label="Username"
                placeholder="Username"
                error={touched.username && errors.username}
              />
              <Field
                as={InputField}
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="Password"
                error={touched.password && errors.password}
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
                disabled={!(isValid && dirty) || isLoading}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Login;
