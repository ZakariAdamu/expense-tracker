import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "../services/auth";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: (response) => {
      // Clear all cookies and client state even if backend fails
      Cookies.remove("token");
      Cookies.remove("role");
      Cookies.remove("username");
      queryClient.clear();

      if (response.status === "success") {
        toast.success(response.message || "Logged out successfully");
      }
      router.push("/login");
    },
    onError: () => {
      // Clear local state anyway
      Cookies.remove("token");
      Cookies.remove("role");
      Cookies.remove("username");
      queryClient.clear();
      router.push("/login");
    },
  });
};
