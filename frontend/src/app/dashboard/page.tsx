"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Heart, Search, MessageSquare, ShieldCheck, ArrowRight, Star } from "lucide-react";
import { ProfileDetail, ProfileCard as ProfileCardType } from "@/types";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiClient } from "@/lib/api";

export default function DashboardPage() {
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [recommendations, setRecommendations] = useState<ProfileCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // 1. Verify user role first
        try {
          const authUser = await apiClient<any>("/auth/me");
          if (authUser?.role === "ADMIN" || authUser?.role === "MODERATOR") {
            window.location.href = "/admin";
            return;
          }
        } catch {
          // If unauthenticated, continue to let /profiles/me or error boundary handle it
        }

        const myProf = await apiClient<ProfileDetail>("/profiles/me");
        if (myProf?.profile_id_display?.includes("ADMIN") || myProf?.profile_id_display?.includes("MOD")) {
          window.location.href = "/admin";
          return;
        }
        setProfile(myProf);

        const recs = await apiClient<ProfileCardType[]>("/matches/daily?limit=4");
        setRecommendations(recs);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data. Please log in.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <LoadingSpinner text="Loading your matrimonial dashboard…" />;

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-rose-100 rounded-3xl text-center shadow-sm space-y-4">
        <h2 className="text-xl font-bold font-serif text-gray-900">Session Required</h2>
        <p className="text-sm text-gray-600">{error}</p>
        <Link href="/login">
          <Button variant="primary">Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-rose-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Profile ID: {profile?.profile_id_display}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif">
            Namaste, {profile?.first_name}!
          </h1>
          <p className="text-xs sm:text-sm text-rose-100 max-w-xl">
            Here are your highest-compatibility recommendations refreshed for today.
          </p>
        </div>

        {/* Profile Completeness Pill */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shrink-0 w-full md:w-auto">
          <div className="flex justify-between text-xs font-medium mb-1">
            <span>Profile Completeness</span>
            <span className="tabular-nums font-mono">{profile?.profile_completeness_pct}%</span>
          </div>
          <div className="w-full md:w-48 bg-white/30 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-[width] duration-300"
              style={{ width: `${profile?.profile_completeness_pct || 75}%` }}
            />
          </div>
          <Link href="/profile/edit" className="block mt-3">
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-white text-brand-900 font-bold hover:bg-rose-50 text-xs shadow-sm border border-white/40"
            >
              Edit / Complete Profile ✏️
            </Button>
          </Link>
          <p className="text-[11px] text-rose-100 mt-2">
            Tip: Complete details &amp; preferences to boost match accuracy.
          </p>
        </div>
      </div>

      {/* Quick Access Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/matches" className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-rose-200 transition-[border-color,box-shadow] flex flex-col items-center text-center group">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-gold-500" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold text-gray-900 font-serif">Today&apos;s Matches</span>
          <span className="text-xs text-gray-500">Curated top 20</span>
        </Link>

        <Link href="/inbox" className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-rose-200 transition-[border-color,box-shadow] flex flex-col items-center text-center group">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Heart className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold text-gray-900 font-serif">Inbox &amp; Interests</span>
          <span className="text-xs text-gray-500">Pending &amp; accepted</span>
        </Link>

        <Link href="/shortlist" className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-rose-200 transition-[border-color,box-shadow] flex flex-col items-center text-center group">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Star className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold text-gray-900 font-serif">My Shortlist</span>
          <span className="text-xs text-gray-500">Saved candidates</span>
        </Link>

        <Link href="/chat" className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-rose-200 transition-[border-color,box-shadow] flex flex-col items-center text-center group">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold text-gray-900 font-serif">Messages</span>
          <span className="text-xs text-gray-500">Live 1-on-1 chat</span>
        </Link>
      </div>

      {/* Featured Recommendations Preview */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold font-serif text-gray-900">Recommended For You</h2>
            <p className="text-xs text-gray-500">Handpicked based on your partner preferences</p>
          </div>
          <Link href="/matches">
            <Button variant="outline" size="sm">
              View All Matches <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((cand) => (
            <ProfileCard key={cand.id} profile={cand} />
          ))}
        </div>
      </div>
    </div>
  );
}
