import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAppDispatch } from "hooks/useStore";
import { clearMessage } from "store/slices/authSlice";
import { Card } from "components/Common";
import { AuthLayoutProps } from "routes/types";

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    dispatch(clearMessage());
  }, [location.pathname, dispatch]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[320px] max-w-lg px-6 sm:w-full sm:px-12">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Savory Script
        </h2>
        {children}
        {isLoginPage && (
          <div className="mt-10 flex justify-end text-sm">
            Don't have an account?
            <Link to="/register" className="font-semibold text-indigo-600">
              &nbsp;Register
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuthLayout;
