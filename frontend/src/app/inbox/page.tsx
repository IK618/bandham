"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Heart, Check, X, ArrowUpRight, Users, MessageSquare } from "lucide-react";
import { InterestItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api";

function InboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const initialTab: "CONNECTED" | "RECEIVED" | "SENT" =
    rawTab === "SENT" ? "SENT" : rawTab === "RECEIVED" ? "RECEIVED" : "CONNECTED";

  const [tab, setTab] = useState<"CONNECTED" | "RECEIVED" | "SENT">(initialTab);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState<InterestItem[]>([]);
  const [received, setReceived] = useState<InterestItem[]>([]);
  const [sent, setSent] = useState<InterestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const switchTab = (newTab: "CONNECTED" | "RECEIVED" | "SENT") => {
    setTab(newTab);
    router.replace(`/inbox?tab=${newTab}`);
  };

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const [me, conn, rec, s] = await Promise.all([
        apiClient<any>("/auth/me").catch(() => null),
        apiClient<InterestItem[]>("/interests/connected"),
        apiClient<InterestItem[]>("/interests/inbox"),
        apiClient<InterestItem[]>("/interests/sent"),
      ]);
      if (me?.id) setCurrentUserId(me.id);
      setConnected(conn);
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

  const activeList = tab === "CONNECTED" ? connected : tab === "RECEIVED" ? received : sent;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
          Connections &amp; Inbox
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Review candidates connected to you by mutual consent and manage incoming/outgoing invitations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => switchTab("CONNECTED")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-[color,border-color] flex items-center gap-2 ${
            tab === "CONNECTED"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" aria-hidden="true" />
          <span>Connected Members</span>
          <span className="tabular-nums font-mono text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold">
            {connected.length}
          </span>
        </button>

        <button
          onClick={() => switchTab("RECEIVED")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-[color,border-color] ${
            tab === "RECEIVED"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Received Invitations <span className="tabular-nums font-mono">({received.length})</span>
        </button>

        <button
          onClick={() => switchTab("SENT")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-[color,border-color] ${
            tab === "SENT"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Sent Requests <span className="tabular-nums font-mono">({sent.length})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading your matrimonial connections…" />
      ) : activeList.length === 0 ? (
        <EmptyState
          title={
            tab === "CONNECTED"
              ? "No Connected Members Yet"
              : tab === "RECEIVED"
              ? "No Received Interests Yet"
              : "No Sent Requests"
          }
          description={
            tab === "CONNECTED"
              ? "When you and another member mutually accept an interest, they will appear here with private chat and verified contact details unlocked."
              : tab === "RECEIVED"
              ? "Profiles that express interest in you will appear here."
              : "Explore matches and send an Express Interest to begin a courtship conversation."
          }
          actionText="Find Matches"
          actionHref="/matches"
        />
      ) : (
        <div className="space-y-4">
          {activeList.map((item) => {
            const card =
              tab === "CONNECTED"
                ? (currentUserId && item.sender_id === currentUserId
                    ? item.recipient_profile
                    : item.sender_profile || item.recipient_profile)
                : tab === "RECEIVED"
                ? item.sender_profile
                : item.recipient_profile;
            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center font-serif font-bold text-brand-800 text-lg shrink-0">
                    {card ? (card.first_name?.[0] || "?") : "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 font-serif">
                        {card ? `${card.first_name} ${card.last_initial || card.last_name || ""}` : "Member Profile"}
                      </h3>
                      <Badge variant={item.status === "ACCEPTED" ? "success" : item.status === "PENDING" ? "brand" : "neutral"}>
                        {item.status === "ACCEPTED" ? (
                          <span className="inline-flex items-center gap-1">
                            Connected (Mutual Consent <Check className="w-3 h-3 inline-block shrink-0" aria-hidden="true" />)
                          </span>
                        ) : (
                          item.status
                        )}
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
                      <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        Chat Now
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

export default function InboxPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading invitations…" />}>
      <InboxContent />
    </Suspense>
  );
}
