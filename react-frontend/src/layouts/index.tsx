import React, { useState } from "react";
import Header from "layouts/Main/Header";
import Navigation from "layouts/Main/Navigation";
import Footer from "layouts/Main/Footer";
import Container from "layouts/Main/Container";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="flex min-h-screen bg-gray-500">
      <Navigation isOpen={isMenuOpen} />

      <div className="flex flex-1 flex-col lg:ml-72">
        <Header isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

        <main className="flex-grow p-6">
          <div className="mx-auto h-full max-w-7xl">
            <Container>{children}</Container>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
