import { User } from "./user";

export interface ApiResponse<T = unknown> {
  msg?: string;
  login?: boolean;
  logout?: boolean;
  users?: User[];
  user?: T;
  data?: T;
  success?: boolean;
  error?: string;
  current_page?: number;
  pages?: number;
  total?: number;
  isSame?: boolean;
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
