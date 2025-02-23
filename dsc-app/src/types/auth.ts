export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export type RegisterSubmission = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
};

export type ForgotPasswordData = {
  email: string;
};
