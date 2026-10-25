import React from "react";
import { FolderHeart } from "lucide-react";
import Link from "next/link";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionText, actionHref }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-auto my-8">
      <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-brand-600 mb-4">
        <FolderHeart className="w-8 h-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 font-serif mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">{description}</p>
      {actionText && actionHref && (
        <Link href={actionHref}>
          <Button variant="primary" size="md">
            {actionText}
          </Button>
        </Link>
      )}
    </div>
  );
}
