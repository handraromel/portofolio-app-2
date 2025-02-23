import React, { useRef } from "react";
import { Modal } from "@/components/Common";
import { userSubmissionSchema } from "@/utils/validationSchemas";
import { Formik, Form, Field, FormikProps } from "formik";
import {
  UserDataSubmission,
  UserRole,
  SubmissionProps,
  RoleOption,
  User,
} from "@/types/user";
import { FieldSelect, InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useAppDispatch } from "@/hooks/useStore";
import { useToast } from "@/context/Toast";
import { useUserManagement } from "@/store/actions/useUserManagement";
import { usePermission } from "@/hooks";
import { updateAuthUser } from "@/store/slices/authSlice";
import { ApiError } from "@/types/api";

const USER_ROLES: UserRole[] = ["admin", "user"];

export const Submission: React.FC<SubmissionProps> = ({
  visible,
  onHide,
  user,
  isProfileEdit = false,
}) => {
  const { hasRole } = usePermission();
  const isSuperAdmin = hasRole("superadmin");
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useToast();
  const { createUser, updateUser } = useUserManagement();
  const formikRef = useRef<FormikProps<UserDataSubmission> | null>(null);

  const roleOptions: RoleOption[] = USER_ROLES.map((role) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    value: role,
  }));

  const handleReset = () => {
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
  };

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
        confirmPassword: undefined,
      };

      if (user) {
        const updatedUser = await updateUser(user.id, submissionData);
        showSuccess("User updated successfully");

        if (isProfileEdit && updatedUser) {
          dispatch(updateAuthUser(updatedUser as User));
        }
      } else {
        await createUser(submissionData);
        showSuccess("User created successfully");
      }
      onHide();
    } catch (err) {
      const error = err as ApiError;
      const errorMessage = error.response?.data.msg || "Operation failed";
      showError(errorMessage);
    }
  };

  const modalIcons = (
    <>
      <Tooltip target=".resetIcon" position="top" content="Reset form" />
      <div
        onClick={handleReset}
        className="resetIcon group relative h-8 w-8 cursor-pointer rounded-full text-center text-gray-400 transition-all hover:bg-gray-500/7 hover:text-gray-700 dark:hover:bg-gray-100/3 dark:hover:text-gray-100"
        aria-label="Reset form"
      >
        <i className="pi pi-refresh mt-[7px]" />
      </div>
    </>
  );

  return (
    <>
      <Modal
        visible={visible}
        onHide={onHide}
        header={
          user
            ? isProfileEdit
              ? "Update your profile"
              : "Update User"
            : "Create User"
        }
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
                {!isProfileEdit && !user && (
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
                {!isProfileEdit && isSuperAdmin && (
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
