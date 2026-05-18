import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { AuthService } from "../services/auth";
import { LoginPayload, LoginResponseData } from "../types/authType";
import { TError } from "../types/errorType";
import { ApiResponse } from "../types/apiType";

interface Options {
  onSuccess?: (data: ApiResponse<LoginResponseData>) => void;
  onError?: (error: TError) => void;
}

export const useLogin = (
  options?: Options,
): UseMutationResult<
  ApiResponse<LoginResponseData>,
  TError,
  LoginPayload,
  unknown
> => {
  return useMutation<ApiResponse<LoginResponseData>, TError, LoginPayload>({
    mutationFn: (payload: LoginPayload) => AuthService.login(payload),

    onSuccess: (response) => {
      console.log("Login response:", response);
      if (response.status === "success") {
        options?.onSuccess?.(response);
      }
    },

    onError: (error: TError) => {
      console.error("Login error:", error);
      options?.onError?.(error);
    },
  });
};
