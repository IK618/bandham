"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Heart,
  ShieldCheck,
  Phone,
  ArrowLeft,
  CheckCircle,
  LogIn,
} from "lucide-react";
import { ProfileDetail } from "@/types";
import { CompatibilityBadge } from "@/components/profile/CompatibilityBadge";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiClient } from "@/lib/api";

export default function ProfileDetailPage() {
  const params = useParams();
  const profileId = (params?.id as string) || "";

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [contactData, setContactData] = useState<{ phone: string; email: string } | null>(null);

  useEffect(() => {
    if (!profileId) return;

    async function loadProfile() {
      try {
        const data = await apiClient<ProfileDetail>(`/profiles/${profileId}`);
        setProfile(data);
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (msg.includes("Authentication required") || msg.includes("401") || msg.includes("valid session")) {
          setAuthRequired(true);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [profileId]);

  const handleSendInterest = async () => {
    if (!profile) return;
    try {
      await apiClient("/interests", {
        method: "POST",
        body: JSON.stringify({ recipient_id: profile.user_id }),
      });
      setInterestSent(true);
      alert("Interest sent successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to send interest.");
    }
  };

  const handleRevealContact = async () => {
    if (!profile) return;
    setRevealing(true);
    try {
      const res = await apiClient<any>(`/contacts/${profile.user_id}/reveal`, { method: "POST" });
      setContactData({ phone: res.phone_number, email: res.email });
      alert("Verified contact details unlocked!");
    } catch (err: any) {
      alert(err.message || "Could not reveal contact details. Please upgrade your plan.");
    } finally {
      setRevealing(false);
    }
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
          Full matrimonial profiles and verification badges are exclusively visible to authenticated members.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Portrait Folio & Direct Actions */}
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

            <div className="flex items-center gap-2 mt-3">
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

            {/* Action Buttons Panel */}
            <div className="w-full space-y-3 pt-6 border-t border-gray-100 mt-6">
              <Button
                variant={interestSent ? "secondary" : "primary"}
                size="lg"
                className="w-full"
                onClick={handleSendInterest}
                disabled={interestSent}
              >
                <Heart className="w-4 h-4 mr-2" />
                {interestSent ? "Interest Sent ✓" : "Send Express Interest"}
              </Button>

              {contactData ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-1">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Verified Contact Details Unlocked:
                  </p>
                  <p className="text-sm font-mono text-gray-800 font-semibold">{contactData.phone}</p>
                  <p className="text-xs font-mono text-gray-600">{contactData.email}</p>
                </div>
              ) : (
                <Button
                  variant="gold"
                  size="md"
                  className="w-full"
                  onClick={handleRevealContact}
                  isLoading={revealing}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Unlock Contact Number (1 Credit)
                </Button>
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
