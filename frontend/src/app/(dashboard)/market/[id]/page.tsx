"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// Generate fake price history for the graph
const generateGraphData = (currentPrice: number) => {
  const data = [];
  let price = currentPrice * 0.5; // Start lower
  for (let i = 30; i >= 0; i--) {
    const change = (Math.random() - 0.4) * (currentPrice * 0.1); 
    price = price + change;
    data.push({
      day: `-${i}d`,
      price: Math.max(10, price).toFixed(2),
    });
  }
  // Ensure the last point matches current exactly
  data[data.length - 1].price = parseFloat(currentPrice as any).toFixed(2);
  return data;
};

export default function AthleteDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [athlete, setAthlete] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Trade state
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState("");
  const [tradeSuccess, setTradeSuccess] = useState("");
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const res = await api.get(`/athletes/${id}`);
        const data = res.data.athlete || res.data;
        setAthlete(data);
        
        const cPrice = parseFloat(data.currentPrice || '100');
        setChartData(generateGraphData(cPrice));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAthlete();
  }, [id]);

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setTradeError("");
    setTradeSuccess("");
    setTradeLoading(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      
      if (tradeMode === "buy") {
        await api.post(
          "/trade/buy",
          { athlete_id: id, amount_inr: tradeAmount },
          { headers: { "X-Idempotency-Key": idempotencyKey } }
        );
        setTradeSuccess(`Successfully bought ₹${tradeAmount} worth of tokens!`);
      } else {
        await api.post(
          "/trade/sell",
          { athlete_id: id, token_amount: tradeAmount },
          { headers: { "X-Idempotency-Key": idempotencyKey } }
        );
        setTradeSuccess(`Successfully sold ${tradeAmount} tokens!`);
      }
      
      // Refresh athlete price and data
      const refreshRes = await api.get(`/athletes/${id}`);
      setAthlete(refreshRes.data.athlete || refreshRes.data);
      setTradeAmount("");
    } catch (err: any) {
      setTradeError(err.response?.data?.error || "Trade failed. Please try again.");
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading details...</div>;
  if (!athlete) return <div className="text-center py-12 text-gray-500">Athlete not found.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link href="/market" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Market
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Details & Chart */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{athlete.name}</h1>
              <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-bold tracking-wide">
                {athlete.sport}
              </span>
            </div>
            <p className="text-gray-500 max-w-2xl">{athlete.bio || "No bio available."}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Current Price</div>
                <div className="text-xl font-bold font-mono">₹{parseFloat(athlete.currentPrice || '0').toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Total Supply</div>
                <div className="text-xl font-bold font-mono">{parseFloat(athlete.totalSupply || '0').toFixed(0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Market Cap</div>
                <div className="text-xl font-bold font-mono">₹{((parseFloat(athlete.currentPrice || '0') * parseFloat(athlete.totalSupply || '0')) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Volume (24h)</div>
                <div className="text-xl font-bold font-mono">₹{parseFloat(athlete.virtualReserveB || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Price History</CardTitle>
              <CardDescription>30 day simulated performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`₹${value}`, 'Price']}
                    />
                    <Area type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Trading Panel */}
        <div className="w-full lg:w-96 shrink-0">
          <Card className="sticky top-24 border-primary-100 shadow-lg shadow-primary-900/5">
            <CardHeader className="pb-4 border-b border-gray-100 mb-4 bg-gray-50/50 rounded-t-xl">
              <CardTitle>Trade Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex rounded-md bg-gray-100 p-1 mb-6">
                <button
                  className={`flex-1 rounded py-2 text-sm font-medium transition-colors ${
                    tradeMode === "buy" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setTradeMode("buy")}
                >
                  Buy
                </button>
                <button
                  className={`flex-1 rounded py-2 text-sm font-medium transition-colors ${
                    tradeMode === "sell" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setTradeMode("sell")}
                >
                  Sell
                </button>
              </div>

              {tradeError && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{tradeError}</p>
                </div>
              )}

              {tradeSuccess && (
                <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-md text-sm font-medium">
                  {tradeSuccess}
                </div>
              )}

              <form onSubmit={handleTrade} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tradeMode === "buy" ? "Amount (INR)" : "Amount (Tokens)"}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step={tradeMode === "buy" ? "1" : "0.01"}
                      min={tradeMode === "buy" ? "10" : "0.01"}
                      required
                      placeholder={tradeMode === "buy" ? "e.g. 500" : "e.g. 5.5"}
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      className="text-lg"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                      {tradeMode === "buy" ? "₹" : "TOK"}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Est. Price / Token</span>
                    <span className="font-mono font-medium text-gray-900">₹{parseFloat(athlete.currentPrice || '0').toFixed(2)}</span>
                  </div>
                  {tradeAmount && athlete.currentPrice && (
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span>You will {tradeMode === "buy" ? "receive approx." : "receive approx."}</span>
                      <span className="font-mono font-bold text-gray-900">
                        {tradeMode === "buy" 
                          ? `~${(parseFloat(tradeAmount) / parseFloat(athlete.currentPrice)).toFixed(4)} TOK` 
                          : `~₹${(parseFloat(tradeAmount) * parseFloat(athlete.currentPrice)).toFixed(2)}`
                        }
                      </span>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className={`w-full text-lg h-12 ${tradeMode === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
                  isLoading={tradeLoading}
                >
                  {tradeMode === "buy" ? "Place Buy Order" : "Place Sell Order"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
