import React from "react";
import { useAppDispatch } from "hooks/useStore";
import { logout } from "store/actions/authActions";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  UserCircleIcon,
  Bars4Icon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

interface HeaderProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isMenuOpen, toggleMenu }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const isLogout = await dispatch(logout());
    if (isLogout) {
      navigate("/login");
    }
  };

  const menuItems: MenuItem[] = [
    { id: "profile", label: "User Profile", href: "/profile" },
    { id: "logout", label: "Logout", onClick: handleLogout },
  ];

  return (
    <header className="sticky top-0 bg-slate-900 text-slate-200 shadow-md transition-all duration-300">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <button
              className="mr-4 mt-1 text-slate-200 outline-none transition-all duration-200 hover:text-indigo-500 lg:hidden"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars4Icon className="h-6 w-6" />
              )}
            </button>
            <span className="text-xl">Dashboard</span>
          </div>
          <Popover className="relative">
            <PopoverButton className="flex items-center text-sm font-medium outline-none transition-all duration-200 hover:text-indigo-600">
              <span className="sr-only">Open user menu</span>
              <UserCircleIcon className="h-8 w-8" />
            </PopoverButton>

            <PopoverPanel className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <ul className="m-2">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="block rounded px-4 py-2 text-sm text-slate-700 transition-all duration-200 hover:bg-indigo-500 hover:text-white"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <button
                        onClick={item.onClick}
                        className="block w-full rounded px-4 py-2 text-left text-sm text-slate-700 transition-all duration-200 hover:bg-indigo-500 hover:text-white"
                      >
                        {item.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </PopoverPanel>
          </Popover>
        </div>
      </div>
    </header>
  );
};

export default Header;
