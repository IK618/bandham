"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Check, X, ArrowUpRight } from "lucide-react";
import { InterestItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api";

export default function InboxPage() {
  const [tab, setTab] = useState<"RECEIVED" | "SENT">("RECEIVED");
  const [received, setReceived] = useState<InterestItem[]>([]);
  const [sent, setSent] = useState<InterestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const rec = await apiClient<InterestItem[]>("/interests/inbox");
      const s = await apiClient<InterestItem[]>("/interests/sent");
      setReceived(rec);
      setSent(s);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await apiClient(`/interests/${id}/accept`, { method: "PATCH" });
      fetchInterests();
    } catch (err: any) {
      alert(err.message || "Accept action failed.");
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await apiClient(`/interests/${id}/decline`, { method: "PATCH" });
      fetchInterests();
    } catch (err: any) {
      alert(err.message || "Decline action failed.");
    }
  };

  const activeList = tab === "RECEIVED" ? received : sent;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
          Inbox &amp; Connections
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage incoming expressions of interest and monitor outgoing connection requests
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab("RECEIVED")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            tab === "RECEIVED"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Received Interests ({received.length})
        </button>
        <button
          onClick={() => setTab("SENT")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            tab === "SENT"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Sent Requests ({sent.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading invitations…" />
      ) : activeList.length === 0 ? (
        <EmptyState
          title={tab === "RECEIVED" ? "No Received Interests Yet" : "No Sent Requests"}
          description={
            tab === "RECEIVED"
              ? "Profiles you match with will appear here once they express interest."
              : "Explore matches and send an Express Interest to begin a conversation."
          }
          actionText="Find Matches"
          actionHref="/matches"
        />
      ) : (
        <div className="space-y-4">
          {activeList.map((item) => {
            const card = tab === "RECEIVED" ? item.sender_profile : item.recipient_profile;
            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center font-serif font-bold text-brand-800 text-lg shrink-0">
                    {card ? card.first_name[0] : "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 font-serif">
                        {card ? `${card.first_name} ${card.last_initial}` : "Member Profile"}
                      </h3>
                      <Badge variant={item.status === "ACCEPTED" ? "success" : item.status === "PENDING" ? "brand" : "neutral"}>
                        {item.status}
                      </Badge>
                    </div>
                    {card && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {card.age} Yrs • {card.occupation} in {card.residence_city} • {card.religion}
                      </p>
                    )}
                    {item.greeting_message && (
                      <p className="text-xs text-gray-600 italic mt-1 bg-rose-50/50 p-2 rounded-md">
                        &ldquo;{item.greeting_message}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {card && (
                    <Link href={`/profile/${card.id}`}>
                      <Button variant="outline" size="sm">
                        View Profile <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  )}
                  {tab === "RECEIVED" && item.status === "PENDING" && (
                    <>
                      <Button variant="primary" size="sm" onClick={() => handleAccept(item.id)}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Accept
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleDecline(item.id)}>
                        <X className="w-3.5 h-3.5 mr-1" /> Decline
                      </Button>
                    </>
                  )}
                  {item.status === "ACCEPTED" && (
                    <Link href="/chat">
                      <Button variant="primary" size="sm">
                        Open Chat
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
