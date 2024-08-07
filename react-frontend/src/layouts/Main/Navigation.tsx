import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

interface NavigationProps {
  isOpen: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  href?: string;
  subItems?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  {
    id: "recipes",
    label: "Recipes",
    subItems: [
      { id: "add-recipe", label: "Add Recipe", href: "/recipes/add" },
      { id: "update-recipe", label: "Update Recipe", href: "/recipes/update" },
    ],
  },
  { id: "account", label: "My Account", href: "/account" },
  { id: "settings", label: "Settings", href: "/settings" },
];

const Navigation: React.FC<NavigationProps> = ({ isOpen }) => {
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  const toggleSubMenu = (id: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMenuItem = (item: MenuItem) => {
    if (item.subItems) {
      return (
        <li key={item.id}>
          <button
            onClick={() => toggleSubMenu(item.id)}
            className="flex w-full items-center justify-between rounded px-4 py-2 text-left transition duration-200 hover:bg-indigo-600 hover:text-white"
          >
            {item.label}
            <ChevronDownIcon
              className={`h-5 w-5 transition-transform duration-200 ${
                openSubMenus[item.id] ? "rotate-180 transform" : ""
              }`}
            />
          </button>
          <ul
            className={`ml-4 mt-2 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
              openSubMenus[item.id]
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {item.subItems.map((subItem) => renderMenuItem(subItem))}
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
      className={`fixed left-0 top-0 h-full w-72 transform overflow-y-auto bg-slate-800 text-slate-200 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } pt-16 shadow-xl lg:translate-x-0 lg:pt-0`}
    >
      <div className="p-6">
        <h2 className="mb-6 text-2xl font-extrabold text-indigo-600">
          Savory Script
        </h2>
        <ul className="space-y-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
