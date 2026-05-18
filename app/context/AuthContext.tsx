"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { propUser } from "../types/types";

type AuthUser = propUser | null;

type AuthContextType = {
  user: AuthUser;
  token: string | null;
  setAuth: (
    args: { user: AuthUser; token: string },
    remember?: boolean,
  ) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser>(() => {
    if (typeof window === "undefined") return null;
    try {
      const storedUser =
        localStorage.getItem("user") ?? sessionStorage.getItem("user");
      return storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return (
        localStorage.getItem("authToken") ?? sessionStorage.getItem("authToken")
      );
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!token) {
      Cookies.remove("token", { path: "/" });
      return;
    }
    const persist = Boolean(localStorage.getItem("authToken"));
    Cookies.set("token", token, {
      path: "/",
      sameSite: "lax",
      ...(persist ? { expires: 30 } : {}),
    });
  }, [token]);

  useEffect(() => {
    if (!user) return;
    console.log("Signed in user:", user);
  }, [user]);

  const setAuth = (
    args: { user: AuthUser; token: string },
    remember = false,
  ) => {
    setUser(args.user);
    setToken(args.token);
    Cookies.set("token", args.token, {
      path: "/",
      sameSite: "lax",
      ...(remember ? { expires: 30 } : {}),
    });
    try {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("authToken", args.token);
      if (args.user) storage.setItem("user", JSON.stringify(args.user));
      // also ensure removed from the other storage
      if (remember) {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("user");
      } else {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    } catch {
      // ignore storage errors
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      Cookies.remove("token", { path: "/" });
    } catch {
      // ignore
    }
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
