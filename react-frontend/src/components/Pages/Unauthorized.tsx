import React from "react";
import { Link } from "react-router-dom";
import Card from "components/Common/Card";

const Unauthorized: React.FC = () => {
  return (
    <Card fullHeight>
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="mb-4 text-4xl font-bold">You're unauthorized</h1>
        <p className="mb-4 text-xl">
          You have no privilege to access this page.
        </p>
        <Link to="/" className="text-blue-500 underline hover:text-blue-700">
          Go back to homepage
        </Link>
      </div>
    </Card>
  );
};

export default Unauthorized;
