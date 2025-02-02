import React from "react";
import { Link } from "react-router-dom";
import { ExclamationTriangleIcon, HomeIcon } from "@heroicons/react/24/outline";

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 px-4 text-white">
      <ExclamationTriangleIcon className="h-24 w-24 animate-bounce text-yellow-300" />
      <h1 className="mb-4 mt-8 text-6xl font-extrabold">404</h1>
      <p className="mb-8 text-2xl font-semibold">Oops! Page Not Found</p>
      <p className="mb-8 text-center text-xl">
        The recipe you're looking for seems to have vanished from our cookbook.
      </p>
      <Link
        to="/"
        className="flex items-center space-x-2 rounded-full bg-white px-6 py-3 font-semibold text-blue-600 transition duration-300 hover:bg-blue-100"
      >
        <HomeIcon className="h-5 w-5" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};

export default NotFound;
