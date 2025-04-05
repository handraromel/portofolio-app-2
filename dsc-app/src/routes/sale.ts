import { lazy } from "react";
import { Route } from "./types";
import MainLayout from "@/layouts";

const SaleList = lazy(() => import("@/components/Pages/Sale/List"));

export const routes: Route[] = [
  {
    path: "/sales",
    element: SaleList,
    layout: MainLayout,
  },
];
