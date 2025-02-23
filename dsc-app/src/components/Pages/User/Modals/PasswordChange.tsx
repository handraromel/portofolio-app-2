import React, { useCallback, useState } from "react";
import { Modal } from "@/components/Common";
import { passwordChangeSchema } from "@/utils/validationSchemas";
import { Formik, Form, Field } from "formik";
import { InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { useToast } from "@/context/Toast";
import { useUserManagement, useAuth } from "@/store/actions";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "react-use";

interface PasswordChangeProps {
  visible: boolean;
  onHide: () => void;
  userId: string;
}

interface PasswordChangeData {
  password: string;
  confirmPassword: string;
}

export const PasswordChange: React.FC<PasswordChangeProps> = ({
  visible,
  onHide,
  userId,
}) => {
  const { showSuccess, showError } = useToast();

  const { updatePassword, checkPassword, error } = useUserManagement();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [debouncedCheckInProgress, setDebouncedCheckInProgress] =
    useState(false);
  const [isSamePassword, setIsSamePassword] = useState(false);

  const initialValues: PasswordChangeData = {
    password: "",
    confirmPassword: "",
  };

  const handleSubmit = async (values: PasswordChangeData) => {
    try {
      await updatePassword(userId, {
        new_password: values.password,
      });
      showSuccess("Password updated successfully, try to login again");
      onHide();
      await logout();
      navigate("/login");
    } catch (err) {
      showError(
        error instanceof Error ? error.message : "Failed to update password",
      );
      console.error("Password update failed:", err);
    }
  };

  const checkCurrentPassword = useCallback(
    async (password: string) => {
      if (!password) {
        setIsSamePassword(false);
        return;
      }

      setDebouncedCheckInProgress(true);
      try {
        const response = await checkPassword(userId, password);
        setIsSamePassword(response?.isSame ?? false);
      } catch (err) {
        console.error("Password check failed:", err);
        setIsSamePassword(false);
      } finally {
        setDebouncedCheckInProgress(false);
      }
    },
    [userId, checkPassword],
  );

  useDebounce(
    (value: string) => {
      if (value) {
        checkCurrentPassword(value);
      }
    },
    500,
    [],
  );

  const validationSchema = React.useMemo(
    () =>
      passwordChangeSchema((newPassword: string) => {
        checkCurrentPassword(newPassword);
        return isSamePassword;
      }),
    [checkCurrentPassword, isSamePassword],
  );

  return (
    <Modal
      visible={visible}
      onHide={onHide}
      header="Change Password"
      className="w-[500px]"
    >
      <div className="p-4">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          validateOnChange={false}
          validateOnBlur={true}
          onSubmit={handleSubmit}
        >
          {({ isValid, dirty, isSubmitting }) => (
            <Form className="space-y-4">
              <Field
                as={InputField}
                id="password"
                name="password"
                type="password"
                label="New Password"
                placeholder="Enter new password"
              />
              <Field
                as={InputField}
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="Confirm new password"
              />

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
                  label="Update Password"
                  size="small"
                  loading={isSubmitting || debouncedCheckInProgress}
                  disabled={
                    !(isValid && dirty) ||
                    isSubmitting ||
                    debouncedCheckInProgress
                  }
                />
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
};

export default PasswordChange;
