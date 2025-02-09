import React, { useRef } from "react";
import { User } from "@/types/user";
import Modal from "@/components/Common/Modal";
import { userEditSchema } from "@/utils/validationSchemas";
import { Formik, Form, Field } from "formik";
import { UpdateUserData } from "@/types/user";
import FieldInput from "@/components/Inputs/FieldInput";
import { Button } from "primereact/button";
import { useAppDispatch } from "@/hooks/useStore";
import { Toast } from "primereact/toast";
import { updateUser, fetchUsers } from "@/store/actions/userActions";

interface EditModalProps {
  visible: boolean;
  onHide: () => void;
  user: User | null;
}

export const EditModal: React.FC<EditModalProps> = ({
  visible,
  onHide,
  user,
}) => {
  const dispatch = useAppDispatch();
  const toast = useRef<Toast>(null);

  if (!user) return null;

  const initialValues: UpdateUserData = {
    email: user.email,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
  };

  const handleSubmit = async (values: UpdateUserData) => {
    try {
      const result = await dispatch(
        updateUser({ userId: user.id, data: values }),
      );

      if (updateUser.fulfilled.match(result)) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "User updated successfully",
          life: 3000,
        });

        // Refresh users list
        await dispatch(fetchUsers());
        onHide();
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update user",
        life: 3000,
      });
      console.error("Failed to update user:", error);
    }
  };

  return (
    <>
      <Toast ref={toast} position="bottom-right" />
      <Modal
        visible={visible}
        onHide={onHide}
        header="Update User"
        className="w-[500px]"
      >
        <div className="p-4">
          <Formik
            initialValues={initialValues}
            validationSchema={userEditSchema}
            onSubmit={handleSubmit}
          >
            {({ isValid, dirty, isSubmitting }) => (
              <Form className="space-y-4">
                <Field
                  as={FieldInput}
                  id="email"
                  name="email"
                  type="text"
                  label="Email"
                  placeholder="Email"
                />
                <Field
                  as={FieldInput}
                  id="username"
                  name="username"
                  type="text"
                  label="Username"
                  placeholder="Username"
                />
                <Field
                  as={FieldInput}
                  id="first_name"
                  name="first_name"
                  type="text"
                  label="First Name"
                  placeholder="First Name"
                />
                <Field
                  as={FieldInput}
                  id="last_name"
                  name="last_name"
                  type="text"
                  label="Last Name"
                  placeholder="Last Name"
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
                    label="Update"
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

export default EditModal;
