import React, { useRef } from "react";
import { useAppDispatch } from "@/hooks/useStore";
import { logout } from "@/store/actions/authActions";
import { useNavigate } from "react-router-dom";
import { OverlayPanel } from "primereact/overlaypanel";
import { UserCircleIcon } from "@heroicons/react/24/solid";

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
    <header className="sticky top-0 bg-slate-900 text-slate-200 shadow-md transition-all duration-300">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <h1 className="ml-4 text-xl font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center">
            <button
              className="flex items-center text-slate-200 hover:text-indigo-500"
              onClick={(e) => op.current?.toggle(e)}
            >
              <UserCircleIcon className="h-8 w-8" />
            </button>

            <OverlayPanel ref={op}>
              <div className="py-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item)}
                    className="w-full px-4 py-2 text-left text-slate-200 hover:bg-indigo-600 hover:text-white"
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
