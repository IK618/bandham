"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Edit3
} from "lucide-react";
import { ProfileDetail, ProfileCard as ProfileCardType } from "@/types";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiClient } from "@/lib/api";

export default function DashboardPage() {
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<ProfileCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch current user identity & role
      const user = await apiClient<any>("/auth/me");
      setAuthUser(user);

      if (user?.role === "ADMIN" || user?.role === "MODERATOR") {
        window.location.href = "/admin";
        return;
      }

      // 2. If status is pending manual review or rejected, don't attempt to load daily matches
      if (user?.status === "PENDING_APPROVAL" || user?.status === "PENDING_VERIFICATION") {
        try {
          const myProf = await apiClient<ProfileDetail>("/profiles/me");
          setProfile(myProf);
        } catch {
          // Draft profile may be loading
        }
        setLoading(false);
        return;
      }

      if (user?.status === "REJECTED") {
        setLoading(false);
        return;
      }

      // 3. User is ACTIVE: load profile and daily compatibility recommendations
      const myProf = await apiClient<ProfileDetail>("/profiles/me");
      setProfile(myProf);

      try {
        const recs = await apiClient<ProfileCardType[]>("/matches/daily?limit=4");
        setRecommendations(recs || []);
      } catch (matchErr) {
        console.warn("Could not load recommendations:", matchErr);
        setRecommendations([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data. Please log in.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setStatusNotice(null);
    try {
      const user = await apiClient<any>("/auth/me");
      setAuthUser(user);
      if (user.status === "ACTIVE") {
        setStatusNotice("Your proposal has been approved! Unlocking your dashboard…");
        setTimeout(() => {
          loadDashboard();
        }, 1200);
      } else if (user.status === "REJECTED") {
        setStatusNotice("Your membership application was declined by the governance committee.");
      } else {
        setStatusNotice("Your proposal is still pending manual review by an Administrator or Moderator. Please check back shortly.");
      }
    } catch (err: any) {
      setStatusNotice(err.message || "Failed to refresh status.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to your matrimonial dashboard…" />;

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

  // --- VIEW 1: Pending Proposal Under Review Screen ---
  if (authUser?.status === "PENDING_APPROVAL" || authUser?.status === "PENDING_VERIFICATION") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="bg-white rounded-3xl border border-amber-200 shadow-md p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 animate-pulse" aria-hidden="true" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                  <span>Pending Admin / Moderator Review</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-gray-900 mt-1">
                  Membership Proposal Under Review
                </h1>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Sign Out
            </button>
          </div>

          {/* Description */}
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              Namaste <strong>{profile?.first_name || authUser?.email}</strong>, thank you for choosing Bandham Matrimony.
            </p>
            <p>
              To maintain an authentic, dignified community and eliminate catfish accounts, telemarketing spam, and commercial brokers,
              our platform <strong>Administrators and Moderators manually evaluate and approve each membership application</strong> before granting access to browse profiles or express interest.
            </p>
          </div>

          {/* Application Details Summary */}
          <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200/80 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Submitted Proposal Credentials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Applicant:</span>{" "}
                <strong className="text-gray-900">{profile?.first_name} {profile?.last_name || ""}</strong>
              </div>
              <div>
                <span className="text-gray-500">Registered Email:</span>{" "}
                <strong className="text-gray-900">{authUser?.email}</strong>
              </div>
              <div>
                <span className="text-gray-500">Verified Mobile:</span>{" "}
                <strong className="text-gray-900">{authUser?.phone_number}</strong>
              </div>
              <div>
                <span className="text-gray-500">Temporary ID:</span>{" "}
                <strong className="text-brand-700">{profile?.profile_id_display || "BDN-DRAFT"}</strong>
              </div>
            </div>
          </div>

          {/* Workflow Steps Indicator */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Onboarding Progress
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>1. Phone OTP Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-2 text-amber-900 font-semibold shadow-sm">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>2. Manual Staff Review</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2 text-gray-400">
                <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>3. Matchmaking Active</span>
              </div>
            </div>
          </div>

          {/* Real-time Status Notice */}
          {statusNotice && (
            <div
              role="status"
              className="p-4 rounded-xl text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleCheckStatus}
              isLoading={checkingStatus}
              variant="primary"
              size="md"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" /> Check Approval Status
            </Button>
            <Link href="/profile/edit" className="flex-1">
              <Button variant="outline" size="md" className="w-full">
                <Edit3 className="w-4 h-4 mr-2" aria-hidden="true" /> Update Bio &amp; Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: Proposal Declined Screen ---
  if (authUser?.status === "REJECTED") {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-rose-200 rounded-3xl text-center shadow-lg space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold font-serif text-gray-900">Application Declined</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          We regret to inform you that your membership proposal was not approved by the Trust &amp; Governance committee.
          If you believe this is a clerical error, please contact our support desk.
        </p>
        <button
          onClick={handleSignOut}
          className="mt-4 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // --- VIEW 3: Active Member Full Matchmaking Dashboard ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-rose-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-300" aria-hidden="true" />
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
              className="w-full bg-white text-brand-900 font-bold hover:bg-rose-50 text-xs shadow-sm border border-white/40 inline-flex items-center justify-center gap-1.5"
            >
              <span>Edit / Complete Profile</span>
              <Edit3 className="w-3.5 h-3.5 inline-block shrink-0" aria-hidden="true" />
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
          <span className="text-xs text-gray-500">Curated top recommendations</span>
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
              View All Matches <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
            </Button>
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-8 bg-white border border-gray-100 rounded-3xl text-center shadow-sm space-y-3">
            <Sparkles className="w-8 h-8 text-brand-600 mx-auto" aria-hidden="true" />
            <h3 className="text-base font-bold text-gray-900 font-serif">Exploring New Matches</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Our matching algorithm is computing fresh compatibility scores for your preferences. Explore the search directory to discover verified candidates.
            </p>
            <Link href="/search">
              <Button variant="primary" size="sm">Search Verified Profiles</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((cand) => (
              <ProfileCard key={cand.id} profile={cand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
