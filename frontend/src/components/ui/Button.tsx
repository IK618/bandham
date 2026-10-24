import React from "react";
import clsx from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "gold" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  // Base styles adhering to Vercel interaction guidelines:
  // - touch-action: manipulation prevents double-tap zoom
  // - active:scale-[0.98] compositor-friendly tactile feedback
  // - visible, accessible focus ring (:focus-visible)
  // - min-h-[44px] on mobile to satisfy >=44px hit-target requirements
  const baseStyles = clsx(
    "relative inline-flex items-center justify-center font-medium select-none",
    "rounded-full transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "active:scale-[0.98] [touch-action:manipulation] tracking-[0.015em]"
  );

  const variantStyles = {
    // 1. Royal Crimson (Primary Sacred Matrimony)
    primary: clsx(
      "bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 text-white font-semibold",
      "border border-rose-500/40 shadow-[0_4px_14px_rgba(225,29,72,0.28)]",
      "hover:from-rose-800 hover:via-rose-700 hover:to-red-700",
      "hover:shadow-[0_6px_20px_rgba(225,29,72,0.38)] hover:-translate-y-0.5",
      "focus-visible:ring-rose-500 ring-offset-white"
    ),

    // 2. Imperial Wedding Gold (VIP / Connect / Credit Unlocks)
    gold: clsx(
      "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 font-bold",
      "border border-amber-300/60 shadow-[0_4px_14px_rgba(217,158,63,0.30)]",
      "hover:from-amber-700 hover:via-amber-600 hover:to-yellow-600",
      "hover:shadow-[0_6px_22px_rgba(217,158,63,0.42)] hover:-translate-y-0.5",
      "focus-visible:ring-amber-500 ring-offset-white"
    ),

    // 3. Double-Bezel Ivory Pearl (Secondary)
    secondary: clsx(
      "bg-white/95 backdrop-blur-md text-stone-800 font-semibold",
      "border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
      "hover:bg-rose-50/70 hover:border-rose-300/80 hover:text-rose-950",
      "hover:shadow-[0_4px_12px_rgba(190,18,60,0.08)] hover:-translate-y-0.5",
      "focus-visible:ring-stone-400 ring-offset-white"
    ),

    // 4. Sacred Rose Gold Hairline (Outline)
    outline: clsx(
      "bg-transparent text-rose-900 font-semibold",
      "border border-rose-300/80 hover:border-rose-500",
      "hover:bg-rose-50/80 hover:text-rose-950 shadow-sm",
      "focus-visible:ring-rose-500 ring-offset-white"
    ),

    // 5. Glass Ghost (Subtle Icon/Text Actions)
    ghost: clsx(
      "bg-transparent text-stone-700 font-medium",
      "hover:bg-rose-50/60 hover:text-rose-900",
      "focus-visible:ring-stone-400 ring-offset-white"
    ),

    // 6. Ruby Red (Decline / Block)
    danger: clsx(
      "bg-stone-50 text-stone-700 font-semibold",
      "border border-stone-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 shadow-sm",
      "focus-visible:ring-red-500 ring-offset-white"
    ),
  };

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs min-h-[34px] sm:min-h-[36px]",
    md: "px-5 py-2.5 text-sm min-h-[44px]", // Vercel standard: >=44px mobile touch target
    lg: "px-7 py-3.5 text-base min-h-[50px] font-semibold",
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {/* Rule: Keep original label with spinner alongside */}
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
