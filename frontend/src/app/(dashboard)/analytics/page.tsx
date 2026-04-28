"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";

type AnalyticsData = {
  totalValueLocked: number;
  platformVolume24h: number;
  totalAthletesFunded: number;
  topPerformingTokens: Array<{
    name: string;
    currentPrice: string;
    return: string;
    volume: string;
  }>;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/analytics");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-gray-500">Deep dive into market trends, pool health, and athlete performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-indigo-100">Total Value Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹ {Number(data.totalValueLocked).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
            <p className="text-sm text-indigo-200 mt-2">Live from athlete pools</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-emerald-100">Platform Volume (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹ {Number(data.platformVolume24h).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
            <p className="text-sm text-emerald-200 mt-2">Recent trading activity</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-orange-100">Total Athletes Funded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalAthletesFunded}</div>
            <p className="text-sm text-orange-200 mt-2">Currently on platform</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Tokens (Recent)</CardTitle>
            <CardDescription>Athletes with the highest token price</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPerformingTokens.map((athlete, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b last:border-0">
                  <div className="font-medium">{athlete.name}</div>
                  <div className="text-right">
                    <div className={athlete.return.startsWith('-') ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                      {athlete.return} (₹{Number(athlete.currentPrice).toFixed(2)})
                    </div>
                    <div className="text-xs text-gray-500">Vol: {athlete.volume}</div>
                  </div>
                </div>
              ))}
              {data.topPerformingTokens.length === 0 && (
                <div className="text-center text-sm text-gray-500">No token data available yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Pool Health</CardTitle>
            <CardDescription>Ratio of donation vs pool deposit over time</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed">
            <div className="text-center text-gray-500">
              <div className="mb-2 text-sm font-medium">Insufficient Historical Data</div>
              <div className="text-xs">More trading activity is required to generate this chart.</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Platform Metrics</CardTitle>
            <CardDescription>Daily active users and transaction count</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed">
             <div className="text-center text-gray-500">
              <div className="mb-2 text-sm font-medium">Insufficient Historical Data</div>
              <div className="text-xs">Active users and transaction trends will appear here.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
