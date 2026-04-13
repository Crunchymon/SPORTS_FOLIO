"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Wallet } from "lucide-react";

export default function WalletPage() {
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [depositAmount, setDepositAmount] = useState("");
  const [depositReference, setDepositReference] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const fetchBalance = async () => {
    try {
      const res = await api.get("/wallet/balance");
      setBalance(res.data.balance || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    setDepositLoading(true);

    try {
      await api.post("/wallet/deposit", {
        amount: depositAmount,
        payment_reference: depositReference || `REF-${Date.now()}`,
      });
      setMsg({ text: `Deposit successful. 1% platform fee applied.`, type: "success" });
      setDepositAmount("");
      setDepositReference("");
      fetchBalance();
    } catch (err: any) {
      setMsg({ text: err.response?.data?.error || "Deposit failed", type: "error" });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    setWithdrawLoading(true);

    try {
      await api.post("/wallet/withdraw", {
        amount: withdrawAmount,
      });
      setMsg({ text: `Withdrawal request submitted.`, type: "success" });
      setWithdrawAmount("");
      fetchBalance();
    } catch (err: any) {
      setMsg({ text: err.response?.data?.error || "Withdrawal failed", type: "error" });
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
        <p className="text-gray-500">Manage your INR funds. A 1% fee applies to investments.</p>
      </div>

      {msg.text && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-start gap-3 w-80 animate-in slide-in-from-bottom-5 fade-in duration-300 ${msg.type === "error" ? "bg-red-50 text-red-800 border border-red-100" : "bg-green-50 text-green-800 border border-green-100"}`}>
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
             <p className="text-sm font-semibold">{msg.type === "error" ? "Error" : "Success"}</p>
             <p className="text-sm mt-1">{msg.text}</p>
          </div>
          <button onClick={() => setMsg({text: "", type: ""})} className="opacity-50 hover:opacity-100">&times;</button>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading wallet data...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-3 border-primary-100 bg-primary-50/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Available Balance</CardTitle>
              <Wallet className="h-6 w-6 text-primary-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900">₹{balance?.current_balance || "0.00"}</div>
              <p className="text-sm text-gray-500 mt-2">
                Pending Withdrawals: ₹{balance?.pending_withdrawal_balance || "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Deposit INR</CardTitle>
              <CardDescription>Instant credit to your SportsFolio wallet.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeposit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium font-mono">₹</div>
                    <Input
                      type="number"
                      required
                      min="100"
                      step="1"
                      className="pl-8"
                      placeholder="e.g. 5000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference (Optional)</label>
                  <Input
                    type="text"
                    placeholder="e.g. UTR123456"
                    value={depositReference}
                    onChange={(e) => setDepositReference(e.target.value)}
                  />
                </div>
                <Button type="submit" isLoading={depositLoading}>
                  Add Funds
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Withdraw</CardTitle>
              <CardDescription>Transfer funds to your bank.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium font-mono">₹</div>
                    <Input
                      type="number"
                      required
                      min="100"
                      step="1"
                      className="pl-8"
                      placeholder="e.g. 1000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="outline" type="submit" className="w-full" isLoading={withdrawLoading}>
                  Request Withdrawal
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Withdrawal requests are processed within 24 hours.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
