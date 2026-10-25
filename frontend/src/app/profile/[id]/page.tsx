"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Heart,
  ShieldCheck,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  LogIn,
  Lock,
  Clock,
  Copy,
  Check,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { ProfileDetail, ContactStatusResponse } from "@/types";
import { CompatibilityBadge } from "@/components/profile/CompatibilityBadge";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiClient } from "@/lib/api";

export default function ProfileDetailPage() {
  const params = useParams();
  const profileId = (params?.id as string) || "";

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [contactStatus, setContactStatus] = useState<ContactStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  // Action states
  const [sendingRequest, setSendingRequest] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [respondingConsent, setRespondingConsent] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch profile and contact consent status
  useEffect(() => {
    if (!profileId) return;

    async function loadData() {
      try {
        const data = await apiClient<ProfileDetail>(`/profiles/${profileId}`);
        setProfile(data);

        // Fetch mutual consent & contact reveal status
        if (data.user_id) {
          setStatusLoading(true);
          try {
            const status = await apiClient<ContactStatusResponse>(`/contacts/${data.user_id}/status`);
            setContactStatus(status);
          } catch (err) {
            console.warn("Could not retrieve contact status (guest or unauthenticated):", err);
          } finally {
            setStatusLoading(false);
          }
        }
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (msg.includes("Authentication required") || msg.includes("401") || msg.includes("valid session")) {
          setAuthRequired(true);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profileId]);

  // Refresh contact status helper
  const refreshStatus = async (targetUserId: string) => {
    try {
      const status = await apiClient<ContactStatusResponse>(`/contacts/${targetUserId}/status`);
      setContactStatus(status);
    } catch (err) {
      console.error("Failed to refresh contact status:", err);
    }
  };

  // 1. Send connection / contact sharing request
  const handleRequestContactOrInterest = async () => {
    if (!profile) return;
    setSendingRequest(true);
    setBannerNotice(null);
    try {
      await apiClient(`/contacts/${profile.user_id}/request`, { method: "POST" });
      setBannerNotice({
        type: "success",
        text: `Connection & contact sharing request sent to ${profile.first_name}! You will be able to unlock verified details once they accept.`,
      });
      await refreshStatus(profile.user_id);
    } catch (err: any) {
      setBannerNotice({
        type: "error",
        text: err.message || "Failed to send connection request.",
      });
    } finally {
      setSendingRequest(false);
    }
  };

  // 2. Accept incoming connection request from candidate
  const handleAcceptCandidate = async () => {
    if (!profile || !contactStatus?.interest_id) return;
    setRespondingConsent(true);
    setBannerNotice(null);
    try {
      await apiClient(`/interests/${contactStatus.interest_id}/accept`, { method: "PATCH" });
      setBannerNotice({
        type: "success",
        text: `Connection accepted! Mutual consent is established. You can now chat and unlock verified contact details.`,
      });
      await refreshStatus(profile.user_id);
    } catch (err: any) {
      setBannerNotice({
        type: "error",
        text: err.message || "Failed to accept connection.",
      });
    } finally {
      setRespondingConsent(false);
    }
  };

  // 3. Decline incoming connection request
  const handleDeclineCandidate = async () => {
    if (!profile || !contactStatus?.interest_id) return;
    setRespondingConsent(true);
    setBannerNotice(null);
    try {
      await apiClient(`/interests/${contactStatus.interest_id}/decline`, { method: "PATCH" });
      setBannerNotice({
        type: "success",
        text: `Connection request declined.`,
      });
      await refreshStatus(profile.user_id);
    } catch (err: any) {
      setBannerNotice({
        type: "error",
        text: err.message || "Failed to decline connection.",
      });
    } finally {
      setRespondingConsent(false);
    }
  };

  // 4. Reveal contact details using 1 credit (Mutual Consent Required)
  const handleRevealContact = async () => {
    if (!profile) return;
    setRevealing(true);
    setBannerNotice(null);
    try {
      const res = await apiClient<any>(`/contacts/${profile.user_id}/reveal`, { method: "POST" });
      setContactStatus((prev) =>
        prev
          ? {
              ...prev,
              is_revealed: true,
              phone_number: res.phone_number,
              email: res.email,
              contact_credits_remaining: res.contact_credits_remaining,
            }
          : null
      );
      setBannerNotice({
        type: "success",
        text: "Verified phone number and email unlocked under mutual consent!",
      });
    } catch (err: any) {
      setBannerNotice({
        type: "error",
        text: err.message || "Could not reveal contact details. Check consent status and remaining credits.",
      });
    } finally {
      setRevealing(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  if (loading) return <LoadingSpinner text="Retrieving candidate portfolio…" />;

  if (authRequired) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-100 shadow-xl text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-brand-600 flex items-center justify-center mx-auto">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-royal text-gray-900">Sign In to View Portfolio</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Full matrimonial profiles, verification badges, and mutual-consent contact sharing are exclusively visible to authenticated members.
        </p>
        <Link href="/login" className="block">
          <Button variant="primary" size="lg" className="w-full">
            Sign In with Demo Account
          </Button>
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-4">
        <h2 className="text-xl font-bold font-serif text-gray-900">Profile Not Found</h2>
        <p className="text-sm text-gray-500">This profile may have been deactivated or removed.</p>
        <Link href="/search">
          <Button variant="primary">Return to Search</Button>
        </Link>
      </div>
    );
  }

  const initialFirst = profile.first_name?.[0] || "";
  const initialLast = profile.last_name?.[0] || profile.last_initial?.[0] || "";
  const initials = `${initialFirst}${initialLast}`.toUpperCase();
  const displayName = profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.last_initial
    ? `${profile.first_name} ${profile.last_initial}`
    : profile.first_name;

  const maritalDisplay = profile.marital_status ? profile.marital_status.replace(/_/g, " ") : "Not Specified";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link href="/search" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Search Results
      </Link>

      {/* Banner Feedback Notice */}
      {bannerNotice && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed border ${
            bannerNotice.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
          role="status"
          aria-live="polite"
        >
          {bannerNotice.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 font-medium">{bannerNotice.text}</span>
          <button
            onClick={() => setBannerNotice(null)}
            className="text-gray-400 hover:text-gray-700 font-bold ml-2 text-sm leading-none"
            aria-label="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Portrait Folio & Mutual Consent Direct Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
            {/* Watermarked Portrait */}
            <div className="relative w-48 h-48 rounded-full border-4 border-rose-100 shadow-lg bg-gradient-to-tr from-brand-100 to-rose-200 flex items-center justify-center text-brand-900 font-serif text-5xl font-bold mb-4 overflow-hidden">
              <span>{initials || "B"}</span>
              {/* Dynamic Watermark Stamp */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-30deg] opacity-20 text-gray-900 font-mono text-xs font-black uppercase">
                Bandham Verified • {profile.profile_id_display}
              </div>
            </div>

            <h1 className="text-2xl font-bold font-serif text-gray-900">
              {displayName}
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{profile.profile_id_display}</p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                profile.gender === "FEMALE"
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : profile.gender === "MALE"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-purple-100 text-purple-800 border border-purple-200"
              }`}>
                {profile.gender === "FEMALE" ? "Female (Bride)" : profile.gender === "MALE" ? "Male (Groom)" : profile.gender}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ID Verified Member
              </span>
              <Badge variant="brand">{profile.created_by || "Self"} Managed</Badge>
            </div>

            {profile.compatibility_score && (
              <div className="mt-4">
                <CompatibilityBadge score={profile.compatibility_score} />
              </div>
            )}

            {/* Mutual Consent & Contact Sharing Action Center */}
            <div className="w-full space-y-3 pt-6 border-t border-gray-100 mt-6">
              {/* 1. If Contact is Already Revealed (Cache / Permanent Unlock) */}
              {contactStatus?.is_revealed && contactStatus.phone_number ? (
                <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-left space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Verified Contact (Consent Granted)
                    </p>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Unlocked ✓
                    </span>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-emerald-200/60">
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-100 text-xs">
                      <div className="flex items-center gap-2 text-gray-800 font-mono font-semibold">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {contactStatus.phone_number}
                      </div>
                      <button
                        onClick={() => copyToClipboard(contactStatus.phone_number!, "phone")}
                        className="text-[11px] text-gray-500 hover:text-emerald-700 flex items-center gap-1 font-medium transition"
                        title="Copy Phone Number"
                      >
                        {copiedField === "phone" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedField === "phone" ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-100 text-xs">
                      <div className="flex items-center gap-2 text-gray-700 font-mono truncate max-w-[200px]">
                        <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{contactStatus.email}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(contactStatus.email!, "email")}
                        className="text-[11px] text-gray-500 hover:text-emerald-700 flex items-center gap-1 font-medium transition shrink-0 ml-2"
                        title="Copy Email Address"
                      >
                        {copiedField === "email" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedField === "email" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <Link href="/chat" className="block pt-1">
                    <Button variant="primary" size="sm" className="w-full">
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Start Direct Chat
                    </Button>
                  </Link>
                </div>
              ) : /* 2. If Mutual Consent is Established (ACCEPTED) but Contact Not Yet Unlocked */
              contactStatus?.consent_status === "ACCEPTED" ? (
                <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Mutual Consent Confirmed ✓
                    </span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Accepted
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">
                    Both parties have mutually agreed to connect! You can now spend 1 contact credit to unlock verified phone and email details.
                  </p>
                  <Button
                    variant="gold"
                    size="md"
                    className="w-full font-bold shadow-sm"
                    onClick={handleRevealContact}
                    isLoading={revealing}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Unlock Verified Contact (1 Credit)
                  </Button>
                  <p className="text-[10px] text-center text-gray-500 font-mono">
                    {contactStatus.contact_credits_remaining} contact credits currently available
                  </p>
                </div>
              ) : /* 3. If Outgoing Request Sent & Pending Candidate Acceptance */
              contactStatus?.consent_status === "PENDING" && contactStatus.direction === "SENT" ? (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-left space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Contact Sharing Pending
                    </span>
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Awaiting Response
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-snug">
                    Your connection &amp; contact sharing request was sent to {profile.first_name}. To protect member privacy, contact details can only be unlocked once {profile.first_name} accepts your request in their Inbox.
                  </p>
                  <div className="text-[11px] font-medium text-amber-800 bg-amber-100/70 p-2 rounded-xl text-center">
                    ⏳ Waiting for candidate acceptance
                  </div>
                </div>
              ) : /* 4. If Candidate Sent Request to Current User (Incoming Consent Invitation) */
              contactStatus?.consent_status === "PENDING" && contactStatus.direction === "RECEIVED" ? (
                <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-2xl text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-blue-600" />
                      Connection Request Received!
                    </span>
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Action Needed
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-900 leading-snug">
                    {profile.first_name} sent you an Express Interest. Accept to establish mutual consent, unlock private messaging, and permit contact sharing.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={handleAcceptCandidate}
                      isLoading={respondingConsent}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept &amp; Grant Consent
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDeclineCandidate}
                      disabled={respondingConsent}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ) : /* 5. If Connection was Declined */
              contactStatus?.consent_status === "DECLINED" ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-left space-y-1">
                  <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-gray-400" />
                    Connection Declined
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Contact details cannot be shared because this connection proposal was declined.
                  </p>
                </div>
              ) : (
                /* 6. Default: Not Requested Yet (Prompt 2-Way Consent) */
                <div className="p-4 bg-gradient-to-b from-gray-50 to-rose-50/30 border border-rose-100 rounded-2xl text-left space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <Lock className="w-3.5 h-3.5 text-brand-600" />
                    Protected by 2-Way Mutual Consent
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Under Bandham&apos;s privacy protocol, verified contact numbers and emails are never shared unilaterally. Both members must accept the connection before phone numbers can be unlocked.
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full shadow-sm"
                    onClick={handleRequestContactOrInterest}
                    isLoading={sendingRequest}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Send Interest &amp; Request Contact
                  </Button>
                  <p className="text-[10px] text-center text-gray-400">
                    Once {profile.first_name} accepts, contact details unlock using 1 subscription credit.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Dimensional Dossier */}
        <div className="lg:col-span-7 space-y-6">
          {/* About Me Narrative */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-lg font-bold font-serif text-gray-900">About {profile.first_name}</h2>
            <p className="text-sm text-gray-700 leading-relaxed italic border-l-4 border-brand-500 pl-4 py-1">
              &ldquo;{profile.bio_narrative || "No bio narrative provided."}&rdquo;
            </p>
          </div>

          {/* Core Personal & Religious Background */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold font-serif text-gray-900">Personal &amp; Cultural Heritage</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block">Gender</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {profile.gender === "FEMALE" ? "Female (Bride)" : profile.gender === "MALE" ? "Male (Groom)" : profile.gender || "Not Specified"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Age &amp; Height</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.age || "--"} Yrs, {profile.height_cm || "--"} cm</span>
              </div>
              <div>
                <span className="text-gray-400 block">Marital Status</span>
                <span className="font-semibold text-gray-800 text-sm">{maritalDisplay}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Religion</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.religion || "Not Specified"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Mother Tongue</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.mother_tongue || "Not Specified"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Community / Gotra</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.community || "General"} {profile.gotra ? `(${profile.gotra})` : ""}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Manglik Status</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.manglik || "Don't Know"}</span>
              </div>
            </div>
          </div>

          {/* Education & Career */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold font-serif text-gray-900">Career &amp; Educational Pedigree</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block">Highest Degree</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.highest_education || "Graduate"}</span>
                {profile.college_name && <span className="text-[11px] text-gray-500 block">{profile.college_name}</span>}
              </div>
              <div>
                <span className="text-gray-400 block">Occupation &amp; Sector</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.occupation || "Professional"} ({profile.employment_sector || "Private"})</span>
              </div>
              <div>
                <span className="text-gray-400 block">Annual Income Bracket</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.annual_income_bracket || "Confidential"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Current Location</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.residence_city || ""}{profile.residence_state ? `, ${profile.residence_state}` : ""}</span>
              </div>
            </div>
          </div>

          {/* Family & Lifestyle */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold font-serif text-gray-900">Family &amp; Daily Lifestyle</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block">Family Type</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.family_type || "Nuclear"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Family Values</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.family_values || "Moderate"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Dietary Habit</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.diet || "Vegetarian"}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Smoking / Drinking</span>
                <span className="font-semibold text-gray-800 text-sm">{profile.smoking || "No"} / {profile.drinking || "No"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
