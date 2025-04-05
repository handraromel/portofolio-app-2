import { ApiResponse } from "./api";

// Basic sale record
export interface Sale {
  uuid: string;
  sale_qty: number;
  discounted_amt: number;
  sale_amt: number;
  sku: string | null;
  item_no: string | null;
  input_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;

  // Calculated values
  gross_sales: number;
  nett_sales: number;
  tax_rate: number;
  tax_amount: number;
  nett_sales_after_tax: number;

  // Related product data
  brand: {
    uuid: string;
    id: string;
    name: string;
  };
  group: {
    uuid: string;
    id: string;
    name: string;
  };
  division: {
    uuid: string;
    name: string;
    alias: string;
  };
  category: {
    uuid: string;
    name: string;
  };
}

// Sale submission form data
export interface SaleSubmission {
  sale_qty: number;
  discounted_amt?: number;
  sale_amt: number;
  sku?: string | null;
  item_no?: string | null;
  input_date: string;
  description?: string | null;
  product_brand_id: string;
  product_group_id: string;
  product_division_id: string;
  product_category_id: string;
}

// API response for listing sales
export interface SalesResponse extends ApiResponse {
  sales: Sale[];
  total: number;
  pages: number;
  current_page: number;
}

// API response for a single sale
export interface SaleDetailResponse extends ApiResponse {
  sale: Sale;
}

// Daily sales data structure
export interface DailySalesData {
  date: string;
  sale_qty: number;
  sale_amt: number;
  discounted_amt: number;
  gross_sales: number;
  nett_sales: number;
  tax_rate: number;
  tax_amount: number;
  nett_sales_after_tax: number;
  transaction_count: number;
}

// MTD sales data with additional metrics
export interface MtdSalesData extends DailySalesData {
  from_date: string;
  to_date: string;
  days_with_sales: number;
  total_days: number;
  sales_coverage: number;
  daily_avg_sales: number;
}

// YoY comparison metrics
export interface YoYChanges {
  sale_qty_change: number;
  sale_amt_change: number;
  discounted_amt_change: number;
  gross_sales_change: number;
  nett_sales_change: number;
  nett_sales_after_tax_change: number;
  transaction_count_change: number;
}

// Daily sales summary with YoY comparison
export interface DailySalesSummary {
  date: string;
  ty: DailySalesData; // This Year
  ly: DailySalesData; // Last Year
  yoy_changes: YoYChanges;
}

// MTD sales summary with YoY comparison
export interface MtdSalesSummary {
  month: string;
  from_date: string;
  to_date: string;
  ty: MtdSalesData; // This Year
  ly: MtdSalesData; // Last Year
  yoy_changes: YoYChanges;
}

// Query filters for sales data
export interface SaleQueryFilters {
  page?: number;
  per_page?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  brand_id?: string;
  group_id?: string;
  division_id?: string;
  category_id?: string;
}

export interface FilterData {
  brand_id?: string;
  group_id?: string;
  division_id?: string;
  category_id?: string;
  start_date?: string;
  end_date?: string;
  date?: string;
}

export interface ListFilterData extends FilterData {
  start_date?: string;
  end_date?: string;
}

export interface DailyFilterData extends FilterData {
  date?: string;
}

export interface MtdFilterData extends FilterData {
  date?: string;
}
