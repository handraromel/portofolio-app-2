import React from "react";
import Card from "components/Common/Card";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md px-12">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Savory Script
        </h2>
        {children}
      </Card>
    </div>
  );
};

export default AuthLayout;
