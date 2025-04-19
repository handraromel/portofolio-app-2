import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useStore";
import { routes } from ".";
import { Route as RouteType } from "./types";
import MainLayout from "@/layouts";
import {
  NotFound,
  BadGateway,
  LoadingScreen,
  Unauthorized,
} from "@/components/Pages";
import { checkRole } from "./middleware";
import { useAuthCheck } from "@/hooks/useAuthCheck";

const ProtectedRoute: React.FC<{
  element: React.ComponentType;
  layout: React.ComponentType<{ children: React.ReactNode }>;
  allowedRoles: string[];
}> = ({ element: Element, layout: Layout, allowedRoles }) => {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    // Save current location for redirect after login
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    return <Navigate to="/login" replace />;
  }

  if (!checkRole(user, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <Layout>
      <Element />
    </Layout>
  );
};

const AppRouter: React.FC = () => {
  const { isAuthenticated, isChecking } = useAuthCheck();

  // Show loading screen while checking auth
  if (isChecking) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />

        {routes.map((route: RouteType) => {
          const Element = route.element;
          const Layout = route.layout || MainLayout;
          const allowedRoles = route.allowedRoles || ["superadmin"];

          if (route.protected) {
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute
                    element={Element}
                    layout={Layout}
                    allowedRoles={allowedRoles}
                  />
                }
              />
            );
          }

          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Layout>
                  <Element />
                </Layout>
              }
            />
          );
        })}
        <Route path="/502" element={<BadGateway />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
