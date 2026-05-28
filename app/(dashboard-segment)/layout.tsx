"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useMemo, useState } from "react";

import "../globals.css";
import { styles } from "../assets/styles";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useTransactions } from "../hooks/useTransactions";
import {
  DashboardOutletProvider,
  type DashboardTransaction,
  type DashboardOutletContextValue,
  type TimeFrame,
} from "../context/OutletContext";

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
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("monthly");

  const txHook = useTransactions();
  const transactions = useMemo<DashboardTransaction[]>(
    () =>
      txHook.transactions.map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        amount: Number(transaction.amount),
        date: transaction.date,
        category: transaction.category,
        type: transaction.type === "income" ? "income" : "expense",
      })),
    [txHook.transactions],
  );
  const {
    dataUpdatedAt,
    refetch,
    addTransaction,
    editTransaction,
    deleteTransaction,
  } = txHook;

  const lastUpdated = useMemo(
    () => new Date(dataUpdatedAt || 0),
    [dataUpdatedAt],
  );

  const outletContextValue: DashboardOutletContextValue = useMemo(
    () => ({
      transactions,
      addTransaction: async (transaction) => {
        try {
          await addTransaction(
            transaction as unknown as Parameters<typeof addTransaction>[0],
          );
          return true;
        } catch (e) {
          console.error("addTransaction failed", e);
          return false;
        }
      },
      editTransaction: async (id, transaction) => {
        try {
          await editTransaction(
            id,
            transaction as unknown as Parameters<typeof editTransaction>[1],
          );
          return true;
        } catch (e) {
          console.error("editTransaction failed", e);
          return false;
        }
      },
      deleteTransaction: async (id, type) => {
        try {
          await deleteTransaction(id, type);
          return true;
        } catch (e) {
          console.error("deleteTransaction failed", e);
          return false;
        }
      },
      refreshTransactions: async () => {
        await refetch();
      },
      timeFrame,
      setTimeFrame,
      lastUpdated,
    }),
    [
      transactions,
      addTransaction,
      editTransaction,
      deleteTransaction,
      refetch,
      timeFrame,
      setTimeFrame,
      lastUpdated,
    ],
  );

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
        <DashboardOutletProvider value={outletContextValue}>
          {children}
        </DashboardOutletProvider>
      </div>
    </div>
  );
}
