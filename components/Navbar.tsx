"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();

  if (pathname === "/sign-in") return null;

  async function handleSignOut() {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/sign-in";
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-1 md:gap-2">
          <Link href="/">
            <Button
              variant={pathname === "/" ? "secondary" : "ghost"}
              size="sm"
              className="h-9 rounded-xl gap-2 font-medium"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Button>
          </Link>
          <Link href="/employees">
            <Button
              variant={
                pathname.startsWith("/employees") ? "secondary" : "ghost"
              }
              size="sm"
              className="h-9 rounded-xl gap-2 font-medium"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Danh sách người lao động</span>
            </Button>
          </Link>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-xl gap-2 text-stone-600 hover:text-rose-600"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </Button>
      </nav>
    </header>
  );
}
