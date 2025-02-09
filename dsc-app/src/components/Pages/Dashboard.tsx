import React from "react";
import { Card } from "primereact/card";
import { useAppSelector } from "@/hooks/useStore";

const Dashboard: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  return (
    <Card className="flex h-full flex-col items-center justify-center">
      <h1 className="mb-4 text-4xl font-bold">Daily Sales Control App</h1>
      <h2 className="mb-4 text-xl">Our awesome journey starts here.</h2>
      {currentUser && (
        <div className="text-center">
          Welcome back,
          <p className="text-3xl">
            {currentUser.first_name}&nbsp;
            {currentUser.last_name}
          </p>
          <p className="text-xl font-bold">{currentUser.role}</p>
        </div>
      )}
    </Card>
  );
};

export default Dashboard;
