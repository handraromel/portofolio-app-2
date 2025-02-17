import React from "react";
import { Link } from "react-router-dom";
import { usePermission, useNavigation } from "@/hooks";

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  href?: string;
  subItems?: MenuItem[];
  permissions?: string[];
}

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  {
    id: "account",
    label: "My Profile",
    href: "/user/profile",
  },
  {
    id: "manageUser",
    label: "Manage Users",
    href: "/users",
    permissions: ["canEdit", "canDelete"],
  },
];

const Navigation: React.FC<NavigationProps> = ({ isOpen, onClose }) => {
  const { canEdit, canDelete } = usePermission();
  const { navRef, openSubMenus, toggleSubMenu, isDragging } = useNavigation({
    isOpen,
    onClose,
  });

  const hasPermission = (permissions?: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;

    return permissions.some((permission) => {
      switch (permission) {
        case "canEdit":
          return canEdit();
        case "canDelete":
          return canDelete();
        default:
          return false;
      }
    });
  };

  const renderMenuItem = (item: MenuItem) => {
    if (!hasPermission(item.permissions)) {
      return null;
    }

    if (item.subItems) {
      const visibleSubItems = item.subItems.filter((subItem) =>
        hasPermission(subItem.permissions),
      );

      if (visibleSubItems.length === 0) {
        return null;
      }

      return (
        <li key={item.id}>
          <button
            onClick={() => toggleSubMenu(item.id)}
            className="flex w-full items-center justify-between rounded px-4 py-2 text-left transition duration-200 hover:bg-indigo-600 hover:text-white"
          >
            {item.label}
            <i
              className={`pi pi-chevron-down h-5 w-5 transition-transform duration-200 ${
                openSubMenus[item.id] ? "rotate-180 transform" : ""
              }`}
            />
          </button>
          <ul
            className={`mt-2 ml-4 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
              openSubMenus[item.id]
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {visibleSubItems.map((subItem) => renderMenuItem(subItem))}
          </ul>
        </li>
      );
    }

    return (
      <li key={item.id}>
        <Link
          to={item.href || "#"}
          className="block rounded px-4 py-2 transition duration-200 hover:bg-indigo-600 hover:text-white"
        >
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 z-50 h-full w-72 transform overflow-y-auto bg-white text-slate-900 transition-transform duration-300 ease-in-out dark:bg-slate-800 dark:text-slate-200 ${isOpen ? "translate-x-0" : "-translate-x-full"} ${isDragging ? "transition-none" : ""} pt-16 shadow-xl lg:translate-x-0 lg:pt-0`}
    >
      <div className="p-6">
        <h2 className="mb-6 text-2xl font-extrabold text-indigo-500">
          Daily Sales Control
        </h2>
        <ul className="space-y-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
