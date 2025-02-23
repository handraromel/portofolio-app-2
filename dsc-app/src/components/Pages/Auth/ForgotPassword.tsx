import React from "react";
import { Formik, Form, Field } from "formik";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector, useAutoDismiss } from "@/hooks";
import { useAuth } from "@/store/actions/useAuth";
import { InputField } from "@/components/Inputs";
import { Message } from "@/components/Common";
import { Button } from "primereact/button";
import { forgotPasswordSchema } from "@/utils/validationSchemas";
import { ForgotPasswordData } from "@/types/auth";
import { ApiError } from "@/types/api";
import { setMessage } from "@/store/slices/authSlice";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { forgotPassword, isLoading } = useAuth();

  const { message } = useAppSelector((state) => state.auth);

  const FormInitialValues = {
    email: "",
  };

  useAutoDismiss(message);

  const handleSubmit = async (values: typeof FormInitialValues) => {
    const submitData: ForgotPasswordData = {
      email: values.email,
    };

    try {
      await forgotPassword(submitData);
      navigate("/login", {
        replace: true,
        state: {
          message: "Your new password already sent to you email.",
        },
      });
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.response?.data.msg || "Failed to send email";
      dispatch(
        setMessage({
          text: errorMessage,
          type: "error",
        }),
      );
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
        Input email to change your password
      </h3>

      <div className="mb-5">
        {message && <Message message={message.text} type={message.type} />}
      </div>

      <Formik
        initialValues={FormInitialValues}
        validationSchema={forgotPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isValid, dirty }) => (
          <Form className="space-y-12">
            <div className="space-y-3">
              <Field
                as={InputField}
                id="email"
                name="email"
                type="text"
                label="Email address"
                placeholder="Email address"
                error={touched.email && errors.email}
              />
            </div>

            <div className="flex justify-center pb-2">
              <Button
                type="submit"
                label="Submit"
                size="small"
                rounded
                loading={isLoading}
                disabled={!(isValid && dirty) || isLoading}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ForgotPassword;
