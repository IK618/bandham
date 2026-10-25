import React from "react";

export function LoadingSpinner({ text = "Loading profiles…" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4" role="status" aria-live="polite">
      <div className="w-12 h-12 border-4 border-rose-200 border-t-brand-600 rounded-full animate-spin" aria-hidden="true" />
      <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">{text}</p>
    </div>
  );
}
