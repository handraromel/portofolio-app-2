import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "@/components/Common";
import { passwordChangeSchema } from "@/utils/validationSchemas";
import { InputField } from "@/components/Inputs";
import { Button } from "primereact/button";
import { useToast } from "@/context/Toast";
import { useUserManagement, useAuth } from "@/actions";
import { useNavigate } from "react-router-dom";

interface PasswordChangeProps {
  visible: boolean;
  onHide: () => void;
  userId: string;
}

interface PasswordChangeData {
  password: string;
  confirmPassword: string;
}

const defaultFormValues: PasswordChangeData = {
  password: "",
  confirmPassword: "",
};

export const PasswordChange: React.FC<PasswordChangeProps> = ({
  visible,
  onHide,
  userId,
}) => {
  const { showSuccess, showError } = useToast();
  const { updatePassword, checkPassword, error } = useUserManagement();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [isSamePassword, setIsSamePassword] = useState(false);

  const passwordChangeForm = useForm<PasswordChangeData>({
    resolver: yupResolver(passwordChangeSchema(() => isSamePassword)),
    mode: "onBlur",
    defaultValues: defaultFormValues,
  });

  const { isValid, isDirty } = passwordChangeForm.formState;

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

  const handleReset = () => {
    passwordChangeForm.reset(defaultFormValues);
    setIsSamePassword(false);
    setIsCheckingPassword(false);
  };

  const handleClose = () => {
    handleReset();
    onHide();
  };

  const handlePasswordBlur = async (value: string) => {
    if (!value) {
      setIsSamePassword(false);
      return;
    }

    setIsCheckingPassword(true);
    try {
      const response = await checkPassword(userId, value);
      setIsSamePassword(response?.isSame ?? false);
    } catch (err) {
      console.error("Password check failed:", err);
      setIsSamePassword(false);
    } finally {
      setIsCheckingPassword(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onHide={handleClose}
      header="Change Password"
      className="w-[500px]"
      blockOutsideClick
    >
      <div className="p-4">
        <FormProvider {...passwordChangeForm}>
          <form
            onSubmit={passwordChangeForm.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <InputField
              id="password"
              name="password"
              type="password"
              label="New Password"
              placeholder="Enter new password"
              onBlur={handlePasswordBlur}
              passwordFeedback
            />
            <InputField
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
                loading={
                  passwordChangeForm.formState.isSubmitting ||
                  isCheckingPassword
                }
                disabled={
                  !isValid ||
                  !isDirty ||
                  passwordChangeForm.formState.isSubmitting ||
                  isCheckingPassword
                }
              />
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
};

export default PasswordChange;
