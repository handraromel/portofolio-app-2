import { lazy } from "react";
import { Route } from "./types";
import MainLayout from "@/layouts";

const UserList = lazy(() => import("@/components/Pages/User/List"));
const UserProfile = lazy(() => import("@/components/Pages/User/Profile"));

export const routes: Route[] = [
  {
    path: "/users",
    element: UserList,
    layout: MainLayout,
    protected: true,
    allowedRoles: ["superadmin", "admin"],
  },
  {
    path: "/user/profile",
    element: UserProfile,
    layout: MainLayout,
    protected: true,
    allowedRoles: ["superadmin", "admin", "user"],
  },
];
