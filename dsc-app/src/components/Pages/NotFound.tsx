import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 px-4 text-white">
      <i
        className="pi pi-exclamation-triangle animate-pulse text-9xl text-yellow-300"
        style={{ fontSize: "6rem" }}
      />
      <h1 className="mt-8 mb-4 text-6xl font-extrabold">404</h1>
      <p className="mb-8 text-2xl font-semibold">Oops! Page Not Found</p>
      <p className="mb-8 text-center text-xl">
        The item you&apos;re looking for seems to have vanished from our system.
      </p>
      <Link
        to="/"
        className="flex items-center space-x-2 rounded-full bg-white px-6 py-3 font-semibold text-blue-600 transition duration-300 hover:bg-blue-100"
      >
        <i className="pi pi-arrow-circle-left text-xl" />
        <span>Go Back</span>
      </Link>
    </div>
  );
};

export default NotFound;
