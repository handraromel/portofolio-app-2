import React, { useState, useEffect } from "react";
import { CogIcon } from "@heroicons/react/24/solid";

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          return 100;
        }
        const newProgress = oldProgress + 10;
        return Math.min(newProgress, 100);
      });
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
      <div className="mb-8 flex items-center space-x-4">
        <CogIcon className="h-12 w-12 animate-spin text-white" />
        <h1 className="text-4xl font-bold text-white">Loading Savory Script</h1>
      </div>
      <div className="w-64 rounded-full bg-slate-400">
        <div
          className="rounded-full bg-white p-0.5 text-center text-xs font-medium leading-none text-slate-500 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        >
          {progress}%
        </div>
      </div>
      <p className="mt-4 text-lg font-semibold text-white">
        Preparing the app...
      </p>
    </div>
  );
};

export default LoadingScreen;
