"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type Bot = {
  id: string;
  strategyType: string;
  config: {
    name: string;
    targetAthlete: string;
    tradeSize: number;
  };
  walletBalance: string;
  isActive: boolean;
};

export default function BotsPage() {
  const [activeBots, setActiveBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);

  const [botName, setBotName] = useState("");
  const [targetAthlete, setTargetAthlete] = useState("");
  const [strategy, setStrategy] = useState("Momentum Follower");
  const [tradeSize, setTradeSize] = useState("");
  const [deploying, setDeploying] = useState(false);

  const fetchBots = async () => {
    try {
      const res = await api.get("/bots");
      setActiveBots(res.data.bots || []);
    } catch (error) {
      console.error("Failed to fetch bots:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeploying(true);
    try {
      await api.post("/bots", {
        name: botName,
        targetAthlete,
        strategy,
        tradeSize: Number(tradeSize)
      });
      setBotName("");
      setTargetAthlete("");
      setTradeSize("");
      fetchBots();
    } catch (error) {
      console.error("Failed to deploy bot:", error);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Bots</h1>
          <p className="text-gray-500">Configure and deploy automated trading strategies.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Active Bots</CardTitle>
              <CardDescription>Monitor the performance of your deployed strategies</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-6 text-gray-500">Loading bots...</div>
              ) : activeBots.length > 0 ? (
                <div className="space-y-4">
                  {activeBots.map(bot => (
                    <div key={bot.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div>
                        <div className="font-bold">{bot.config.name}</div>
                        <div className="text-sm text-gray-500">Strategy: {bot.strategyType}</div>
                        <div className="text-xs text-gray-400 mt-1">Target: {bot.config.targetAthlete}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-bold text-gray-900`}>
                          Bal: ₹{Number(bot.walletBalance).toFixed(2)}
                        </div>
                        <div className={`text-xs uppercase font-bold ${bot.isActive ? "text-green-500" : "text-gray-400"}`}>
                          {bot.isActive ? "Active" : "Paused"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500 border border-dashed rounded-lg">
                  You don't have any active bots.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Custom Strategy</CardTitle>
              <CardDescription>Configure parameters for a new trading bot</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeploy} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bot Name</label>
                    <Input required value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="e.g. My Momentum Bot" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Athlete (Token)</label>
                    <Input required value={targetAthlete} onChange={(e) => setTargetAthlete(e.target.value)} placeholder="Search athlete..." />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Strategy Type</label>
                    <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option>Momentum Follower</option>
                      <option>Mean Reversion</option>
                      <option>Noise Trader</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Trigger Value</label>
                    <Input placeholder="e.g. 5 for 5%" type="number" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Trade Size (INR)</label>
                    <Input required value={tradeSize} onChange={(e) => setTradeSize(e.target.value)} placeholder="e.g. 1000" type="number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Take Profit (%)</label>
                    <Input placeholder="e.g. 10" type="number" />
                  </div>
                </div>

                <Button type="submit" disabled={deploying} className="w-full">
                  {deploying ? "Deploying..." : "Deploy Bot"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Strategies</CardTitle>
              <CardDescription>Pre-built bots available on the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-bold text-sm">Momentum Bot</h4>
                <p className="text-xs text-gray-500 mt-1">Buys when price goes up, sells when it goes down. Amplifies trends.</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-bold text-sm">Mean Reversion</h4>
                <p className="text-xs text-gray-500 mt-1">Buys dips and sells pumps, assuming price returns to an average.</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-bold text-sm">Noise Trader</h4>
                <p className="text-xs text-gray-500 mt-1">Simulates random retail activity to provide baseline liquidity.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
