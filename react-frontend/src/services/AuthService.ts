import api from "./ApiService";

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

const authPrefix = "/auth/user";

const AuthService = {
  register: (data: RegisterData) => api.post(`${authPrefix}/register`, data),
  login: (data: LoginData) => api.post(`${authPrefix}/login`, data),
  logout: () =>
    api.post(`${authPrefix}/logout`, null, { withCredentials: true }),
  refresh: () =>
    api.post(`${authPrefix}/refresh`, null, { withCredentials: true }),
  forgotPassword: (email: string) =>
    api.post(`${authPrefix}/forgot-password`, { email }),
  activateAccount: (token: string) =>
    api.get(`${authPrefix}/activate/${token}`),
};

export default AuthService;
