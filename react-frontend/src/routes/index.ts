import { lazy } from "react";
import { routes as authRoutes } from "./auth";
import { Route } from "./types";

const Dashboard = lazy(() => import("components/Pages/Dashboard"));
const NotFound = lazy(() => import("components/Pages/NotFound"));

export const routes: Route[] = [
  {
    path: "/",
    element: Dashboard,
  },
  ...authRoutes,
];

export { NotFound };
