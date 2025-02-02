import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="sticky bottom-0 bg-slate-900 py-6 text-slate-300">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <p>&copy; 2024 Savory Script. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a
              href="#"
              className="mr-4 transition-all duration-300 hover:text-white"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="transition-all duration-300 hover:text-white"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
