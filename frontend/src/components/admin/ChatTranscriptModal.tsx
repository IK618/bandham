"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  AlertTriangle, 
  ShieldAlert,
  Clock,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api";

interface ChatTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
  reporterName?: string;
  reportedName?: string;
}

export function ChatTranscriptModal({
  isOpen,
  onClose,
  reportId,
  reporterName = "Reporter",
  reportedName = "Reported Member",
}: ChatTranscriptModalProps) {
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedCount, setDeletedCount] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !reportId) return;

    async function loadTranscript() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient<{
          report_id: string;
          transcript: string;
          has_chat: boolean;
          deleted_messages_count: number;
          filename: string;
        }>(`/admin/reports/${reportId}/transcript-preview`);

        setTranscript(res.transcript || "No transcript available.");
        setDeletedCount(res.deleted_messages_count || 0);
      } catch (err: any) {
        setError(err.message || "Failed to load chat transcript.");
      } finally {
        setLoading(false);
      }
    }

    loadTranscript();
  }, [isOpen, reportId]);

  if (!isOpen || !reportId) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `incident_report_${reportId.slice(0, 8)}_chat_transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transcript-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="transcript-modal-title" className="text-base font-bold tracking-tight">
                Forensic Chat Transcript (.txt)
              </h2>
              <p className="text-xs text-slate-300">
                Incident #{reportId.slice(0, 8)} • {reporterName} vs. {reportedName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close transcript viewer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Audit Callout Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
            <span>
              Unredacted Audit Trail: Retains all messages including{" "}
              <strong className="underline decoration-amber-500">
                {deletedCount} first-person deleted message{deletedCount === 1 ? "" : "s"}
              </strong>.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs h-7 px-2.5 text-gray-700 bg-white"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownloadTxt}
              className="text-xs h-7 px-3 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Download className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              <span>Download .txt</span>
            </Button>
          </div>
        </div>

        {/* Transcript Body Viewer */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed space-y-1 select-text">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              Retrieving cryptographic chat audit trail…
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-300">
              {error}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-slate-300">
              {transcript.split("\n").map((line, idx) => {
                const isHeader = line.startsWith("=") || line.startsWith("BANDHAM");
                const isDeletedMarker = line.includes("*** DELETED");
                const isRecoveredText = line.includes("[RECOVERED ORIGINAL TEXT]");
                const isMeta = line.includes(":") && !line.startsWith("    ");

                return (
                  <div
                    key={idx}
                    className={`${
                      isDeletedMarker
                        ? "text-rose-400 font-bold bg-rose-950/40 px-1 rounded-sm py-0.5 border-l-2 border-rose-500"
                        : isRecoveredText
                        ? "text-amber-300 font-semibold bg-amber-950/30 px-1 rounded-sm"
                        : isHeader
                        ? "text-amber-400 font-bold"
                        : isMeta
                        ? "text-cyan-300"
                        : "text-slate-300"
                    }`}
                  >
                    {line || "\u00A0"}
                  </div>
                );
              })}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>File format: UTF-8 Plaintext (.txt)</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Viewer
          </Button>
        </div>
      </div>
    </div>
  );
}
