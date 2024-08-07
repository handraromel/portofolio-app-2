import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route as ReactRoute,
} from "react-router-dom";
import { routes } from ".";
import { Route } from "./types";
import MainLayout from "layouts";
import NotFound from "components/Pages/NotFound";

const AppRouter: React.FC = () => {
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
          {routes.map((route: Route) => {
            const Element = route.element;
            const Layout = route.layout || MainLayout;

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
