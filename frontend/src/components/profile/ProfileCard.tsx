"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Star, MapPin, Briefcase, GraduationCap, ShieldCheck, Lock } from "lucide-react";
import { ProfileCard as ProfileCardType } from "@/types";
import { CompatibilityBadge } from "./CompatibilityBadge";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { apiClient } from "@/lib/api";

interface ProfileCardProps {
  profile: ProfileCardType;
  onInterestSent?: () => void;
  onShortlistToggled?: () => void;
}

export function ProfileCard({ profile, onInterestSent, onShortlistToggled }: ProfileCardProps) {
  const [interestSending, setInterestSending] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  const handleSendInterest = async () => {
    setInterestSending(true);
    try {
      await apiClient("/interests", {
        method: "POST",
        body: JSON.stringify({ recipient_id: profile.user_id }),
      });
      setInterestSent(true);
      if (onInterestSent) onInterestSent();
    } catch (err: any) {
      alert(err.message || "Failed to send interest.");
    } finally {
      setInterestSending(false);
    }
  };

  const handleToggleShortlist = async () => {
    try {
      if (!shortlisted) {
        await apiClient("/shortlists", {
          method: "POST",
          body: JSON.stringify({ shortlisted_user_id: profile.user_id }),
        });
        setShortlisted(true);
      } else {
        await apiClient(`/shortlists/${profile.user_id}`, { method: "DELETE" });
        setShortlisted(false);
      }
      if (onShortlistToggled) onShortlistToggled();
    } catch (err: any) {
      alert(err.message || "Shortlist action failed.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
      {/* Photo Header & Privacy Shield */}
      <div className="relative h-64 bg-gradient-to-tr from-rose-100 via-rose-50 to-amber-50 flex items-center justify-center overflow-hidden">
        {/* Placeholder Portrait Silhouette / Watermarked Display */}
        <div className={`w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-b from-brand-200 to-rose-300 flex items-center justify-center text-brand-800 font-serif text-3xl font-bold select-none ${profile.is_photo_blurred ? "blur-md" : ""}`}>
          {(profile.first_name?.[0] || "") + (profile.last_initial?.[0] || profile.last_name?.[0] || "")}
        </div>

        {/* Dynamic Watermark Stamp Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-25deg] opacity-15 text-gray-800 font-mono text-sm tracking-widest font-black uppercase">
          Bandham Protected • {profile.profile_id_display}
        </div>

        {/* Compatibility Badge Positioned Top Right */}
        {profile.compatibility_score && (
          <div className="absolute top-3 right-3 z-10">
            <CompatibilityBadge score={profile.compatibility_score} />
          </div>
        )}

        {/* Profile ID Pill Bottom Left */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-mono font-medium">
            {profile.profile_id_display}
          </span>
        </div>

        {/* Shortlist Star Button Top Left */}
        <button
          onClick={handleToggleShortlist}
          className={`absolute top-3 left-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all ${shortlisted ? "bg-amber-500 text-white" : "bg-white/80 text-gray-600 hover:text-amber-500"}`}
          title={shortlisted ? "Remove from Shortlist" : "Add to Shortlist"}
        >
          <Star className={`w-4 h-4 ${shortlisted ? "fill-white" : ""}`} />
        </button>
      </div>

      {/* Profile Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-gray-900 font-serif">
              {profile.first_name} {profile.last_initial || profile.last_name || ""}
            </h3>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </span>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            {profile.age} Yrs, {Math.floor(profile.height_cm / 30.48)}&apos;{Math.round((profile.height_cm % 30.48) / 2.54)}&quot; • {profile.religion}, {profile.community}
          </p>

          <div className="space-y-1.5 text-xs text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{profile.occupation} ({profile.annual_income_bracket})</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{profile.highest_education}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{profile.residence_city}, {profile.residence_state}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 italic border-l-2 border-rose-200 pl-2.5 mb-4">
            &ldquo;{profile.bio_narrative}&rdquo;
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
          <Link href={`/profile/${profile.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View Profile
            </Button>
          </Link>
          <Button
            variant={interestSent ? "secondary" : "primary"}
            size="sm"
            className="flex-1"
            onClick={handleSendInterest}
            isLoading={interestSending}
            disabled={interestSent}
          >
            {interestSent ? "Interest Sent ✓" : "Send Interest"}
          </Button>
        </div>
      </div>
    </div>
  );
}
