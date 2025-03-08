// Define product-related types for API interactions
import { ApiResponse } from "./api";
// Base types for product entities
export interface ProductBase {
  uuid: string;
  created_at: string;
  updated_at: string;
}

export interface ProductBrand extends ProductBase {
  id: number;
  name: string;
}

export interface ProductGroup extends ProductBase {
  id: number;
  name: string;
}

export interface ProductDivision extends ProductBase {
  name: string;
  alias: string | null;
}

export interface ProductCategory extends ProductBase {
  name: string;
}

// Types for API responses
export interface ProductBrandResponse extends ApiResponse {
  brands: ProductBrand[];
}

export interface ProductGroupResponse extends ApiResponse {
  groups: ProductGroup[];
}

export interface ProductDivisionResponse extends ApiResponse {
  divisions: ProductDivision[];
}

export interface ProductCategoryResponse extends ApiResponse {
  categories: ProductCategory[];
}

// Types for create/update operations
export interface ProductBrandSubmission {
  id: number | null;
  name: string;
}

export interface ProductGroupSubmission {
  id: number | null;
  name: string;
}

export interface ProductDivisionSubmission {
  name: string;
  alias?: string | null;
}

export interface ProductCategorySubmission {
  name: string;
}

// Query filter types
export interface ProductQueryFilters {
  page?: number;
  per_page?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}
