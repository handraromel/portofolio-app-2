import React, { useEffect } from "react";
import { Formik, Form, Field } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "hooks/useStore";
import { clearMessage, setMessage } from "store/slices/authSlice";
import { login } from "store/actions/authActions";
import FieldInput from "components/Inputs/FieldInput";
import { Button, Message } from "components/Common";
import { loginSchema } from "utils/validationSchemas";

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoading, message } = useAppSelector((state) => state.auth);

  const FormInitialValues = {
    username: "",
    password: "",
  };

  useEffect(() => {
    if (location.state && "message" in location.state) {
      dispatch(
        setMessage({
          text: location.state.message as string,
          type: "success",
        }),
      );
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, dispatch, navigate, location.pathname]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        dispatch(clearMessage());
      }, 5200);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  const handleSubmit = async (values: typeof FormInitialValues) => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div>
      <h3 className="mb-5 mt-2 text-center text-xl text-gray-600">
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
