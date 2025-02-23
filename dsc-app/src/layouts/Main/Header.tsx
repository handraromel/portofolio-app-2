import React, { useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useStore";
import { toggleTheme } from "@/store/slices/themeSlice";
import { useAuth } from "@/store/actions/useAuth";
import { useNavigate } from "react-router-dom";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";

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
  const currentUser = useAppSelector((state) => state.auth.user);
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const menuItems: MenuItem[] = [
    { id: "profile", label: "User Profile", href: "/user/profile" },
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

  if (!currentUser) return null;

  const userAvatar = (
    <Avatar
      label={`${currentUser.first_name[0]}${currentUser.last_name[0]}`}
      size="normal"
      shape="circle"
      className="text-4xl font-bold text-indigo-800 dark:text-indigo-100"
    />
  );

  return (
    <header className="surface-ground sticky top-0 z-50 bg-indigo-300 shadow-md transition-all duration-300 dark:bg-indigo-800">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <button
            onClick={toggleMenu}
            className="text-primary hover:text-primary-600 focus:outline-none lg:hidden"
            aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
          >
            {isMenuOpen ? (
              <i className="pi pi-times h-6 w-6" />
            ) : (
              <i className="pi pi-bars h-6 w-6" />
            )}
          </button>

          <div className="flex items-center">
            <h1 className="text-900 ml-4 text-xl font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              icon={userAvatar}
              rounded
              onClick={(e) => op.current?.toggle(e)}
              pt={{
                root: {
                  style: {
                    height: "2rem",
                    width: "2rem",
                  },
                },
              }}
            />

            <Button
              icon={
                isDarkMode ? (
                  <i className="pi pi-moon mt-[3px] h-5 w-5" />
                ) : (
                  <i className="pi pi-sun mt-[3px] h-5 w-5" />
                )
              }
              rounded
              onClick={() => dispatch(toggleTheme())}
              pt={{
                root: {
                  style: {
                    height: "2rem",
                    width: "2rem",
                  },
                },
              }}
            />

            <OverlayPanel ref={op}>
              <div className="py-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item)}
                    className="w-full rounded px-4 py-2 text-left transition duration-200 hover:bg-indigo-600 hover:text-white"
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
