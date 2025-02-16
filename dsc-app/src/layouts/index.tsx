import React, { useState, useCallback } from "react";
import Header from "@/layouts/Main/Header";
import Navigation from "@/layouts/Main/Navigation";
import Footer from "@/layouts/Main/Footer";
import Container from "@/layouts/Main/Container";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-500">
      {/* Overlay - z-40 puts it below navigation but above content */}
      <div
        className={`fixed inset-0 bg-gray-900/50 transition-opacity duration-300 lg:hidden ${
          isMenuOpen ? "z-40 opacity-100" : "-z-10 opacity-0"
        }`}
        onClick={handleCloseMenu}
        aria-hidden="true"
      />

      {/* Navigation - z-50 keeps it above overlay */}
      <Navigation isOpen={isMenuOpen} onClose={handleCloseMenu} />

      <div className="flex flex-1 flex-col lg:ml-72">
        {/* Header - z-30 keeps it below overlay */}
        <Header isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

        <main className="relative flex-1 p-2 sm:p-4 lg:p-6">
          <div className="mx-auto h-full w-full max-w-full">
            <Container>{children}</Container>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
