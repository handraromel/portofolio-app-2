import React from "react";
import { Formik, Form, Field } from "formik";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "hooks/useStore";
import { register } from "store/actions/authActions";
import FieldInput from "components/Inputs/FieldInput";
import Button from "components/Common/Button";
import { registerSchema } from "utils/validationSchemas";

const Register: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isLoading, error } = useAppSelector((state) => state.auth);

  const FormInitialValues = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const handleSubmit = async (values: typeof FormInitialValues) => {
    const result = await dispatch(register(values));
    if (register.fulfilled.match(result)) {
      navigate("/login");
    }
  };

  return (
    <div>
      <h3 className="mt-2 text-center text-xl text-gray-600">
        Create your account
      </h3>
      {error && <p className="text-red-500">{error}</p>}
      <Formik
        initialValues={FormInitialValues}
        validationSchema={registerSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isValid, dirty }) => (
          <Form className="mt-8 space-y-12">
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
