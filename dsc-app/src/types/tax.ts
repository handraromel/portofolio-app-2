import { ApiResponse } from "./api";

export interface TaxConfiguration {
  uuid: string;
  name: string;
  tax_rate: number;
  effective_from: string;
  effective_until: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TaxConfigurationResponse extends ApiResponse {
  tax_configurations: TaxConfiguration[];
  total: number;
  pages: number;
  current_page: number;
}

export interface TaxConfigurationDetailResponse extends ApiResponse {
  tax_configuration: TaxConfiguration;
}

export interface CurrentTaxResponse extends ApiResponse {
  tax_rate: number;
}

export interface TaxConfigurationSubmission {
  name: string;
  tax_rate: number;
  effective_from: string;
  effective_until?: string | null;
  description?: string | null;
}

export interface TaxQueryFilters {
  page?: number;
  per_page?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}
