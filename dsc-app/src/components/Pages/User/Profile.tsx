import React, { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { useAppSelector } from "@/hooks/useStore";
import { formatDate } from "@/utils/formatDate";
import { PasswordChange, Submission as UserSubmission } from "./Modals";

const Profile: React.FC = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.user);

  if (!currentUser) return null;

  const header = (
    <div className="flex h-48 w-full items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
      <div className="text-9xl text-gray-50">
        {`${currentUser.first_name[0]}${currentUser.last_name[0]}`}
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full space-y-6 p-4 sm:mt-[50px] md:w-2xl">
      <Card header={header} className="shadow-lg">
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-between space-y-6 sm:flex-row sm:space-y-0">
            <div className="max-sm:text-center">
              <h1 className="text-2xl font-bold text-indigo-400 sm:text-3xl">
                {currentUser.first_name} {currentUser.last_name}
              </h1>
              <p className="text-[14px] text-gray-600 sm:text-lg dark:text-indigo-100">
                {currentUser.email}
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                icon="pi pi-user-edit"
                rounded
                outlined
                severity="info"
                aria-label="Edit Profile"
                onClick={() => setShowEditModal(true)}
                tooltip="Edit Profile"
                tooltipOptions={{ position: "top" }}
              />
              <Button
                icon="pi pi-key"
                rounded
                outlined
                severity="warning"
                aria-label="Change Password"
                onClick={() => setShowPasswordModal(true)}
                tooltip="Change Password"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          </div>

          <Divider />

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-600 dark:text-slate-500">
                Username
              </p>
              <p>{currentUser.username}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-600 dark:text-slate-500">
                Role
              </p>
              <Tag
                severity={
                  currentUser.role === "superadmin"
                    ? "danger"
                    : currentUser.role === "admin"
                      ? "warning"
                      : "info"
                }
                value={
                  currentUser.role.charAt(0).toUpperCase() +
                  currentUser.role.slice(1)
                }
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-600 dark:text-slate-500">
                Status
              </p>
              <Tag
                severity={currentUser.is_active ? "success" : "danger"}
                value={currentUser.is_active ? "Active" : "Inactive"}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-600 dark:text-slate-500">
                Member Since
              </p>
              <p>{formatDate(currentUser.created_at)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Profile Modal */}
      <UserSubmission
        visible={showEditModal}
        onHide={() => setShowEditModal(false)}
        user={currentUser}
        isProfileEdit={true}
      />

      <PasswordChange
        visible={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
        userId={currentUser.id}
      />
    </div>
  );
};

export default Profile;
