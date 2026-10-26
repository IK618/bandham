"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { MessageSquare, Send, CheckCheck, Flag, Trash2, ShieldAlert } from "lucide-react";
import { ConversationItem, ChatMessage } from "@/types";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReportModal } from "@/components/safety/ReportModal";
import { apiClient } from "@/lib/api";

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [reportSubmittedNotice, setReportSubmittedNotice] = useState<string | null>(null);

  const chatStreamRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTo({
        top: chatStreamRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Ensure window starts at the top when entering the chat page
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await apiClient<ConversationItem[]>("/chat/conversations");
        setConversations(data);
        if (data.length > 0) {
          setActiveConv(data[0]);
        }
      } catch (err: any) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  // Poll for incoming messages every 4 seconds while active conversation is selected
  useEffect(() => {
    if (!activeConv) return;

    const fetchMessages = async () => {
      try {
        const msgs = await apiClient<ChatMessage[]>(`/chat/conversations/${activeConv.id}/messages`);
        setMessages((prev) => {
          if (
            msgs.length !== prev.length ||
            (msgs.length > 0 && msgs[msgs.length - 1]?.id !== prev[prev.length - 1]?.id)
          ) {
            return msgs;
          }
          return prev;
        });
      } catch (err: any) {
        // Silent catch for background poll
      }
    };

    fetchMessages();
    const pollTimer = setInterval(fetchMessages, 4000);
    return () => clearInterval(pollTimer);
  }, [activeConv]);

  // Scroll internal stream to bottom whenever messages update (without touching window scroll)
  useEffect(() => {
    scrollToBottom("auto");
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = newText.trim();
    if (!activeConv || !textToSend || sending) return;

    setSending(true);
    try {
      const sentMsg = await apiClient<ChatMessage>(`/chat/conversations/${activeConv.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: textToSend }),
      });
      setMessages((prev) => [...prev, sentMsg]);
      setNewText("");
      setTimeout(() => {
        scrollToBottom("smooth");
        inputRef.current?.focus({ preventScroll: true });
      }, 50);
    } catch (err: any) {
      alert(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteOwnMessage = async (messageId: string) => {
    if (!activeConv) return;
    if (!confirm("Are you sure you want to delete this message?")) return;

    setDeletingMsgId(messageId);
    try {
      await apiClient(`/chat/conversations/${activeConv.id}/messages/${messageId}`, {
        method: "DELETE"
      });
      // Optimistically update message in conversation stream
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_deleted: true, content: "This message was deleted" }
            : m
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to delete message.");
    } finally {
      setDeletingMsgId(null);
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to secure messaging channel…" />;

  if (conversations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <EmptyState
          title="No Active Conversations"
          description="Once you or another member accepts an Express Interest, your private 1-on-1 chat room will appear here."
          actionText="View Received Interests"
          actionHref="/inbox"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[650px]">
        {/* Left Column: Conversation Thread List */}
        <div className="md:col-span-4 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-rose-50/30">
            <h2 className="font-bold text-gray-900 font-serif flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              Connected Chats ({conversations.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
            {conversations.map((c) => {
              const p = c.partner_profile;
              const isActive = activeConv?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConv(c)}
                  className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${
                    isActive ? "bg-rose-50/80 border-l-4 border-brand-600" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center font-serif font-bold text-brand-800 text-base shrink-0">
                    {p ? (p.first_name?.[0] || "?") : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-sm text-gray-900 truncate">
                        {p ? `${p.first_name} ${p.last_initial || p.last_name || ""}` : "Match"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {p?.profile_id_display}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {c.last_message ? c.last_message.content : "Tap to open chat…"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Chat Thread Window */}
        <div className="md:col-span-8 flex flex-col justify-between bg-slate-50/40">
          {activeConv ? (
            <>
              {/* Active Header */}
              <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center font-serif font-bold text-brand-800 text-sm">
                    {activeConv.partner_profile?.first_name?.[0] || "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">
                      {activeConv.partner_profile?.first_name} {activeConv.partner_profile?.last_initial || activeConv.partner_profile?.last_name || ""}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {activeConv.partner_profile?.occupation} in {activeConv.partner_profile?.residence_city}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeConv.partner_profile?.id && (
                    <Link
                      href={`/profile/${activeConv.partner_profile.id}`}
                      className="text-xs font-semibold text-brand-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      View Profile
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                    title="Report Member to Moderators"
                  >
                    <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Report</span>
                  </button>
                </div>
              </div>

              {/* Report Confirmation Banner */}
              {reportSubmittedNotice && (
                <div role="status" aria-live="polite" className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                    <span>{reportSubmittedNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportSubmittedNotice(null)}
                    className="text-amber-800 font-bold ml-2 text-sm hover:text-amber-950"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Chat Messages Stream */}
              <div ref={chatStreamRef} className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[500px] overscroll-contain">
                <div className="text-center my-2">
                  <span className="bg-white border border-gray-200 text-gray-500 text-[11px] px-3 py-1 rounded-full shadow-2xs">
                    Messages are encrypted in transit. You can delete your own messages; reported incident audits retain all history.
                  </span>
                </div>

                {messages.map((m) => {
                  const isOwn = m.sender_id !== activeConv.partner_profile?.user_id;
                  const isDeleted = Boolean(m.is_deleted);

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col group ${isOwn ? "items-end" : "items-start"}`}
                    >
                      <div className="relative flex items-center gap-1.5">
                        {/* First-person delete button: users can delete their own chat messages */}
                        {isOwn && !isDeleted && (
                          <button
                            type="button"
                            onClick={() => handleDeleteOwnMessage(m.id)}
                            disabled={deletingMsgId === m.id}
                            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-opacity cursor-pointer"
                            title="Delete your message"
                            aria-label="Delete your message"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}

                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                            isDeleted
                              ? isOwn
                                ? "bg-rose-50/70 border border-rose-200 text-rose-800/80 italic rounded-br-xs text-xs"
                                : "bg-gray-100 border border-gray-200 text-gray-500 italic rounded-bl-xs text-xs"
                              : isOwn
                              ? "bg-brand-600 text-white rounded-br-xs"
                              : "bg-white text-gray-800 border border-gray-100 rounded-bl-xs"
                          }`}
                        >
                          {isDeleted ? (
                            <div className="flex items-center gap-1.5">
                              <Trash2 className="w-3 h-3 text-gray-400 shrink-0" aria-hidden="true" />
                              <span>{isOwn ? "You deleted this message" : "This message was deleted"}</span>
                            </div>
                          ) : (
                            m.content
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
                        <span className="tabular-nums">
                          {new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "numeric", hour12: true }).format(new Date(m.created_at))}
                        </span>
                        {isOwn && !isDeleted && (
                          <CheckCheck className={`w-3.5 h-3.5 ${m.status === "READ" ? "text-blue-500" : "text-gray-400"}`} aria-hidden="true" />
                        )}
                        {isDeleted && (
                          <span className="text-[10px] text-gray-400">(Deleted)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
                <label htmlFor="chatMessageInput" className="sr-only">
                  Message text
                </label>
                <input
                  id="chatMessageInput"
                  name="content"
                  ref={inputRef}
                  type="text"
                  autoComplete="off"
                  required
                  placeholder="Type a respectful message…"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                />
                <Button type="submit" variant="primary" size="md" isLoading={sending}>
                  <Send className="w-4 h-4 mr-1" aria-hidden="true" /> Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
              Select a conversation to start messaging.
            </div>
          )}
        </div>
      </div>

      {activeConv?.partner_profile && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          reportedUserId={activeConv.partner_profile.user_id}
          reportedUserName={activeConv.partner_profile.first_name}
          onReportSubmitted={() => {
            setReportSubmittedNotice(
              `Incident report submitted regarding ${activeConv.partner_profile?.first_name}. The complete forensic chat audit transcript (including any deleted messages) has been dispatched to platform administrators.`
            );
          }}
        />
      )}
    </div>
  );
}
