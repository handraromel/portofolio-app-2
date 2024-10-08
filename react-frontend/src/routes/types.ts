export interface Route {
  path: string;
  element: React.ComponentType;
  layout?: React.ComponentType<{ children: React.ReactNode }>;
  protected?: boolean;
  allowedRoles?: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "superadmin" | "admin" | "user";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageState {
  text: string;
  type: "success" | "error" | "warning";
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  message: MessageState | null;
  csrfAccessToken: string | null;
  csrfRefreshToken: string | null;
  activationProgress: number;
}

export interface AuthLayoutProps {
  children: React.ReactNode;
}
