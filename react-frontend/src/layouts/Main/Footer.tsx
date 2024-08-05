import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-6 sticky bottom-0">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p>&copy; 2024 Savory Script. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a
              href="#"
              className="hover:text-white transition-all duration-300 mr-4"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-white transition-all duration-300"
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
