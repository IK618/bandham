import React from "react";
import { Sparkles } from "lucide-react";

interface CompatibilityBadgeProps {
  score?: number;
}

export function CompatibilityBadge({ score }: CompatibilityBadgeProps) {
  if (score === undefined || score === null) return null;

  const getStyle = (s: number) => {
    if (s >= 85) return "bg-emerald-50 text-emerald-800 border-emerald-300";
    if (s >= 70) return "bg-gold-50 text-gold-900 border-gold-300";
    return "bg-rose-50 text-rose-800 border-rose-200";
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getStyle(score)}`}>
      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" aria-hidden="true" />
      <span className="tabular-nums">{score}% Compatibility Match</span>
    </div>
  );
}
