"use client";

import { useEffect, useState } from "react";
import { ShortlistItem } from "@/types";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api";

export default function ShortlistPage() {
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShortlist = async () => {
    setLoading(true);
    try {
      const data = await apiClient<ShortlistItem[]>("/shortlists");
      setItems(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlist();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
          My Saved Shortlist
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Profiles you have saved privately for detailed review with your family
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading saved candidates…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Your Shortlist is Empty"
          description="Click the star icon on any profile card while exploring to bookmark them here."
          actionText="Explore Profiles"
          actionHref="/search"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it) => (
            it.shortlisted_profile ? (
              <ProfileCard
                key={it.id}
                profile={it.shortlisted_profile}
                onShortlistToggled={fetchShortlist}
              />
            ) : null
          ))}
        </div>
      )}
    </div>
  );
}
