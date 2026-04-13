"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-20 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center justify-end px-8 fixed top-0 right-0 left-0 md:left-64 z-10 transition-all">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-gray-900">{user?.name || "Investor"}</div>
            <div className="text-xs text-gray-500 font-medium">Standard Account</div>
          </div>
          <div className="h-10 w-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center shadow-sm border border-primary-100">
            <UserCircle className="h-6 w-6" />
          </div>
        </div>
        
        <div className="h-8 w-px bg-gray-200" />
        
        <Button 
          variant="ghost" 
          className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-full px-3" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="text-sm font-semibold">Logout</span>
        </Button>
      </div>
    </header>
  );
}
