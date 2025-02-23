import Cookies from "js-cookie";
import { ApiResponse, ApiError, ApiRequestConfig } from "@/types/api";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL;

type RequestConfig = {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  credentials?: RequestCredentials;
};

export async function apiClient<TResponse, TRequest = unknown>(
  endpoint: string,
  { data, method = "GET" }: ApiRequestConfig<TRequest> = {},
): Promise<ApiResponse<TResponse>> {
  const config: RequestConfig = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  const csrfToken = endpoint.includes("/refresh")
    ? Cookies.get("csrf_refresh_token")
    : Cookies.get("csrf_access_token");

  if (csrfToken && config.headers) {
    config.headers["X-CSRF-TOKEN"] = csrfToken;
  }

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const responseData = await response.json();

  if (!response.ok) {
    throw {
      response: {
        data: responseData as ApiError,
      },
    };
  }

  return responseData as ApiResponse<TResponse>;
}
