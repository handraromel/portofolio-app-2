import { lazy } from "react";
import { Route } from "./types";
import MainLayout from "@/layouts";

// Lazy load product-related components
const BrandList = lazy(() => import("@/components/Pages/Product/Brand/List"));
// const GroupList = lazy(() => import("@/components/Pages/Product/Group/List"));
// const DivisionList = lazy(
//   () => import("@/components/Pages/Product/Division/List"),
// );
// const CategoryList = lazy(
//   () => import("@/components/Pages/Product/Category/List"),
// );

export const routes: Route[] = [
  // Brand routes
  {
    path: "/product/brands",
    element: BrandList,
    layout: MainLayout,
    protected: true,
  },

  // Group routes
  //   {
  //     path: "/product/groups",
  //     element: GroupList,
  //     layout: MainLayout,
  //     protected: true,
  //     allowedRoles: ["superadmin", "admin"],
  //   },

  // Division routes
  //   {
  //     path: "/product/divisions",
  //     element: DivisionList,
  //     layout: MainLayout,
  //     protected: true,
  //     allowedRoles: ["superadmin", "admin"],
  //   },

  // Category routes
  //   {
  //     path: "/product/categories",
  //     element: CategoryList,
  //     layout: MainLayout,
  //     protected: true,
  //     allowedRoles: ["superadmin", "admin"],
  //   },
];
