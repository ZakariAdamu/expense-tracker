"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";
import { registerLogoutHandler } from "./services/api";
import { useAuth } from "./context/AuthContext";

type ProvidersProps = {
  children: ReactNode;
};

function LogoutBridge({ children }: ProvidersProps) {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    return registerLogoutHandler(() => {
      logout();
      router.replace("/login");
    });
  }, [logout, router]);

  return children;
}

const Providers = ({ children }: ProvidersProps) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LogoutBridge>{children}</LogoutBridge>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Providers;
