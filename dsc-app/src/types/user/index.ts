export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  totalUsers: number;
  currentPage: number;
  totalPages: number;
}

export interface UserResponse {
  users: User[];
  pages: number;
  total: number;
  current_page: number;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface ChangeUserPrivilegeData {
  role: string;
}
