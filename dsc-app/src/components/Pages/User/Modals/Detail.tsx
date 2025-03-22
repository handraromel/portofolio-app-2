import React from "react";
import { User } from "@/types/user";
import { Modal } from "@/components/Common";
import { formatDate } from "@/utils/formatDate";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Divider } from "primereact/divider";
import { formatDistanceToNow } from "date-fns";

type SeverityType = "danger" | "warning" | "info" | "secondary";

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
  if (!user) return null;

  const createdDate = new Date(user.created_at);

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getRoleColor = (role: string): SeverityType => {
    switch (role.toLowerCase()) {
      case "superadmin":
        return "danger";
      case "admin":
        return "warning";
      case "user":
        return "info";
      default:
        return "secondary";
    }
  };

  const getFirstLetters = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      onHide={onHide}
      header="User Details"
      className="w-[550px]"
    >
      <div className="p-5">
        {/* User header with avatar */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              label={getFirstLetters(user.first_name, user.last_name)}
              size="large"
              shape="circle"
              className="bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {`${user.first_name} ${user.last_name}`}
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                @{user.username}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Tag
              value={user.role}
              severity={getRoleColor(user.role)}
              className="px-3 py-1"
            />
            <Tag
              value={user.is_active ? "Active" : "Inactive"}
              severity={user.is_active ? "success" : "danger"}
              className="px-3 py-1"
            />
          </div>
        </div>

        {/* Contact information */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <div className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
            Contact Information
          </div>
          <div className="mt-2 flex items-center gap-2">
            <i className="pi pi-envelope text-blue-500"></i>
            <a
              href={`mailto:${user.email}`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {user.email}
            </a>
          </div>
        </div>

        <Divider align="center">
          <span className="px-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
            Account Details
          </span>
        </Divider>

        {/* Account information */}
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Username
            </div>
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {user.username}
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Account Created
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              {formatDate(user.created_at)}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {getTimeAgo(createdDate)}
            </div>
          </div>
        </div>

        {/* Permissions section */}
        <div className="mt-6">
          <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            Access Level
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {user.role === "superadmin" && "Full system access"}
                  {user.role === "admin" && "Administrative privileges"}
                  {user.role === "user" && "Standard user access"}
                </div>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${user.role === "superadmin" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" : ""} ${user.role === "admin" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300" : ""} ${user.role === "user" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" : ""} `}
              >
                <i
                  className={` ${user.role === "superadmin" ? "pi pi-shield" : ""} ${user.role === "admin" ? "pi pi-cog" : ""} ${user.role === "user" ? "pi pi-user" : ""} text-lg`}
                ></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
