"use client";

import { useEffect, useMemo, useState } from "react";
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

type AthleteDetailApi = {
  id: string;
  name: string;
  kyc_status: string;
  token?: {
    current_price?: string;
    current_supply?: string;
    pool_balance?: string;
  };
  price_history?: Array<{
    sampled_at: string;
    price: string;
  }>;
};

type ChartPoint = {
  day: string;
  price: number;
};

type TradeExecutionResponse = {
  new_token_price?: string;
  new_supply?: string;
};

type WalletBalanceApi = {
  balance?: string;
};

type PortfolioApiRow = {
  athlete_id: string;
  tokens_held: string;
};

type AthleteDetailView = {
  id: string;
  name: string;
  kycStatus: string;
  currentPrice: number;
  totalSupply: number;
  poolBalance: number;
  priceHistory: ChartPoint[];
};

const toChartPoints = (prices: number[]): ChartPoint[] => {
  const lastIndex = Math.max(prices.length - 1, 0);
  return prices.map((price, index) => ({
    day: `-${lastIndex - index}d`,
    price
  }));
};

const parsePositive = (value: string) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const formatInputValue = (value: number, decimals: number) => {
  const fixed = value.toFixed(decimals);
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
};

const normalizeAthlete = (data: AthleteDetailApi): AthleteDetailView => {
  const history = Array.isArray(data.price_history) ? data.price_history : [];
  const currentPrice = Number.parseFloat(data.token?.current_price ?? "0") || 0;
  const historyPrices = history
    .map((point) => Number.parseFloat(point.price) || 0)
    .filter((price) => price > 0);

  const lastHistoryPrice = historyPrices[historyPrices.length - 1] ?? 0;
  if (currentPrice > 0 && Math.abs(lastHistoryPrice - currentPrice) > 0.0000001) {
    historyPrices.push(currentPrice);
  }

  return {
    id: data.id,
    name: data.name,
    kycStatus: data.kyc_status,
    currentPrice,
    totalSupply: Number.parseFloat(data.token?.current_supply ?? "0") || 0,
    poolBalance: Number.parseFloat(data.token?.pool_balance ?? "0") || 0,
    priceHistory: toChartPoints(historyPrices)
  };
};

