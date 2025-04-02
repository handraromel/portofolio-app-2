import { lazy } from "react";
import { Route } from "./types";
import MainLayout from "@/layouts";

const TaxConfigurationList = lazy(() => import("@/components/Pages/Tax/List"));

export const routes: Route[] = [
  {
    path: "/configurations/tax",
    element: TaxConfigurationList,
    layout: MainLayout,
  },
];
