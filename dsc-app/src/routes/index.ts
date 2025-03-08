import { lazy } from "react";
import { routes as authRoutes } from "./auth";
import { routes as userRoutes } from "./user";
import { routes as productRoutes } from "./product";
import { Route } from "./types";

const Dashboard = lazy(() => import("@/components/Pages/Dashboard"));
const NotFound = lazy(() => import("@/components/Pages/NotFound"));
const BadGateway = lazy(() => import("@/components/Pages/BadGateway"));

export const routes: Route[] = [
  {
    path: "/dashboard",
    element: Dashboard,
    protected: true,
    allowedRoles: ["superadmin", "admin", "user"],
  },
  ...authRoutes.map((route) => ({
    ...route,
    allowedRoles: route.allowedRoles || ["superadmin", "admin", "user"],
  })),
  ...userRoutes,
  ...productRoutes,
];

export { NotFound, BadGateway };
