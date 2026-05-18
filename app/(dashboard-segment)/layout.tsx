"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useState } from "react";

import "../globals.css";
import { styles } from "../assets/styles";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <div suppressHydrationWarning className={styles.layout.root}>
        <Navbar user={user} onLogout={handleLogout} />
        <Sidebar
          user={user}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />
        {children}
      </div>
    </div>
  );
}
