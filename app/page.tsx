"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardPage from "./(dashboard-segment)/dashboard/DashboardPage";

const Page = () => {
  // const router = useRouter();

  // useEffect(() => {
  // 	router.push("/signup");
  // }, []);
  return (
    <div className="">
      <DashboardPage sidebarCollapsed={true} />
    </div>
  );
};

export default Page;
