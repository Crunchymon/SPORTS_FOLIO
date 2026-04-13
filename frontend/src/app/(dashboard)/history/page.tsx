"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/trade/history?limit=50");
        setHistory(res.data.history || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const historyList = Array.isArray(history) ? history : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trade History</h1>
        <p className="text-gray-500">View your past transactions and trade execution details.</p>
      </div>

      <Card>
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading history...</div>
        ) : historyList.length > 0 ? (
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
              {historyList.map((trade: any) => (
                <TableRow key={trade.id}>
                  <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                    {format(new Date(trade.createdAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trade.tradeType === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {trade.tradeType}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{trade.athlete?.name || "Unknown"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{parseFloat(trade.tokenAmount).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">₹{parseFloat(trade.totalInr).toFixed(2)}</TableCell>
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
