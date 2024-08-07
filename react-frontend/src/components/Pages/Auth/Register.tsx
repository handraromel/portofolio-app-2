// src/components/Auth/Register.tsx
import React from "react";
import { Formik, Form, Field } from "formik";
import FieldInput from "components/Inputs/FieldInput";
import Button from "components/Common/Button";
import { registerSchema } from "utils/validationSchemas";

const Register: React.FC = () => {
  const FormInitialValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };
  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    // Implement registration logic here
    console.log("Registration attempt with:", values);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSubmitting(false);
  };

  return (
    <div>
      <h3 className="mt-2 text-center text-xl text-gray-600">
        Create your account
      </h3>
      <Formik
        initialValues={FormInitialValues}
        validationSchema={registerSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting, isValid, dirty }) => (
          <Form className="mt-8 space-y-12">
            <div className="space-y-3 rounded-md shadow-sm">
              <Field
                as={FieldInput}
                id="name"
                name="name"
                type="text"
                label="Full Name"
                placeholder="Full Name"
                error={touched.name && errors.name}
              />
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
                loadingState={isSubmitting}
                disabled={!(isValid && dirty) || isSubmitting}
                bgColor={
                  !(isValid && dirty) || isSubmitting ? "secondary" : "primary"
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
