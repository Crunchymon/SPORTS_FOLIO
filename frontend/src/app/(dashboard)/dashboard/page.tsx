"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  History,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type PortfolioApiRow = {
  athlete_id: string;
  athlete_name: string;
  tokens_held: string;
  avg_buy_price: string;
  current_price: string;
};

type TradeHistoryApiRow = {
  id: string;
  athlete_id: string;
  type: string;
  tokens: string;
  created_at: string;
};

type DashboardPosition = {
  athleteName: string;
  athleteId: string;
  tokensHeld: number;
  avgBuyPrice: number;
  currentPrice: number;
};

type DashboardTrade = {
  id: string;
  athleteName: string;
  type: string;
  tokens: number;
  createdAt: string;
};

const parseAmount = (value?: string) => {
  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function DashboardPage() {
  const [positions, setPositions] = useState<DashboardPosition[]>([]);
  const [recentTrades, setRecentTrades] = useState<DashboardTrade[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [investedAmount, setInvestedAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [portfolioRes, historyRes, walletRes, athletesRes] = await Promise.all([
          api.get("/portfolio"),
          api.get("/trade/history?limit=5"),
          api.get("/wallet/balance"),
          api.get("/athletes?limit=50")
        ]);

        const athleteRows = Array.isArray(athletesRes.data?.athletes)
          ? (athletesRes.data.athletes as Array<{ id: string; name: string }>)
          : [];
        const athleteNameById = new Map(athleteRows.map((athlete) => [athlete.id, athlete.name]));

        const portfolioRows = Array.isArray(portfolioRes.data?.portfolio)
          ? (portfolioRes.data.portfolio as PortfolioApiRow[])
          : [];

        const mappedPositions: DashboardPosition[] = portfolioRows.map((row) => ({
          athleteName: row.athlete_name,
          athleteId: row.athlete_id,
          tokensHeld: parseAmount(row.tokens_held),
          avgBuyPrice: parseAmount(row.avg_buy_price),
          currentPrice: parseAmount(row.current_price)
        }));

        const tradeRows = Array.isArray(historyRes.data?.trades)
          ? (historyRes.data.trades as TradeHistoryApiRow[])
          : [];

        const mappedTrades: DashboardTrade[] = tradeRows.map((trade) => ({
          id: trade.id,
          athleteName: athleteNameById.get(trade.athlete_id) ?? trade.athlete_id,
          type: trade.type,
          tokens: parseAmount(trade.tokens),
          createdAt: trade.created_at
        }));

        const availableCash = parseAmount(walletRes.data?.balance);
        const totalInvested = mappedPositions.reduce(
          (sum, position) => sum + position.tokensHeld * position.avgBuyPrice,
          0
        );

        setPositions(mappedPositions);
        setRecentTrades(mappedTrades);
        setCashBalance(availableCash);
        setInvestedAmount(totalInvested);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

  const totalValue = cashBalance + investedAmount;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
        <p className="text-gray-500 mt-1">Here is the latest snapshot of your portfolio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary-600 to-indigo-800 text-white border-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-100 font-medium text-sm">Total Value (INR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              ₹{totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-500 font-medium text-sm">Available Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-gray-900">
              ₹{cashBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-500 font-medium text-sm">Invested Capital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-gray-900">
              ₹{investedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Active Positions</CardTitle>
              <CardDescription>Your current holdings across all athletes</CardDescription>
            </div>
            <Link href="/market" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Trade <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {positions.length > 0 ? (
              <div className="space-y-4">
                {positions.map((position) => (
                  <div
                    key={`${position.athleteId}-${position.tokensHeld}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                        {position.athleteName.charAt(0) || "A"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{position.athleteName}</p>
                        <p className="text-xs font-medium text-gray-500">
                          Current: ₹
                          {position.currentPrice.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-gray-900">{position.tokensHeld.toFixed(2)} TOK</p>
                      <p className="text-xs text-gray-500">Avg: ₹{position.avgBuyPrice.toFixed(2)}</p>
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

        <div className="space-y-6 flex flex-col">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link
                href="/wallet"
                className={buttonVariants({
                  variant: "secondary",
                  className: "w-full flex-col h-auto py-3 gap-1"
                })}
              >
                <Wallet className="h-5 w-5 mb-1" />
                Deposit
              </Link>
              <Link
                href="/market"
                className={buttonVariants({
                  variant: "secondary",
                  className: "w-full flex-col h-auto py-3 gap-1 bg-white border border-gray-200 hover:bg-gray-50"
                })}
              >
                <TrendingUp className="h-5 w-5 mb-1 text-primary-600" />
                Trade
              </Link>
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/history" className={buttonVariants({ variant: "ghost", size: "icon" })}>
                <History className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentTrades.length > 0 ? (
                <div className="space-y-4">
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${trade.type === "BUY" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                          {trade.type === "BUY" ? (
                            <ArrowDownRight className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {trade.athleteName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(trade.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold font-mono ${trade.type === "BUY" ? "text-green-600" : "text-red-600"}`}>
                          {trade.type === "BUY" ? "+" : "-"}
                          {trade.tokens.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-500">No recent trades.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
