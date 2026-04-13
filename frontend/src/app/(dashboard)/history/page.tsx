"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

type TradeHistoryApiRow = {
  id: string;
  athlete_id: string;
  type: string;
  amount_inr: string;
  tokens: string;
  status: string;
  created_at: string;
};

type HistoryTrade = {
  id: string;
  athleteName: string;
  type: string;
  tokens: number;
  totalInr: number;
  status: string;
  createdAt: string;
};

const parseAmount = (value?: string) => {
  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [historyRes, athletesRes] = await Promise.all([
          api.get("/trade/history?limit=50"),
          api.get("/athletes?limit=50")
        ]);

        const athleteRows = Array.isArray(athletesRes.data?.athletes)
          ? (athletesRes.data.athletes as Array<{ id: string; name: string }>)
          : [];

        const athleteNameById = new Map<string, string>(
          athleteRows.map((athlete) => [athlete.id, athlete.name])
        );

        const tradeRows = Array.isArray(historyRes.data?.trades)
          ? (historyRes.data.trades as TradeHistoryApiRow[])
          : [];

        setHistory(
          tradeRows.map((trade) => ({
            id: trade.id,
            athleteName: athleteNameById.get(trade.athlete_id) ?? trade.athlete_id,
            type: trade.type,
            tokens: parseAmount(trade.tokens),
            totalInr: parseAmount(trade.amount_inr),
            status: trade.status,
            createdAt: trade.created_at
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trade History</h1>
        <p className="text-gray-500">View your past transactions and trade execution details.</p>
      </div>

      <Card>
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading history...</div>
        ) : history.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Athlete</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Total (INR)</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                    {format(new Date(trade.createdAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trade.type === "BUY" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {trade.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{trade.athleteName}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{trade.tokens.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">₹{trade.totalInr.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs uppercase font-medium text-green-600 tracking-wider">
                      {trade.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardContent className="py-12 text-center text-gray-500">
            No trades found. Make your first trade in the Market.
          </CardContent>
        )}
      </Card>
    </div>
  );
}
