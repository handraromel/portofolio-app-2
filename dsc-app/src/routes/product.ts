import { lazy } from "react";
import { Route } from "./types";
import MainLayout from "@/layouts";

const BrandList = lazy(() => import("@/components/Pages/Product/Brand/List"));
const CategoryList = lazy(
  () => import("@/components/Pages/Product/Category/List"),
);
const DivisionList = lazy(
  () => import("@/components/Pages/Product/Division/List"),
);
const GroupList = lazy(() => import("@/components/Pages/Product/Group/List"));

export const routes: Route[] = [
  { path: "/product/brands", element: BrandList, layout: MainLayout },
  { path: "/product/categories", element: CategoryList, layout: MainLayout },
  { path: "/product/divisions", element: DivisionList, layout: MainLayout },
  { path: "/product/groups", element: GroupList, layout: MainLayout },
];
