import React, { useEffect, useRef } from "react";
import { Modal } from "@/components/Common";
import { userSubmissionSchema } from "@/utils/validationSchemas";
import { Formik, Form, Field, FormikProps } from "formik";
import {
  UserDataSubmission,
  UserRole,
  SubmissionProps,
  RoleOption,
} from "@/types/user";
import { FieldSelect, InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useToast } from "@/context/Toast";
import {
  createUser,
  updateUser,
  fetchUsers,
} from "@/store/actions/userActions";
import { usePermission } from "@/hooks";

const USER_ROLES: UserRole[] = ["superadmin", "admin", "user"];

export const Submission: React.FC<SubmissionProps> = ({
  visible,
  onHide,
  user,
}) => {
  const { hasRole } = usePermission();
  const isSuperAdmin = hasRole("superadmin");

  const roleOptions: RoleOption[] = USER_ROLES.map((role) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    value: role,
  }));

  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useToast();
  const { error } = useAppSelector((state) => state.user);
  const formikRef = useRef<FormikProps<UserDataSubmission> | null>(null);

  const handleReset = () => {
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
  };

  useEffect(() => {
    if (error?.message) {
      showError(error.message);
    }
  }, [error, showError]);

  const defaultValues: UserDataSubmission = {
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    role: "user",
    password: "",
    confirmPassword: "",
  };

  const initialValues: UserDataSubmission = user
    ? {
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      }
    : defaultValues;

  const handleSubmit = async (values: UserDataSubmission) => {
    try {
      const submissionData = {
        ...values,
        password: user ? undefined : values.password,
        confirmPassword: undefined, // Always remove confirmPassword
      };

      if (user) {
        const result = await dispatch(
          updateUser({
            userId: user.id,
            data: submissionData,
          }),
        );

        if (updateUser.fulfilled.match(result)) {
          showSuccess("User updated successfully");
          await dispatch(fetchUsers());
          onHide();
        }
      } else {
        const result = await dispatch(createUser(submissionData));

        if (createUser.fulfilled.match(result)) {
          showSuccess("User created successfully");
          await dispatch(fetchUsers());
          onHide();
        }
      }
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  const modalIcons = (
    <>
      <Tooltip target=".resetIcon" position="top" content="Reset form" />
      <div
        onClick={handleReset}
        className="resetIcon group relative mr-2 cursor-pointer rounded-full p-2 text-gray-400 transition-all hover:bg-gray-100/3 hover:text-gray-100"
        aria-label="Reset form"
      >
        <ArrowPathIcon className="h-5 w-5" />
      </div>
    </>
  );

  return (
    <>
      <Modal
        visible={visible}
        onHide={onHide}
        header={user ? "Update User" : "Create User"}
        className="w-[500px]"
        icons={modalIcons}
      >
        <div className="p-4">
          <Formik
            initialValues={initialValues}
            validationSchema={userSubmissionSchema(!!user)}
            innerRef={formikRef}
            onSubmit={handleSubmit}
          >
            {({ isValid, dirty, isSubmitting }) => (
              <Form className="space-y-4">
                <Field
                  as={InputField}
                  id="email"
                  name="email"
                  type="text"
                  label="Email"
                  placeholder="Email"
                />
                <Field
                  as={InputField}
                  id="username"
                  name="username"
                  type="text"
                  label="Username"
                  placeholder="Username"
                />
                <Field
                  as={InputField}
                  id="first_name"
                  name="first_name"
                  type="text"
                  label="First Name"
                  placeholder="First Name"
                />
                <Field
                  as={InputField}
                  id="last_name"
                  name="last_name"
                  type="text"
                  label="Last Name"
                  placeholder="Last Name"
                />
                {!user && (
                  <>
                    <Field
                      as={InputField}
                      id="password"
                      name="password"
                      type="password"
                      label="Password"
                      placeholder="Password"
                    />
                    <Field
                      as={InputField}
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      label="Password"
                      placeholder="Confirm Password"
                    />
                  </>
                )}
                {isSuperAdmin && (
                  <Field
                    as={FieldSelect}
                    id="role"
                    name="role"
                    label="Role"
                    options={roleOptions}
                    placeholder="Select a Role"
                  />
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    label="Cancel"
                    severity="secondary"
                    outlined
                    size="small"
                    onClick={onHide}
                  />
                  <Button
                    type="submit"
                    label="Submit"
                    size="small"
                    loading={isSubmitting}
                    disabled={!(isValid && dirty) || isSubmitting}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>
    </>
  );
};

export default Submission;
