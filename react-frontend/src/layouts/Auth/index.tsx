import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Card } from "components/Common";
import { AuthLayoutProps } from "routes/types";

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
      <Card className="w-[320px] max-w-lg px-6 sm:w-full sm:px-12">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Savory Script
        </h2>
        {children}
        {isLoginPage && (
          <div>
            <div className="mt-10 flex justify-end text-sm">
              Don't have an account?
              <Link to="/register" className="font-semibold text-indigo-600">
                &nbsp;Register
              </Link>
            </div>
            <div className="mt-1 flex justify-end text-sm">
              Or do you forgot your password?
              <Link
                to="/forgot-password"
                className="font-semibold text-indigo-600"
              >
                &nbsp;Click here
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuthLayout;
