// src/components/Auth/Login.tsx
import React from "react";
import { Formik, Form, Field } from "formik";
import FieldInput from "components/Inputs/FieldInput";
import Button from "components/Common/Button";
import { loginSchema } from "utils/validationSchemas";

const Login: React.FC = () => {
  const FormInitialValues = {
    email: "",
    password: "",
  };
  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    // Implement login logic here
    console.log("Login attempt with:", values);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSubmitting(false);
  };

  return (
    <div>
      <h3 className="mt-2 text-center text-xl text-gray-600">
        Sign in to your account
      </h3>
      <Formik
        initialValues={FormInitialValues}
        validationSchema={loginSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting, isValid, dirty }) => (
          <Form className="mt-8 space-y-12">
            <div className="space-y-3 rounded-md shadow-sm">
              <Field
                as={FieldInput}
                id="email-address"
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
            </div>

            <div className="flex justify-center pb-2">
              <Button
                type="submit"
                buttonText="Sign in"
                loadingState={isSubmitting}
                disabled={!(isValid && dirty) || isSubmitting}
                bgColor={
                  !(isValid && dirty) || isSubmitting ? "secondary" : "primary"
                }
                fixedWidth
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Login;
