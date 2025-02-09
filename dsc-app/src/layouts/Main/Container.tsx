import React from "react";
import { Card } from "primereact/card";

interface ContainerProps {
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children }) => {
  return (
    <Card className="relative h-full">
      <div className="absolute inset-0 flex flex-col overflow-auto p-4">
        {children}
      </div>
    </Card>
  );
};

export default Container;
