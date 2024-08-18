import React, { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "hooks/useStore";
import { clearMessage } from "store/slices/authSlice";
import { forgotPassword } from "store/actions/authActions";
import FieldInput from "components/Inputs/FieldInput";
import { Button, Message } from "components/Common";
import { forgotPasswordSchema } from "utils/validationSchemas";
import { XMarkIcon } from "@heroicons/react/24/solid";

const ForgotPassword: React.FC = () => {
  type ForgotPasswordData = {
    email: string;
  };

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isLoading, message } = useAppSelector((state) => state.auth);

  const FormInitialValues = {
    email: "",
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        dispatch(clearMessage());
      }, 5200);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  const handleSubmit = async (values: typeof FormInitialValues) => {
    const submitData: ForgotPasswordData = {
      email: values.email,
    };

    const result = await dispatch(forgotPassword(submitData));
    if (forgotPassword.fulfilled.match(result)) {
      navigate("/login", {
        replace: true,
        state: {
          message: "Your new password already sent to you email.",
        },
      });
    }
  };

  return (
    <div className="relative">
      <div className="absolute -right-9 -top-14 opacity-50 drop-shadow transition-all duration-300 hover:opacity-100">
        <button className="outline-none" onClick={() => navigate("/login")}>
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <h3 className="mb-5 mt-2 text-center text-xl text-gray-600">
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
                as={FieldInput}
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
                buttonText="submit"
                loadingState={isLoading}
                disabled={!(isValid && dirty) || isLoading}
                bgColor={
                  !(isValid && dirty) || isLoading ? "secondary" : "primary"
                }
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ForgotPassword;
