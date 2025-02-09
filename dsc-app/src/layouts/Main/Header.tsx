import React, { useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { toggleTheme } from "@/store/slices/themeSlice";
import { logout } from "@/store/actions/authActions";
import { useNavigate } from "react-router-dom";
import { OverlayPanel } from "primereact/overlaypanel";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

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
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const op = useRef<OverlayPanel>(null);

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

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      navigate(item.href);
    }
    op.current?.hide();
  };

  return (
    <header className="surface-ground sticky top-0 z-50 bg-white shadow-md transition-all duration-300 dark:bg-black">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <button
            onClick={toggleMenu}
            className="text-primary hover:text-primary-600 focus:outline-none lg:hidden"
            aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>

          <div className="flex items-center">
            <h1 className="text-900 ml-4 text-xl font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center">
            <button
              className="text-primary hover:text-primary-600 flex items-center focus:outline-none"
              onClick={(e) => op.current?.toggle(e)}
              aria-label="User Menu"
            >
              <UserCircleIcon className="h-8 w-8" />
            </button>

            <button
              onClick={() => dispatch(toggleTheme())}
              className="text-primary hover:text-primary-600 focus:outline-none"
              aria-label={
                isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
            >
              {isDarkMode ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </button>

            <OverlayPanel ref={op} className="surface-card">
              <div className="py-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item)}
                    className="text-900 hover:surface-hover w-full px-4 py-2 text-left"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </OverlayPanel>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
