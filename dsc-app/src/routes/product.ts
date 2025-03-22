import { lazy } from "react";
import { Route } from "./types";
import MainLayout from "@/layouts";

const BrandList = lazy(() => import("@/components/Pages/Product/Brand/List"));
const CategoryList = lazy(
  () => import("@/components/Pages/Product/Category/List"),
);

export const routes: Route[] = [
  { path: "/product/brands", element: BrandList, layout: MainLayout },
  { path: "/product/categories", element: CategoryList, layout: MainLayout },
];
