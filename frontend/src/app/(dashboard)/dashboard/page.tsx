"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, History, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardParams = async () => {
      try {
        const [portfolioRes, historyRes] = await Promise.all([
          api.get("/portfolio"),
          api.get("/trade/history")
        ]);
        
        setPortfolio(portfolioRes.data);
        // Take top 5 recent trades
        setRecentTrades((historyRes.data || []).slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardParams();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const cashBalance = parseFloat(portfolio?.cashBalance || "0");
  const investedAmount = parseFloat(portfolio?.investedAmount || "0");
  const totalValue = cashBalance + investedAmount;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
        <p className="text-gray-500 mt-1">Here is the latest snapshot of your portfolio.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary-600 to-indigo-800 text-white border-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-100 font-medium text-sm">Total Value (INR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-500 font-medium text-sm">Available Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-gray-900">₹{cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-500 font-medium text-sm">Invested Capital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-gray-900">₹{investedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Positions */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Active Positions</CardTitle>
              <CardDescription>Your current holdings across all athletes</CardDescription>
            </div>
            <Link href="/market" className={buttonVariants({ variant: "outline", size: "sm" })}>Trade <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </CardHeader>
          <CardContent className="flex-1">
            {portfolio?.positions && portfolio.positions.length > 0 ? (
              <div className="space-y-4">
                {portfolio.positions.map((pos: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                         {pos.athlete?.name?.charAt(0) || "A"}
                       </div>
                       <div>
                         <p className="font-semibold text-gray-900">{pos.athlete?.name || "Athlete"}</p>
                         <p className="text-xs font-medium text-gray-500">{pos.athlete?.sport || "Sport"}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="font-mono font-bold text-gray-900">{parseFloat(pos.tokenAmount).toFixed(2)} TOK</p>
                       <p className="text-xs text-gray-500">Avg: ₹{parseFloat(pos.averageBuyPrice).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <TrendingUp className="h-8 w-8 text-gray-300 mb-2" />
                <p>No active positions found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6 flex flex-col">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link href="/wallet" className={buttonVariants({ variant: "secondary", className: "w-full flex-col h-auto py-3 gap-1" })}>
                  <Wallet className="h-5 w-5 mb-1" />
                  Deposit
              </Link>
              <Link href="/market" className={buttonVariants({ variant: "secondary", className: "w-full flex-col h-auto py-3 gap-1 bg-white border border-gray-200 hover:bg-gray-50" })}>
                  <TrendingUp className="h-5 w-5 mb-1 text-primary-600" />
                  Trade
              </Link>
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/history" className={buttonVariants({ variant: "ghost", size: "icon" })}><History className="h-4 w-4" /></Link>
            </CardHeader>
            <CardContent>
              {recentTrades.length > 0 ? (
                <div className="space-y-4">
                  {recentTrades.map((trade: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${trade.tradeType === 'BUY' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {trade.tradeType === 'BUY' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {trade.athlete?.name || "Athlete"}
                          </p>
                          <p className="text-xs text-gray-400">{format(new Date(trade.createdAt), "MMM d, h:mm a")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold font-mono ${trade.tradeType === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.tradeType === 'BUY' ? '+' : '-'}{parseFloat(trade.tokenAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-500">
                  No recent trades.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
