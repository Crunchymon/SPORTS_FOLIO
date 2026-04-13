"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((state) => state.init);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup");
    const isPublicPage = pathname === "/";
    
    if (!isAuthPage && !isPublicPage && !isAuthenticated) {
      router.push("/login");
    } else if ((isAuthPage || isPublicPage) && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, pathname, router]);

  return <>{children}</>;
}
