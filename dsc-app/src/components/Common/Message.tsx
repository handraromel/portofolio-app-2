import React, { useEffect, useState } from "react";

interface MessageProps {
  message: string;
  type: "success" | "error" | "warning";
  useTransition?: boolean;
}

const Message: React.FC<MessageProps> = ({
  message,
  type,
  useTransition = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (useTransition) {
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  const bgColor =
    type === "success"
      ? "bg-green-50"
      : type === "error"
        ? "bg-red-50"
        : "bg-orange-50";
  const borderColor =
    type === "success"
      ? "border-green-400"
      : type === "error"
        ? "border-red-400"
        : "border-orange-400";
  const textColor =
    type === "success"
      ? "text-emerald-600"
      : type === "error"
        ? "text-red-500"
        : "text-orange-500";

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${isVisible ? "max-h-20 opacity-100" : "max-h-0 opacity-0"} ${bgColor} border ${borderColor} ${textColor} rounded`}
    >
      <p className="p-2 text-sm">{message}</p>
    </div>
  );
};

export default Message;
