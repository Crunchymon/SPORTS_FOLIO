"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, TrendingUp, History, Wallet, Sparkles, Settings, Bot, BarChart } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Portfolio", href: "/dashboard", icon: LayoutDashboard },
    { name: "Market", href: "/market", icon: TrendingUp },
    { name: "Trade History", href: "/history", icon: History },
    { name: "Wallet", href: "/wallet", icon: Wallet },
    { name: "Bots", href: "/bots", icon: Bot },
    { name: "Analytics", href: "/analytics", icon: BarChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 border-r border-gray-100 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col hidden md:flex min-h-screen fixed inset-y-0 left-0 z-20">
      <div className="h-20 flex items-center px-6 border-b border-gray-50">
        <Link href="/dashboard" className="flex items-center gap-3 transition-transform hover:scale-105 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-400 text-white flex items-center justify-center shadow-md shadow-primary-500/30">
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">SportsFolio</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-8 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-md" />
              )}
              <Icon className={cn("h-5 w-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
              {link.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100/50">
        <h4 className="text-xs font-bold text-primary-900 uppercase tracking-wider mb-2">Need Help?</h4>
        <p className="text-xs text-primary-700/80 mb-3">Contact support or view our guides on trading.</p>
        <button className="text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors">
          View Documentation &rarr;
        </button>
      </div>
    </div>
  );
}
