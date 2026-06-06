// Signup
export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthData = Record<string, never>;

//Login
export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponseData = {
  name: string;
  token: string;
  role?: string;
};

// ✅ NEW: OTP types
export type OtpRequestData = {
  email: string;
  expiresIn: string;
};

export type OtpMailRequestData = {
  token: string;
};

export type EmailVerificationData = {
  email?: string;
  code: string;
  isVerified?: boolean;
};

export type ForgotPasswordData = {
  [key: string]: unknown;
};
