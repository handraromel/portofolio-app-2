import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route as ReactRoute,
  Navigate,
} from "react-router-dom";
import { useAppSelector } from "hooks/useStore";
import { routes } from ".";
import { Route } from "./types";
import MainLayout from "layouts";
import NotFound from "components/Pages/NotFound";
import { checkRole } from "./middleware";

const ProtectedRoute: React.FC<{
  element: React.ComponentType;
  layout: React.ComponentType<{ children: React.ReactNode }>;
  allowedRoles: string[];
}> = ({ element: Element, layout: Layout, allowedRoles }) => {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  console.log(user);
  console.log(isAuthenticated);

  if (!isAuthenticated) {
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
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <Router>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            Loading The App...
          </div>
        }
      >
        <Routes>
          <ReactRoute
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {routes.map((route: Route) => {
            const Element = route.element;
            const Layout = route.layout || MainLayout;
            const allowedRoles = route.allowedRoles || ["superadmin"];

            if (route.protected) {
              return (
                <ReactRoute
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
              <ReactRoute
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
          <ReactRoute path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
