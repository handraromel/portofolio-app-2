import React from "react";
import { useAppSelector } from "@/hooks/useStore";

const Dashboard: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  return (
    <div className="flex h-[35rem] flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8 text-center">
        {/* App Title Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl dark:text-white">
            Daily Sales Control App
          </h1>
          <p className="text-base text-gray-500 sm:text-lg md:text-xl dark:text-gray-400">
            Our awesome journey starts here.
          </p>
        </div>

        {/* Welcome Message Section */}
        {currentUser && (
          <div className="mt-12 space-y-4 rounded-xl bg-indigo-200/90 p-6 backdrop-blur-lg sm:p-8 dark:bg-indigo-500/10">
            <p className="text-lg text-gray-600 sm:text-xl dark:text-gray-300">
              Welcome back,
            </p>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl dark:text-white">
                {currentUser.first_name}&nbsp;{currentUser.last_name}
              </h2>
              <p className="inline-block rounded-full bg-indigo-100 px-4 py-1 text-sm font-semibold text-indigo-800 drop-shadow-lg dark:bg-indigo-900 dark:text-indigo-200">
                {currentUser.role.charAt(0).toUpperCase() +
                  currentUser.role.slice(1)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
