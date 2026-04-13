"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";

export default function MarketPage() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("market_cap"); // price, market_cap, volume

  const fetchAthletes = async (sort: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/athletes?sort=${sort}&limit=50`);
      setAthletes(res.data.athletes || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAthletes(sortBy);
  }, [sortBy]);

  // Handle differences in API response gracefully if it's an array or nested object
  const athletesList = Array.isArray(athletes) ? athletes : [];
  
  const filteredAthletes = athletesList.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.sport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market</h1>
          <p className="text-gray-500">Trade athlete tokens. Prices are determined by a bonding curve.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search athletes or sports..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={sortBy === 'market_cap' ? 'default' : 'outline'} 
            onClick={() => setSortBy('market_cap')}
            size="sm"
          >
            Market Cap
          </Button>
          <Button 
            variant={sortBy === 'price' ? 'default' : 'outline'} 
            onClick={() => setSortBy('price')}
            size="sm"
          >
            Price
          </Button>
          <Button 
            variant={sortBy === 'volume' ? 'default' : 'outline'} 
            onClick={() => setSortBy('volume')}
            size="sm"
          >
            Volume
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading market data...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAthletes.length > 0 ? filteredAthletes.map((athlete) => (
            <div key={athlete.id} className="relative">
              <Card className="hover:shadow-lg transition-shadow h-full group border-gray-100 flex flex-col justify-between overflow-hidden">
                <CardContent className="p-6 flex flex-col h-full">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-lg text-gray-900">{athlete.name}</div>
                      <div className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-md font-bold tracking-wide uppercase">
                        {athlete.sport}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-6">
                      {athlete.bio || "No bio available"}
                    </p>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-4 bg-gray-50 p-4 rounded-xl">
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Current Price</div>
                        <div className="font-mono text-2xl font-bold text-gray-900">
                          ₹{parseFloat(athlete.currentPrice || '0').toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Link href={`/market/${athlete.id}`} className={buttonVariants({ className: "flex-1", variant: "default" })}>Trade Token</Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white border border-dashed rounded-lg">
              No athletes found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
