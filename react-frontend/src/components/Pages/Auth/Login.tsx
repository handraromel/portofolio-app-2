import React from "react";
import { Formik, Form, Field } from "formik";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "hooks/store";
import { login } from "store/actions/authActions";
import FieldInput from "components/Inputs/FieldInput";
import Button from "components/Common/Button";
import { loginSchema } from "utils/validationSchemas";

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isLoading, error } = useAppSelector((state) => state.auth);

  const FormInitialValues = {
    username: "",
    password: "",
  };

  const handleSubmit = async (values: typeof FormInitialValues) => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div>
      <h3 className="mt-2 text-center text-xl text-gray-600">
        Sign in to your account
      </h3>
      {error && <p className="text-red-500">{error}</p>}
      <Formik
        initialValues={FormInitialValues}
        validationSchema={loginSchema}
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
                label="Username"
                placeholder="Username"
                error={touched.username && errors.username}
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
                loadingState={isLoading}
                disabled={!(isValid && dirty) || isLoading}
                bgColor={
                  !(isValid && dirty) || isLoading ? "secondary" : "primary"
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