export default function AthleteDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [athlete, setAthlete] = useState<AthleteDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Trade state
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [amountInr, setAmountInr] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [lastEditedField, setLastEditedField] = useState<"inr" | "token" | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState("");
  const [tradeSuccess, setTradeSuccess] = useState("");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [heldTokens, setHeldTokens] = useState(0);

  const holdingsValue = useMemo(
    () => heldTokens * (athlete?.currentPrice ?? 0),
    [heldTokens, athlete?.currentPrice]
  );

  const maxBuyTokens = useMemo(() => {
    const currentPrice = athlete?.currentPrice ?? 0;
    if (currentPrice <= 0) {
      return 0;
    }

    return walletBalance / currentPrice;
  }, [walletBalance, athlete?.currentPrice]);

  const syncFromInr = (nextInr: string, markAsEdited = true) => {
    if (markAsEdited) {
      setLastEditedField("inr");
    }

    setAmountInr(nextInr);

    const parsedInr = parsePositive(nextInr);
    if (parsedInr === null || !athlete || athlete.currentPrice <= 0 || nextInr.trim() === "") {
      setTokenAmount("");
      return;
    }

    setTokenAmount(formatInputValue(parsedInr / athlete.currentPrice, 6));
  };

  const syncFromTokens = (nextTokens: string, markAsEdited = true) => {
    if (markAsEdited) {
      setLastEditedField("token");
    }

    setTokenAmount(nextTokens);

    const parsedTokens = parsePositive(nextTokens);
    if (parsedTokens === null || !athlete || athlete.currentPrice <= 0 || nextTokens.trim() === "") {
      setAmountInr("");
      return;
    }

    setAmountInr(formatInputValue(parsedTokens * athlete.currentPrice, 2));
  };

  const appendLivePrice = (nextPrice: number) => {
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      return;
    }

    setChartData((prev) => {
      const currentPrices = prev
        .map((point) => point.price)
        .filter((price) => Number.isFinite(price) && price > 0);

      return toChartPoints([...currentPrices, nextPrice].slice(-60));
    });
  };

  useEffect(() => {
    if (!athlete || athlete.currentPrice <= 0) {
      return;
    }

    if (lastEditedField === "inr" && amountInr.trim() !== "") {
      syncFromInr(amountInr, false);
      return;
    }

    if (lastEditedField === "token" && tokenAmount.trim() !== "") {
      syncFromTokens(tokenAmount, false);
    }
  }, [athlete?.currentPrice]);

  const fetchAthlete = async () => {
    const res = await api.get(`/athletes/${id}`);
    const payload = (res.data?.athlete ?? res.data) as AthleteDetailApi;
    const normalized = normalizeAthlete(payload);

    setAthlete(normalized);
    setChartData(normalized.priceHistory);
  };

  const fetchAccountSnapshot = async () => {
    try {
      const [walletRes, portfolioRes] = await Promise.all([
        api.get("/wallet/balance"),
        api.get("/portfolio")
      ]);

      const wallet = (walletRes.data ?? {}) as WalletBalanceApi;
      const walletValue = Number.parseFloat(wallet.balance ?? "0");
      setWalletBalance(Number.isFinite(walletValue) ? walletValue : 0);

      const rows = Array.isArray(portfolioRes.data?.portfolio)
        ? (portfolioRes.data.portfolio as PortfolioApiRow[])
        : [];

      const currentHolding = rows.find((row) => row.athlete_id === id);
      const tokens = Number.parseFloat(currentHolding?.tokens_held ?? "0");
      setHeldTokens(Number.isFinite(tokens) ? tokens : 0);
    } catch (error) {
      console.error("Failed to load wallet/holding snapshot", error);
      setWalletBalance(0);
      setHeldTokens(0);
    }
  };

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        await Promise.all([fetchAthlete(), fetchAccountSnapshot()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchPageData();
    }
  }, [id]);

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setTradeError("");
    setTradeSuccess("");
    setTradeLoading(true);

    try {
      const parsedInr = parsePositive(amountInr);
      const parsedTokens = parsePositive(tokenAmount);

      if (parsedInr === null || parsedTokens === null || parsedInr <= 0 || parsedTokens <= 0) {
        throw new Error("Please enter a valid INR amount and token quantity.");
      }

      if (tradeMode === "buy" && parsedInr > walletBalance) {
        throw new Error("Entered INR amount is greater than available wallet balance.");
      }

      if (tradeMode === "sell" && parsedTokens > heldTokens) {
        throw new Error("Entered token quantity exceeds your holdings for this athlete.");
      }

      const idempotencyKey = crypto.randomUUID();
      
      let tradeResponse;

      if (tradeMode === "buy") {
        tradeResponse = await api.post(
          "/trade/buy",
          { athlete_id: id, amount_inr: formatInputValue(parsedInr, 8) },
          { headers: { "X-Idempotency-Key": idempotencyKey } }
        );
        setTradeSuccess(`Successfully bought ~${formatInputValue(parsedTokens, 6)} tokens.`);
      } else {
        tradeResponse = await api.post(
          "/trade/sell",
          { athlete_id: id, token_amount: formatInputValue(parsedTokens, 8) },
          { headers: { "X-Idempotency-Key": idempotencyKey } }
        );
        setTradeSuccess(`Successfully sold ${formatInputValue(parsedTokens, 6)} tokens.`);
      }

      const tradePayload = (tradeResponse?.data ?? {}) as TradeExecutionResponse;
      const livePrice = Number.parseFloat(tradePayload.new_token_price ?? "0");
      const liveSupply = Number.parseFloat(tradePayload.new_supply ?? "0");

      if (livePrice > 0) {
        setAthlete((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            currentPrice: livePrice,
            totalSupply: liveSupply > 0 ? liveSupply : prev.totalSupply
          };
        });

        appendLivePrice(livePrice);
      }
      
      // Refresh athlete, wallet and holdings after settlement
      await Promise.all([fetchAthlete(), fetchAccountSnapshot()]);
      setAmountInr("");
      setTokenAmount("");
      setLastEditedField(null);
    } catch (err: any) {
      setTradeError(err.response?.data?.error || err.message || "Trade failed. Please try again.");
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
              <span className={`px-3 py-1 rounded-full text-sm font-bold tracking-wide ${
                athlete.kycStatus === "VERIFIED"
                  ? "bg-green-50 text-green-700"
                  : athlete.kycStatus === "REJECTED"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
              }`}>
                {athlete.kycStatus}
              </span>
            </div>
            <p className="text-gray-500 max-w-2xl">Live athlete token metrics and trade panel.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Current Price</div>
                <div className="text-xl font-bold font-mono">₹{athlete.currentPrice.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Total Supply</div>
                <div className="text-xl font-bold font-mono">{athlete.totalSupply.toFixed(0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Market Cap</div>
                <div className="text-xl font-bold font-mono">₹{(athlete.currentPrice * athlete.totalSupply).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Volume (24h)</div>
                <div className="text-xl font-bold font-mono">₹{athlete.poolBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Price History</CardTitle>
              <CardDescription>30 day price movement from backend history</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
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
                        formatter={(value) => {
                          const numericValue =
                            typeof value === "number"
                              ? value
                              : Number.parseFloat(String(value ?? 0));

                          return [`₹${numericValue.toFixed(2)}`, "Price"];
                        }}
                      />
                      <Area type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] w-full rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500 flex items-center justify-center">
                  No price history available yet.
                </div>
              )}
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

              <div className="mb-4 bg-gray-50 p-3 rounded-md text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Wallet Balance</span>
                  <span className="font-mono font-semibold text-gray-900">
                    ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Your Holdings</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {heldTokens.toFixed(4)} TOK
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Holding Value</span>
                  <span className="font-mono font-semibold text-gray-900">
                    ₹{holdingsValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <form onSubmit={handleTrade} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (INR)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="e.g. 500"
                      value={amountInr}
                      onChange={(e) => syncFromInr(e.target.value)}
                      className="text-lg"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                      ₹
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tokens (TOK)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.000001"
                      min="0"
                      required
                      placeholder="e.g. 5.5"
                      value={tokenAmount}
                      onChange={(e) => syncFromTokens(e.target.value)}
                      className="text-lg"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                      TOK
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Est. Price / Token</span>
                    <span className="font-mono font-medium text-gray-900">₹{athlete.currentPrice.toFixed(2)}</span>
                  </div>
                  {amountInr && tokenAmount && athlete.currentPrice > 0 && (
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span>{tradeMode === "buy" ? "Approx. tokens to receive" : "Approx. INR to receive"}</span>
                      <span className="font-mono font-bold text-gray-900">
                        {tradeMode === "buy" 
                          ? `~${Number.parseFloat(tokenAmount || "0").toFixed(4)} TOK` 
                          : `~₹${Number.parseFloat(amountInr || "0").toFixed(2)}`
                        }
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span>{tradeMode === "buy" ? "Max Buy Capacity" : "Max Sell Capacity"}</span>
                    <span className="font-mono font-medium text-gray-900">
                      {tradeMode === "buy"
                        ? `${maxBuyTokens.toFixed(4)} TOK`
                        : `${heldTokens.toFixed(4)} TOK`}
                    </span>
                  </div>
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
