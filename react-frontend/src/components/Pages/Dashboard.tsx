import React from "react";
import Card from "components/Common/Card";

const Dashboard: React.FC = () => {
  return (
    <Card fullHeight>
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Savory Script</h1>
        <p className="mb-4 text-xl">Our awesome journey starts here.</p>
      </div>
    </Card>
  );
};

export default Dashboard;
