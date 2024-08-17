import React, { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "hooks/useStore";
import { clearMessage } from "store/slices/authSlice";
import { register } from "store/actions/authActions";
import FieldInput from "components/Inputs/FieldInput";
import { Button, Message } from "components/Common";
import { registerSchema } from "utils/validationSchemas";

type RegisterSubmitData = {
  username: string;
  email: string;
  password: string;
};

const Register: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isLoading, message } = useAppSelector((state) => state.auth);

  const FormInitialValues = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
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
    const submitData: RegisterSubmitData = {
      username: values.username,
      email: values.email,
      password: values.password,
    };

    const result = await dispatch(register(submitData));
    if (register.fulfilled.match(result)) {
      navigate("/login", {
        state: {
          message:
            "Registration successful. Please check your email to activate your account.",
        },
      });
    }
  };

  return (
    <div>
      <h3 className="mb-5 mt-2 text-center text-xl text-gray-600">
        Create your account
      </h3>

      <div className="mb-5">
        {message && <Message message={message.text} type={message.type} />}
      </div>

      <Formik
        initialValues={FormInitialValues}
        validationSchema={registerSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isValid, dirty }) => (
          <Form className="space-y-12">
            <div className="space-y-3">
              <Field
                as={FieldInput}
                id="username"
                name="username"
                type="text"
                label="Username (will be used for login after your account is activated)"
                placeholder="Username"
                error={touched.username && errors.username}
              />
              <Field
                as={FieldInput}
                id="email"
                name="email"
                type="text"
                label="Email address"
                placeholder="Email address"
                error={touched.email && errors.email}
              />
              <Field
                as={FieldInput}
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="Password"
                error={touched.password && errors.password}
              />
              <Field
                as={FieldInput}
                id="confirm-password"
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="Confirm Password"
                error={touched.confirmPassword && errors.confirmPassword}
              />
            </div>

            <div className="flex justify-center pb-2">
              <Button
                type="submit"
                buttonText="Create Account"
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

export default Register;
