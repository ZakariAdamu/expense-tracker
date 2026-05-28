"use client";
import Image from "next/image";
import { Pinyon_Script } from "next/font/google";
import { navbarStyles } from "../assets/styles";
import img1 from "../assets/logo.png";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { NavbarProps } from "../types/types";
import { useAuth } from "@/app/context/AuthContext";

const pinyonScript = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
});

const Navbar = ({ user: propUser, onLogout }: NavbarProps) => {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user: ctxUser, logout: ctxLogout } = useAuth();
  const user = propUser ?? ctxUser ?? { name: null, email: null, image: null };

  // no-op: user comes from prop or AuthContext

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    try {
      ctxLogout?.();
    } catch {
      // fallback: clear storage
      localStorage.removeItem("authToken");
    }
    onLogout?.();
    router.push("/login");
  };

  // close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>
        {/* logo */}
        <div
          onClick={() => router.push("/")}
          className={navbarStyles.logoContainer}
        >
          <div className={navbarStyles.logoImage}>
            <Image src={img1} alt="logo" width={50} height={50} />
          </div>
          <span
            className={`${navbarStyles.logoText} ${pinyonScript.className}`}
          >
            Expense Tracker
          </span>
        </div>
        {/* If user is logged in */}
        {user && (
          <div className={navbarStyles.userContainer} ref={menuRef}>
            <button onClick={toggleMenu} className={navbarStyles.userButton}>
              <div className="relative">
                <div
                  className={navbarStyles.userAvatar}
                  suppressHydrationWarning
                >
                  {user?.name?.[0]?.toUpperCase() || ""}
                </div>
                <div className={navbarStyles.statusIndicator}></div>
              </div>
              <div className={navbarStyles.userTextContainer}>
                <p className={navbarStyles.userName} suppressHydrationWarning>
                  {user?.name || ""}
                </p>
                <p className={navbarStyles.userEmail} suppressHydrationWarning>
                  {user?.email || ""}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`${navbarStyles.chevronIcon} ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* dropdown menu */}
            {menuOpen && (
              <div className={navbarStyles.dropdownMenu}>
                <div className={navbarStyles.dropdownHeader}>
                  <div className="flex items-center gap-3">
                    <div
                      className={navbarStyles.dropdownAvatar}
                      suppressHydrationWarning
                    >
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className={navbarStyles.dropdownName}>
                        {user?.name || "User"}
                      </div>
                      <div className={navbarStyles.dropdownEmail}>
                        {user?.email || "user@expensetracker.com"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`${navbarStyles.menuItemContainer} hidden`}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/profile");
                    }}
                    className={navbarStyles.menuItem}
                  >
                    <User size={16} className="mr-2" />
                    <span>My Profile</span>
                  </button>
                </div>
                <div className={navbarStyles.menuItemBorder}>
                  <button
                    onClick={handleLogout}
                    className={navbarStyles.logoutButton}
                  >
                    <LogOut size={16} className="mr-2" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        ;
      </div>
    </header>
  );
};

export default Navbar;
