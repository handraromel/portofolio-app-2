import React, { useState, useCallback, useEffect, useMemo } from "react";
import Header from "@/layouts/Main/Header";
import Navigation from "@/layouts/Main/Navigation";
import Footer from "@/layouts/Main/Footer";
import Container from "@/layouts/Main/Container";
import { debounce } from "lodash";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const debouncedSetMenuOpen = useMemo(
    () =>
      debounce((value: boolean) => {
        setIsMenuOpen(value);
      }, 100),
    [],
  );

  const openMenu = useCallback(() => {
    debouncedSetMenuOpen(true);
  }, [debouncedSetMenuOpen]);

  const closeMenu = useCallback(() => {
    debouncedSetMenuOpen(false);
  }, [debouncedSetMenuOpen]);

  useEffect(() => {
    return () => {
      debouncedSetMenuOpen.cancel();
    };
  }, [debouncedSetMenuOpen]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [isMenuOpen]);

  return (
    <div className="flex min-h-screen bg-gray-500">
      <div
        className={`fixed inset-0 bg-gray-900/50 transition-opacity duration-300 lg:hidden ${
          isMenuOpen ? "z-40 opacity-100" : "-z-10 opacity-0"
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <Navigation isOpen={isMenuOpen} onClose={closeMenu} />

      <div className="flex flex-1 flex-col lg:ml-72">
        <Header
          isMenuOpen={isMenuOpen}
          openMenu={openMenu}
          closeMenu={closeMenu}
        />

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
