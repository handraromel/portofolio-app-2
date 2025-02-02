import React from "react";
import { Link } from "react-router-dom";
import { LockClosedIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

const Unauthorized: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-red-500 to-pink-600 px-4 text-white">
      <LockClosedIcon className="h-24 w-24 animate-pulse text-yellow-300" />
      <h1 className="mb-4 mt-8 text-6xl font-extrabold">403</h1>
      <p className="mb-8 text-2xl font-semibold">Access Denied</p>
      <p className="mb-8 text-center text-xl">
        Sorry, you don't have the right ingredients to access this secret
        recipe.
      </p>
      <Link
        to="/"
        className="flex items-center space-x-2 rounded-full bg-white px-6 py-3 font-semibold text-red-600 transition duration-300 hover:bg-red-100"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span>Back to Safe Kitchen</span>
      </Link>
    </div>
  );
};

export default Unauthorized;
