import { User } from "./user";
import { Sale } from "./sale";

export interface ApiResponse<T = unknown> {
  msg?: string;
  login?: boolean;
  logout?: boolean;
  users?: User[];
  user?: T;
  data?: T;
  sale: Sale;
  success?: boolean;
  error?: string;
  current_page?: number;
  pages?: number;
  total?: number;
  isSame?: boolean;
  activities?: T;
}

export interface ApiError {
  response?: {
    data: {
      msg?: string;
      error?: string;
    };
    status: number;
  };
  message: string;
}

export interface ApiRequestConfig<T = unknown> {
  data?: T;
  method?: string;
}
