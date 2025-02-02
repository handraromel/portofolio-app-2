import React from "react";
import { Link } from "react-router-dom";
import { WrenchScrewdriverIcon, HomeIcon } from "@heroicons/react/24/outline";

const BadGateway: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 px-4 text-white">
      <WrenchScrewdriverIcon className="h-24 w-24 animate-pulse text-yellow-300" />
      <h1 className="mt-8 mb-4 text-6xl font-extrabold">502</h1>
      <p className="mb-8 text-2xl font-semibold">Under Maintenance</p>
      <p className="mb-8 text-center text-xl">
        We're currently updating our systems to serve you better.
        <br />
        Please check back in a few minutes.
      </p>
      <Link
        to="/"
        className="flex items-center space-x-2 rounded-full bg-white px-6 py-3 font-semibold text-blue-600 transition duration-300 hover:bg-blue-100"
      >
        <HomeIcon className="h-5 w-5" />
        <span>Try Again</span>
      </Link>
    </div>
  );
};

export default BadGateway;
