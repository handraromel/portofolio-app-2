import React from "react";
import { User } from "@/types/user";
import { Modal } from "@/components/Common";
import { formatDate } from "@/utils/formatDate";

interface DetailModalProps {
  visible: boolean;
  onHide: () => void;
  user: User | null;
}

export const Detail: React.FC<DetailModalProps> = ({
  visible,
  onHide,
  user,
}) => {
  return (
    <Modal
      visible={visible}
      onHide={onHide}
      header="User Details"
      className="w-[500px]"
    >
      {user && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <p className="font-semibold">Username:</p>
            <p>{user.username}</p>
            <p className="font-semibold">Email:</p>
            <p>{user.email}</p>
            <p className="font-semibold">Full Name:</p>
            <p>{`${user.first_name} ${user.last_name}`}</p>
            <p className="font-semibold">Role:</p>
            <p>{user.role}</p>
            <p className="font-semibold">Status:</p>
            <p>{user.is_active ? "Active" : "Inactive"}</p>
            <p className="font-semibold">Created At:</p>
            <p>{formatDate(user.created_at)}</p>
            <p className="font-semibold">Updated At:</p>
            <p>{formatDate(user.updated_at)}</p>
          </div>
        </div>
      )}
    </Modal>
  );
};
