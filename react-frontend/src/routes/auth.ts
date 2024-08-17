import { lazy } from "react";
import { Route } from "./types";
import AuthLayout from "layouts/Auth";

const Register = lazy(() => import("components/Pages/Auth/Register"));
const Login = lazy(() => import("components/Pages/Auth/Login"));
const AccountActivation = lazy(
  () => import("components/Pages/Auth/AccountActivation"),
);

export const routes: Route[] = [
  {
    path: "/register",
    element: Register,
    layout: AuthLayout,
  },
  {
    path: "/login",
    element: Login,
    layout: AuthLayout,
  },
  {
    path: "/activate-account/:token",
    element: AccountActivation,
    layout: AuthLayout,
  },
];
