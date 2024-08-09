import React from "react";

interface ButtonProps {
  buttonText: string;
  bgColor?: "primary" | "transparent" | "secondary" | "info" | "link";
  type?: "button" | "submit" | "reset";
  uppercase?: boolean;
  disabled?: boolean;
  loadingState?: boolean;
  fixedWidth?: boolean;
  textSize?: "xs" | "sm" | "md" | "lg";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button: React.FC<ButtonProps> = ({
  buttonText,
  bgColor = "primary",
  type = "button",
  uppercase = true,
  disabled = false,
  loadingState = false,
  fixedWidth = false,
  textSize,
  onClick,
}) => {
  const themeClasses = (() => {
    switch (bgColor) {
      case "primary":
        return "bg-indigo-500 text-white outline-indigo-600 hover:bg-indigo-600";
      case "transparent":
        return "bg-transparent text-white outline-white hover:bg-white hover:text-black";
      case "secondary":
        return "bg-slate-300 outline-slate-300 text-slate-500 drop-shadow-md hover:drop-shadow";
      case "info":
        return "bg-sky-400 outline-sky-500 text-white hover:bg-sky-600 ";
      case "link":
        return "p-0 m-0 bg-transparent border-none outline-none text-blue-600 group-hover:text-blue-800 group-hover:underline cursor-pointer";
    }
  })();

  const getTextSize = (() => {
    switch (textSize) {
      case "xs":
        return "text-[10px]";
      case "sm":
        return "text-[12px]";
      case "md":
        return "text-[14px]";
      case "lg":
        return "text-[16px]";
      default:
        return "text-sm";
    }
  })();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (type !== "submit") {
      event.preventDefault();
    }
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <button
      className={`disabled flex items-center justify-center rounded-sm px-5 py-1.5 font-semibold tracking-wider outline outline-2 outline-offset-2 transition duration-300 ease-in-out hover:drop-shadow-lg ${themeClasses} ${fixedWidth ? "w-[150px]" : "w-auto"} ${getTextSize} ${uppercase ? "uppercase" : ""} `}
      disabled={disabled || loadingState}
      type={type}
      onClick={handleClick}
    >
      {loadingState ? (
        <>
          <span className="mr-1">processing</span>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent"></span>
        </>
      ) : (
        buttonText
      )}
    </button>
  );
};

export default Button;
