import React from "react";

interface CardProps {
  children: React.ReactNode;
  fullHeight?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  fullHeight = false,
  className = "",
}) => {
  const heightClass = fullHeight ? "h-full" : "";

  return (
    <div
      className={`rounded-lg bg-gray-200 p-6 text-slate-900 shadow-md ${heightClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
