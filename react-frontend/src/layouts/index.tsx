import React, { useState } from "react";
import Header from "layouts/Main/Header";
import Navigation from "layouts/Main/Navigation";
import Footer from "layouts/Main/Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Navigation isOpen={isMenuOpen} />

      <div className="flex flex-1 flex-col lg:ml-72">
        <Header isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

        <main className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
