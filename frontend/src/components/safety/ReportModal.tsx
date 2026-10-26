"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  onReportSubmitted?: () => void;
}

const REPORT_CATEGORIES = [
  { value: "FAKE_PROFILE", label: "Fake Profile or Impersonation", desc: "Using stolen photos or false identity" },
  { value: "HARASSMENT", label: "Harassment or Abusive Behavior", desc: "Offensive messages, threats, or stalking" },
  { value: "FINANCIAL_SCAM", label: "Financial Solicitation or Scam", desc: "Asking for money, gifts, or investment" },
  { value: "MARRIED_FRAUD", label: "Already Married / Fraudulent Status", desc: "Misrepresenting marital status" },
  { value: "INAPPROPRIATE_MEDIA", label: "Inappropriate Content / Photos", desc: "Obscene photos or contact details in bio" },
];

export function ReportModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  onReportSubmitted,
}: ReportModalProps) {
  const [category, setCategory] = useState("FAKE_PROFILE");
  const [description, setDescription] = useState("");
  const [blockUser, setBlockUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError("Please describe the issue in at least 10 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Submit the incident report
      await apiClient("/safety/report", {
        method: "POST",
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          category,
          description: description.trim(),
        }),
      });

      // 2. If user opted to also block the candidate
      if (blockUser) {
        try {
          await apiClient("/safety/block", {
            method: "POST",
            body: JSON.stringify({ blocked_user_id: reportedUserId }),
          });
        } catch (blockErr) {
          // If already blocked or harmless error, proceed
          console.warn("Block step status:", blockErr);
        }
      }

      setSubmitted(true);
      if (onReportSubmitted) {
        onReportSubmitted();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescription("");
    setError(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 id="report-modal-title" className="text-xl font-bold font-serif text-gray-900">
                Report Submitted to Governance
              </h2>
              <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                Thank you for helping keep Bandham authentic and safe. Our platform <strong>Administrators and Moderators</strong> have been notified along with the complete, unredacted chat audit log (including any deleted messages) for investigation.
              </p>
            </div>
            {blockUser && (
              <p className="text-[11px] text-gray-500 font-medium">
                {reportedUserName} has also been blocked from viewing your profile or messaging you.
              </p>
            )}
            <div className="pt-2">
              <Button variant="primary" size="md" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="report-modal-title" className="text-base sm:text-lg font-bold font-serif text-gray-900">
                    Report Member
                  </h2>
                  <p className="text-xs text-gray-500">
                    Confidential notice sent directly to Trust &amp; Safety Moderators
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close report dialog"
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {error && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="report-category" className="text-xs font-semibold text-gray-800 block">
                  Select Reason for Reporting
                </label>
                <select
                  id="report-category"
                  name="report-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-medium bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {REPORT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500">
                  {REPORT_CATEGORIES.find((c) => c.value === category)?.desc}
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="report-description" className="text-xs font-semibold text-gray-800 block">
                  Detailed Explanation
                </label>
                <textarea
                  id="report-description"
                  name="report-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe what happened in detail (minimum 10 characters)…"
                  className="w-full text-xs text-gray-900 border border-gray-300 rounded-xl p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 leading-relaxed"
                />
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>Admins &amp; Moderators will review this dossier confidentially.</span>
                  <span>{description.length}/1000</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockUser}
                    onChange={(e) => setBlockUser(e.target.checked)}
                    className="rounded text-brand-600 focus-visible:ring-brand-500 w-4 h-4"
                  />
                  <span>Also block {reportedUserName} from contacting me or viewing my profile</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" size="sm" isLoading={loading}>
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  Submit Report to Staff
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
