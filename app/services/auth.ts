import {
  SignupPayload,
  AuthData,
  LoginPayload,
  LoginResponseData,
  OtpRequestData,
  OtpVerifyData,
  ForgotPasswordData,
  OtpMailRequestData,
} from "../types/authType";
import { post } from "./axios";
import { ApiResponse } from "../types/apiType";

export const AuthService = {
  signup: async (payload: SignupPayload): Promise<ApiResponse<AuthData>> => {
    return await post<AuthData>("/users/signup", payload);
  },

  login: async (
    payload: LoginPayload,
  ): Promise<ApiResponse<LoginResponseData>> => {
    return await post<LoginResponseData>("/users/login", payload);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return await post<void>("/logout");
  },

  validateRegistration: async (payload: {
    email: string;
    name: string;
  }): Promise<ApiResponse<void>> => {
    return await post<void>("/auth/validate-registration", payload);
  },

  requestOtp: async (email: string): Promise<ApiResponse<OtpRequestData>> => {
    return await post<OtpRequestData>("/auth/request-otp", {
      email,
    });
  },

  requestEmailVerification: async (
    email: string,
  ): Promise<ApiResponse<OtpMailRequestData>> => {
    return await post<OtpMailRequestData>("/auth/request-email-verification", {
      email,
    });
  },

  verifyOtp: async (payload: {
    email: string;
    otp: string;
  }): Promise<ApiResponse<OtpVerifyData>> => {
    return await post<OtpVerifyData>("/auth/verify-otp", payload);
  },

  completeEmailVerification: async (payload: {
    token: string;
    otp: string;
  }): Promise<ApiResponse<OtpVerifyData>> => {
    return await post<OtpVerifyData>(
      "/auth/complete-email-verification",
      payload,
    );
  },

  forgotPassword: async (payload: {
    email: string;
  }): Promise<ApiResponse<ForgotPasswordData>> => {
    return await post<ForgotPasswordData>("/auth/forgot-password", payload);
  },

  resetPassword: async (payload: {
    newPassword: string;
    email: string;
    token: string;
  }): Promise<ApiResponse<ForgotPasswordData>> => {
    return await post<ForgotPasswordData>("/auth/reset-password", payload);
  },
};
