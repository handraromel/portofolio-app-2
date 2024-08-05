import React, { useState } from "react";
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
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
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
            className="w-full text-left flex items-center justify-between py-2 px-4 rounded hover:bg-indigo-600 hover:text-white transition duration-200"
          >
            {item.label}
            <ChevronDownIcon
              className={`w-5 h-5 transition-transform duration-200 ${
                openSubMenus[item.id] ? "transform rotate-180" : ""
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
        <a
          href={item.href}
          className="block py-2 px-4 rounded hover:bg-indigo-600 hover:text-white transition duration-200"
        >
          {item.label}
        </a>
      </li>
    );
  };

  return (
    <nav
      className={`bg-slate-800 text-slate-200 w-72 h-full fixed top-0 left-0 overflow-y-auto transition-transform duration-300 ease-in-out transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 pt-16 lg:pt-0 shadow-xl`}
    >
      <div className="p-6">
        <h2 className="text-2xl mb-6 text-indigo-600 font-extrabold">
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
