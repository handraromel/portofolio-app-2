import { lazy } from "react";
import { Route } from "./types";
import MainLayout from "@/layouts";

const UserList = lazy(() => import("@/components/Pages/User/List"));

export const routes: Route[] = [
  {
    path: "/users",
    element: UserList,
    layout: MainLayout,
    protected: true,
    allowedRoles: ["superadmin", "admin"],
  },
];
