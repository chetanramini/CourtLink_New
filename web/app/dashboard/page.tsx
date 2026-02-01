"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [sports, setSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSports() {
      try {
        const res = await fetch("http://localhost:8080/ListSports");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSports(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="text-white font-sans pb-20">
      <div className="max-w-7xl mx-auto px-8">

        {/* Header Section */}
        <div className="py-8">
          <h2 className="text-4xl font-bold uppercase tracking-wide">
            CHOMP INTO COURT RESERVATIONS
          </h2>
          <div className="w-full md:w-[75%] h-2 bg-[#FA4616] mt-2 rounded-full"></div>
        </div>

        {/* Hero Section (Matches Reference Image 2) */}
        <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl mb-12 bg-black/20 group">
          {/* Using a placeholder image that looks like sports/gators */}
          <img
            src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop"
            alt="Florida Gators Sports"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col items-center justify-end pb-12">
            <h3 className="text-2xl md:text-3xl font-bold tracking-wide mb-6 text-center px-4">
              SECURE YOUR SPOT | PLAY HARD | CHOMP GATOR STYLE 🐊
            </h3>
            <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
              <span className="font-semibold text-sm">Welcome back, User!</span>
            </div>
          </div>
        </div>

        {/* Sports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map((sport) => (
            <Card
              key={sport}
              className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-none h-48 flex flex-col items-center justify-center group bg-white text-gray-800 rounded-xl"
              onClick={() => router.push(`/dashboard/courts?sport=${sport}`)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#005B8D]/10 transition-colors">
                  <Trophy className="h-8 w-8 text-[#005B8D]" />
                </div>
                <h2 className="text-xl font-bold text-center tracking-wide">{sport}</h2>
              </CardContent>
            </Card>
          ))}

          {sports.length === 0 && (
            <div className="col-span-full text-center py-20 text-white/80 text-xl font-medium">
              No sports found. Check backend connection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
