import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Card } from "components/Common";
import { AuthLayoutProps } from "routes/types";

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
      <Card className="w-[350px] max-w-lg px-6 sm:w-full sm:px-12">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Savory Script
        </h2>
        {children}
        {isLoginPage && (
          <div>
            <div className="mt-10 flex justify-end text-right text-sm max-sm:flex-col">
              Don't have an account?
              <Link
                to="/register"
                className="pl-1 font-semibold text-indigo-600"
              >
                Register
              </Link>
            </div>
            <div className="mt-1 flex justify-end text-right text-sm max-sm:flex-col">
              Or do you forgot your password?
              <Link
                to="/forgot-password"
                className="pl-1 font-semibold text-indigo-600"
              >
                Click here
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuthLayout;
