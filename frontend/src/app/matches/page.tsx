"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { ProfileCard as ProfileCardType } from "@/types";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api";

export default function MatchesPage() {
  const [matches, setMatches] = useState<ProfileCardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await apiClient<ProfileCardType[]>("/matches/daily?limit=24");
        setMatches(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-900 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
            <span>Refreshed Every 24 Hours</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
            Today&apos;s Recommended Matches
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Algorithmically scored against your partner preference vector
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Calculating compatibility and loading matches…" />
      ) : matches.length === 0 ? (
        <EmptyState
          title="No Daily Matches Found"
          description="Please ensure your partner preferences are configured to generate recommendations."
          actionText="Edit Partner Preferences"
          actionHref="/settings"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {matches.map((cand) => (
            <ProfileCard key={cand.id} profile={cand} />
          ))}
        </div>
      )}
    </div>
  );
}
