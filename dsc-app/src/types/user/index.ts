export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserState {
  users: User[];
  isLoading: boolean;
  error: {
    message: string;
  } | null;
  totalPages: number;
  currentPage: number;
  totalUsers: number;
}

export interface UserResponse {
  users: User[];
  pages: number;
  total: number;
  current_page: number;
}

export interface UserDataSubmission {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  role: UserRole;
  confirmPassword?: string;
}

export interface ChangeUserPrivilegeData {
  role: string;
}

export interface SubmissionProps {
  visible: boolean;
  onHide: () => void;
  user?: User | null;
  isProfileEdit?: boolean;
}

export interface RoleOption {
  label: string;
  value: UserRole;
}

export type UserRole = "superadmin" | "admin" | "user";
