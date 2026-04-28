"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { user, login, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleKycVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Calling the backend mock endpoint with some dummy details
      const res = await api.post("/auth/kyc/verify", {
        pan_number: "ABCDE1234F",
        bank_account: "1234567890",
        bank_ifsc: "SBIN0000001",
      });
      setMessage("KYC Verification Successful! You can now trade tokens.");
      if (user && token) {
        login({ ...user, kyc_verified: true }, token);
      }
    } catch (error: any) {
      setMessage("Failed to verify KYC: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification (Mock)</CardTitle>
          <CardDescription>
            Verify your identity to start trading on SportsFolio. This is a mock verification process for testing purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.kyc_verified ? (
            <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm font-medium border border-green-200 flex items-start gap-3 max-w-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-base mb-1">Account Verified</p>
                <p className="text-green-700">Your identity verification is complete. You have full access to trading features on SportsFolio.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleKycVerification} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium">PAN Number</label>
                <Input value="ABCDE1234F" disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank Account Number</label>
                <Input value="1234567890" disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank IFSC Code</label>
                <Input value="SBIN0000001" disabled />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Verifying..." : "Mock Verify KYC"}
              </Button>
              
              {message && (
                <div className={`p-3 rounded-md text-sm ${message.includes("Successful") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message}
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Payments & Billing</CardTitle>
          <CardDescription>
            Manage your payment methods and billing history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 text-amber-700 rounded-md text-sm">
            Note: Payment gateway integration (Razorpay/Paytm) is scheduled for a future milestone and will be implemented later.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
