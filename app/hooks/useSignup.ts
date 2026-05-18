import { useMutation } from "@tanstack/react-query";
import { AuthService } from "../services/auth";
import { SignupPayload } from "../types/authType";
import { TError } from "../types/errorType";

interface Options {
  onSuccess?: () => void;
  onError?: (error: TError) => void;
}

export const useSignup = (options?: Options) => {
  return useMutation({
    mutationFn: (payload: SignupPayload) => AuthService.signup(payload),

    onSuccess: (response) => {
      if (response.status === "success") {
        options?.onSuccess?.();
      }
    },

    onError: (error: TError) => {
      options?.onError?.(error);
    },
  });
};
