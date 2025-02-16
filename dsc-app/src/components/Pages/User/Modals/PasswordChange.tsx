import React, { useEffect, useState } from "react";
import { Modal } from "@/components/Common";
import { passwordChangeSchema } from "@/utils/validationSchemas";
import { Formik, Form, Field } from "formik";
import { InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { useToast } from "@/context/Toast";
import {
  checkCurrentPassword,
  updateUserPassword,
} from "@/store/actions/userActions";
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
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.user);
  const { showSuccess, showError } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [debouncedCheckInProgress, setDebouncedCheckInProgress] =
    useState(false);
  const [isSamePassword, setIsSamePassword] = useState(false);

  const initialValues: PasswordChangeData = {
    password: "",
    confirmPassword: "",
  };

  const handleSubmit = async (values: PasswordChangeData) => {
    try {
      const result = await dispatch(
        updateUserPassword({
          userId,
          data: {
            new_password: values.password,
          },
        }),
      );

      if (updateUserPassword.fulfilled.match(result)) {
        showSuccess("Password updated successfully");
        onHide();
      }
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  useDebounce(
    () => {
      const checkPassword = async () => {
        if (!currentPassword) return;

        setDebouncedCheckInProgress(true);
        try {
          const response = await dispatch(
            checkCurrentPassword({
              userId,
              data: { new_password: currentPassword },
            }),
          ).unwrap();
          setIsSamePassword(response.isSame);
        } catch (error) {
          console.error("Password check failed:", error);
          setIsSamePassword(false);
        } finally {
          setDebouncedCheckInProgress(false);
        }
      };

      checkPassword();
    },
    500,
    [currentPassword],
  );

  const validationSchema = React.useMemo(
    () =>
      passwordChangeSchema((newPassword: string) => {
        setCurrentPassword(newPassword);
        return isSamePassword;
      }),
    [isSamePassword],
  );

  useEffect(() => {
    if (error?.message && visible) {
      showError(error.message);
    }
  }, [error?.message, showError, visible]);

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
