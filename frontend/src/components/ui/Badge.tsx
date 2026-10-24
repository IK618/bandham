import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "brand" | "gold" | "success" | "neutral" | "warning";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const variantStyles = {
    brand: "bg-rose-50 text-brand-700 border border-rose-200",
    gold: "bg-gold-50 text-gold-800 border border-gold-300 font-semibold",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    neutral: "bg-gray-100 text-gray-700 border border-gray-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
  };

  return (
    <span className={clsx("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
