"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  Users,
  CheckCircle,
  Ban,
  LogIn,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Lock,
  ArrowUpRight,
  Clock,
  XCircle,
  Check,
  Scale,
  User,
  Coins,
  Edit3,
  Plus,
  FileText,
  Download
} from "lucide-react";
import { PlanItem } from "@/types";
import { PlanEditModal } from "@/components/pricing/PlanEditModal";
import { ChatTranscriptModal } from "@/components/admin/ChatTranscriptModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiClient } from "@/lib/api";

export type AdminUserStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "BANNED"
  | "PENDING_VERIFICATION"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "DEACTIVATED";

interface AdminUser {
  id: string;
  email: string;
  phone_number: string;
  role: "MEMBER" | "MODERATOR" | "ADMIN";
  status: AdminUserStatus;
  created_at: string;
  first_name?: string;
  last_name?: string;
  profile_id_display?: string;
  gender?: string;
  city?: string;
  id_verified?: boolean;
  selfie_verified?: boolean;
  employment_verified?: boolean;
  family_reference_verified?: boolean;
  trust_shield_score?: number;
  family_references?: {
    name: string;
    relation: string;
    phone: string;
    city: string;
    verified?: boolean;
  }[];
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"proposals" | "users" | "reports" | "plans">("proposals");
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [proposals, setProposals] = useState<AdminUser[]>([]);
  const [adminPlans, setAdminPlans] = useState<PlanItem[]>([]);
  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false);
  const [selectedAdminPlan, setSelectedAdminPlan] = useState<PlanItem | null>(null);
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [selectedTranscriptReport, setSelectedTranscriptReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // User Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reportFilter, setReportFilter] = useState<"ALL" | "PENDING" | "RESOLVED">("ALL");
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchAdminStatsAndReports = async () => {
    try {
      const [s, r, p] = await Promise.all([
        apiClient<any>("/admin/dashboard-stats"),
        apiClient<any[]>("/admin/reports"),
        apiClient<PlanItem[]>("/plans").catch(() => []),
      ]);
      setStats(s);
      setReports(r);
      setAdminPlans(p);
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (
        msg.includes("401") ||
        msg.includes("Authentication required") ||
        msg.includes("credentials") ||
        msg.includes("session")
      ) {
        setAuthError("Administrative session required. Please sign in with an Administrator or Moderator account.");
      } else if (msg.includes("403") || msg.includes("Insufficient permissions") || msg.includes("Forbidden")) {
        setAuthError(
          "Access Restricted: Your account does not have administrative privileges. Only ADMIN and MODERATOR roles may access this portal."
        );
      } else {
        setAuthError(err.message || "Failed to connect to administrative portal.");
      }
    }
  };

  const fetchProposals = useCallback(async () => {
    setProposalsLoading(true);
    try {
      const res = await apiClient<AdminUser[]>("/admin/proposals");
      setProposals(res || []);
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setProposalsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      params.append("limit", "100");

      const res = await apiClient<AdminUser[]>(`/admin/users?${params.toString()}`);
      setUsers(res || []);
    } catch (err: any) {
      console.error("Failed to load user census:", err);
    } finally {
      setUsersLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchAdminStatsAndReports();
      await fetchProposals();
      await fetchUsers();
      setLoading(false);
    }
    init();
  }, [fetchUsers, fetchProposals]);

  // Approve a pending membership proposal
  const handleApproveProposal = async (userId: string, memberEmail: string) => {
    setActionInProgress(userId);
    setActionNotice(null);
    try {
      const res = await apiClient<any>(`/admin/proposals/${userId}/approve`, {
        method: "POST"
      });
      setActionNotice({
        type: "success",
        text: res?.message || `Proposal for ${memberEmail} approved! Account is now active.`
      });
      fetchProposals();
      fetchUsers();
      fetchAdminStatsAndReports();
    } catch (err: any) {
      setActionNotice({
        type: "error",
        text: err.message || `Failed to approve proposal for ${memberEmail}.`
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Reject a pending membership proposal
  const handleRejectProposal = async (userId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to decline the membership proposal for ${memberEmail}?`)) {
      return;
    }
    setActionInProgress(userId);
    setActionNotice(null);
    try {
      const res = await apiClient<any>(`/admin/proposals/${userId}/reject`, {
        method: "POST"
      });
      setActionNotice({
        type: "success",
        text: res?.message || `Proposal for ${memberEmail} was declined.`
      });
      fetchProposals();
      fetchUsers();
      fetchAdminStatsAndReports();
    } catch (err: any) {
      setActionNotice({
        type: "error",
        text: err.message || `Failed to decline proposal for ${memberEmail}.`
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Toggle Member Trust Shield Badges (+25% per badge)
  const handleToggleTrustBadge = async (
    userId: string,
    badgeKey: "id_verified" | "selfie_verified" | "employment_verified" | "family_reference_verified",
    currentVal: boolean
  ) => {
    setActionInProgress(userId);
    setActionNotice(null);
    try {
      const res = await apiClient<any>(`/admin/users/${userId}/trust-badge`, {
        method: "PATCH",
        body: JSON.stringify({ [badgeKey]: !currentVal }),
      });
      setActionNotice({
        type: "success",
        text: res?.message || `Trust badge ${badgeKey} updated!`,
      });
      const updater = (prev: AdminUser[]) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                [badgeKey]: !currentVal,
                trust_shield_score: res.trust_shield_score,
              }
            : u
        );
      setUsers(updater);
      setProposals(updater);
    } catch (err: any) {
      setActionNotice({
        type: "error",
        text: err.message || "Failed to update trust badge.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Upgrade or Degrade User Position
  const handleRoleChange = async (userId: string, newRole: "MEMBER" | "MODERATOR" | "ADMIN", memberName: string) => {
    setActionInProgress(userId);
    setActionNotice(null);
    try {
      const res = await apiClient<any>(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      setActionNotice({
        type: "success",
        text: res?.message || `Position for ${memberName} updated to ${newRole}.`,
      });
      // Optimistic update locally
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      fetchAdminStatsAndReports();
    } catch (err: any) {
      setActionNotice({
        type: "error",
        text: err.message || `Failed to change position for ${memberName}.`,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Block, Suspend, or Reactivate User Status
  const handleStatusChange = async (
    userId: string,
    newStatus: AdminUserStatus,
    memberName: string
  ) => {
    const isDestructive = newStatus === "BANNED" || newStatus === "SUSPENDED";
    if (
      isDestructive &&
      !confirm(`Are you sure you want to mark ${memberName} as ${newStatus}? Their profile will be hidden from matches and public search immediately.`)
    ) {
      return;
    }

    setActionInProgress(userId);
    setActionNotice(null);
    try {
      const res = await apiClient<any>(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setActionNotice({
        type: "success",
        text: res?.message || `Account for ${memberName} is now ${newStatus}.`,
      });
      // Optimistic update locally
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      fetchAdminStatsAndReports();
    } catch (err: any) {
      setActionNotice({
        type: "error",
        text: err.message || `Failed to update status for ${memberName}.`,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResolveReport = async (reportId: string, statusVal: string) => {
    setActionInProgress(`${reportId}-${statusVal.toLowerCase()}`);
    try {
      await apiClient(`/admin/reports/${reportId}/resolve?resolution_status=${statusVal}`, {
        method: "POST",
        body: JSON.stringify({ resolution_status: statusVal }),
      });
      // Optimistically update report status locally
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: statusVal } : r)));
      fetchAdminStatsAndReports();
      setActionNotice({
        type: "success",
        text: `Incident report #${reportId.slice(0, 8)} marked as ${statusVal}.`,
      });
    } catch (err: any) {
      setActionNotice({
        type: "error",
        text: err.message || `Failed to update report status to ${statusVal}.`,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to administrative command portal…" />;

  if (authError) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-rose-100 rounded-3xl text-center shadow-lg space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-900 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-royal text-gray-900">Administrative Portal</h2>
        <p className="text-xs text-gray-600 leading-relaxed">{authError}</p>
        <div className="pt-2">
          <Link href="/login">
            <Button variant="primary" size="lg" className="w-full">
              <LogIn className="w-4 h-4 mr-2" /> Sign In as Administrator
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-900 text-amber-400 flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
              Trust &amp; Governance Center
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Member census, position upgrades &amp; demotions, user blocking, and harassment queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchAdminStatsAndReports();
              fetchProposals();
              fetchUsers();
            }}
            isLoading={usersLoading || proposalsLoading}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* Banner Notice */}
      {actionNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            actionNotice.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <span>{actionNotice.text}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-gray-400 hover:text-gray-700 font-bold ml-3 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      {stats && stats.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm">
            <span className="text-xs text-amber-800 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Pending Proposals
            </span>
            <p className="text-3xl font-bold font-serif text-amber-900 mt-1 tabular-nums">
              {stats.metrics.pending_account_proposals ?? proposals.length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-gray-500">Total Registered</span>
            <p className="text-3xl font-bold font-serif text-gray-900 mt-1 tabular-nums">
              {stats.metrics.total_registered_users}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-emerald-600 font-semibold">Active Profiles</span>
            <p className="text-3xl font-bold font-serif text-emerald-600 mt-1 tabular-nums">
              {stats.metrics.active_verified_members}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-rose-600 font-semibold">Suspended / Banned</span>
            <p className="text-3xl font-bold font-serif text-rose-600 mt-1 tabular-nums">
              {stats.metrics.suspended_members}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-amber-600 font-semibold">Flagged Incidents</span>
            <p className="text-3xl font-bold font-serif text-amber-600 mt-1 tabular-nums">
              {stats.metrics.pending_moderation_reports}
            </p>
          </div>
        </div>
      )}

      {/* Primary Section Tabs */}
      <div className="flex border-b border-gray-200 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("proposals")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-[color,border-color] whitespace-nowrap ${
            activeTab === "proposals"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />
          Pending Account Proposals ({proposals.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-[color,border-color] whitespace-nowrap ${
            activeTab === "users"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Users className="w-4 h-4" aria-hidden="true" />
          Member Census &amp; Position Governance ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-[color,border-color] whitespace-nowrap ${
            activeTab === "reports"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
          Flagged Incident Queue ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-[color,border-color] whitespace-nowrap ${
            activeTab === "plans"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" aria-hidden="true" />
          Monetary Plans &amp; Credit Quotas ({adminPlans.length})
        </button>
      </div>

      {/* Tab 0: Pending Membership Account Proposals */}
      {activeTab === "proposals" && (
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold font-serif text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" aria-hidden="true" />
                Pending Account Opening Proposals
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Applicants who registered and verified phone OTP. Review and manually accept or reject their proposal to unlock full matchmaking.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto tabular-nums">
              {proposals.length} awaiting review
            </span>
          </div>

          {proposalsLoading ? (
            <div className="py-12 text-center text-xs text-gray-500">Loading pending proposals…</div>
          ) : proposals.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" aria-hidden="true" />
              <p className="text-sm font-bold text-gray-800">All Proposals Reviewed</p>
              <p className="text-xs text-gray-400">There are no pending account opening proposals at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((prop) => {
                const fullName = prop.first_name ? `${prop.first_name} ${prop.last_name || ""}`.trim() : "New Applicant";
                const isBusy = actionInProgress === prop.id;
                return (
                  <div
                    key={prop.id}
                    className="p-5 rounded-2xl border border-amber-100 bg-amber-50/20 hover:border-amber-200 transition-[border-color,box-shadow] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{fullName}</span>
                        <span className="text-xs text-brand-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          {prop.profile_id_display || "BDN-DRAFT"}
                        </span>
                        {prop.gender && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            prop.gender === "FEMALE" ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {prop.gender === "FEMALE" ? "Bride" : "Groom"}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {prop.status}
                        </span>

                        {/* Trust Shield Score Indicator */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          (prop.trust_shield_score ?? 0) === 100
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : (prop.trust_shield_score ?? 0) >= 50
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          <Shield className="w-3 h-3 text-emerald-600" />
                          🛡️ {prop.trust_shield_score ?? 0}% Trust Shield
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Email: <strong className="text-gray-900">{prop.email}</strong></span>
                        <span>Phone: <strong className="text-gray-900 tabular-nums">{prop.phone_number}</strong></span>
                        {prop.city && <span>Location: <strong className="text-gray-900">{prop.city}</strong></span>}
                      </div>

                      {/* Trust Shield 4-Pillar Verification Toggles */}
                      <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                        <span className="text-gray-400 font-semibold mr-1">Trust Badges:</span>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleTrustBadge(prop.id, "id_verified", !!prop.id_verified)}
                          className={`px-2 py-0.5 rounded-md border font-medium transition-colors ${
                            prop.id_verified
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                          }`}
                          title="Click to toggle Govt ID verification"
                        >
                          🪪 Govt ID {prop.id_verified ? "✓" : "—"}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleTrustBadge(prop.id, "selfie_verified", !!prop.selfie_verified)}
                          className={`px-2 py-0.5 rounded-md border font-medium transition-colors ${
                            prop.selfie_verified
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                          }`}
                          title="Click to toggle Selfie Liveness verification"
                        >
                          🤳 Selfie {prop.selfie_verified ? "✓" : "—"}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleTrustBadge(prop.id, "employment_verified", !!prop.employment_verified)}
                          className={`px-2 py-0.5 rounded-md border font-medium transition-colors ${
                            prop.employment_verified
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                          }`}
                          title="Click to toggle Employment verification"
                        >
                          💼 Job {prop.employment_verified ? "✓" : "—"}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleTrustBadge(prop.id, "family_reference_verified", !!prop.family_reference_verified)}
                          className={`px-2 py-0.5 rounded-md border font-medium transition-colors ${
                            prop.family_reference_verified
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                          }`}
                          title="Click to toggle Mutual Family Reference verification"
                        >
                          👨‍👩‍👧 Family {prop.family_reference_verified ? "✓" : "—"}
                        </button>
                      </div>

                      {/* Display Submitted Family References if Present */}
                      {prop.family_references && prop.family_references.length > 0 && (
                        <div className="mt-1 p-2 bg-emerald-50/70 rounded-xl border border-emerald-100 text-[11px] text-emerald-950">
                          <strong className="block text-[10px] uppercase font-bold text-emerald-900">
                            👨‍👩‍👧‍👦 Submitted Family Contacts on File:
                          </strong>
                          <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                            {prop.family_references.map((r, i) => (
                              <li key={i}>
                                {r.name} ({r.relation}, {r.city}) — Phone: {r.phone}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-[11px] text-gray-400">
                        Submitted: {new Date(prop.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-amber-100">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isBusy}
                        isLoading={isBusy}
                        onClick={() => handleApproveProposal(prop.id, prop.email)}
                        className="flex-1 md:flex-none text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Check className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Accept Proposal
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleRejectProposal(prop.id, prop.email)}
                        className="flex-1 md:flex-none text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Decline
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Member Census, Role Upgrade/Degrade, and Blocking */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" aria-hidden="true" />
              <input
                type="text"
                name="search"
                autoComplete="off"
                aria-label="Search member census"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or BDN ID…"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 font-medium bg-white text-gray-900"
              >
                <option value="ALL">All Positions</option>
                <option value="MEMBER">Members Only</option>
                <option value="MODERATOR">Moderators</option>
                <option value="ADMIN">Administrators</option>
              </select>

              <select
                aria-label="Filter by account status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 font-medium bg-white text-gray-900"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned / Blocked</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          {usersLoading ? (
            <div className="py-12 text-center text-xs text-gray-500">Loading directory…</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No matching accounts found for the selected query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">Candidate</th>
                    <th className="pb-3 font-semibold">Contact Credentials</th>
                    <th className="pb-3 font-semibold">Position / Role</th>
                    <th className="pb-3 font-semibold">Trust Shield</th>
                    <th className="pb-3 font-semibold">Account Status</th>
                    <th className="pb-3 font-semibold text-right">Disciplinary Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => {
                    const fullName = u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : "Pending Profile";
                    const isBusy = actionInProgress === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Candidate Identity */}
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-100 to-rose-200 text-brand-900 font-bold flex items-center justify-center shrink-0 text-xs">
                              {u.first_name?.[0] || u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                <span>{fullName}</span>
                                {u.gender && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      u.gender === "FEMALE"
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {u.gender === "FEMALE" ? "Bride" : "Groom"}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-gray-400 block">
                                {u.profile_id_display || "No Display ID"} {u.city ? `• ${u.city}` : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 pr-3">
                          <span className="font-medium text-gray-700 block">{u.email}</span>
                          <span className="text-[11px] text-gray-400 font-mono block tabular-nums">{u.phone_number}</span>
                        </td>

                        {/* Upgrade / Degrade Position */}
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-1.5">
                            {u.role === "ADMIN" ? (
                              <Shield className="w-3.5 h-3.5 text-purple-700 shrink-0" aria-hidden="true" />
                            ) : u.role === "MODERATOR" ? (
                              <Scale className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-gray-500 shrink-0" aria-hidden="true" />
                            )}
                            <select
                              aria-label={`Change position for ${fullName}`}
                              value={u.role}
                              disabled={isBusy}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value as any, fullName)
                              }
                              className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                                u.role === "ADMIN"
                                  ? "bg-purple-50 text-purple-900 border-purple-200"
                                  : u.role === "MODERATOR"
                                  ? "bg-amber-50 text-amber-900 border-amber-200"
                                  : "bg-gray-50 text-gray-800 border-gray-200"
                              }`}
                            >
                              <option value="MEMBER">Member</option>
                              <option value="MODERATOR">Moderator</option>
                              <option value="ADMIN">Administrator</option>
                            </select>
                          </div>
                        </td>

                        {/* Trust Shield 4-Pillar Score & Badges */}
                        <td className="py-3.5 pr-3">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                                (u.trust_shield_score ?? 0) === 100
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  : (u.trust_shield_score ?? 0) >= 50
                                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              <Shield className="w-3 h-3 text-emerald-600" />
                              🛡️ {u.trust_shield_score ?? 0}% Shield
                            </span>
                            <div className="flex items-center gap-1 text-[9px]">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleTrustBadge(u.id, "id_verified", !!u.id_verified)}
                                className={`px-1.5 py-0.2 rounded border transition-colors ${
                                  u.id_verified
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                                    : "bg-white text-gray-400 border-gray-200 line-through hover:border-gray-300"
                                }`}
                                title="Click to toggle Govt ID badge"
                              >
                                🪪 ID
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleTrustBadge(u.id, "selfie_verified", !!u.selfie_verified)}
                                className={`px-1.5 py-0.2 rounded border transition-colors ${
                                  u.selfie_verified
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                                    : "bg-white text-gray-400 border-gray-200 line-through hover:border-gray-300"
                                }`}
                                title="Click to toggle Selfie badge"
                              >
                                🤳 Selfie
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleTrustBadge(u.id, "employment_verified", !!u.employment_verified)}
                                className={`px-1.5 py-0.2 rounded border transition-colors ${
                                  u.employment_verified
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                                    : "bg-white text-gray-400 border-gray-200 line-through hover:border-gray-300"
                                }`}
                                title="Click to toggle Employment badge"
                              >
                                💼 Job
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleTrustBadge(u.id, "family_reference_verified", !!u.family_reference_verified)}
                                className={`px-1.5 py-0.2 rounded border transition-colors ${
                                  u.family_reference_verified
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                                    : "bg-white text-gray-400 border-gray-200 line-through hover:border-gray-300"
                                }`}
                                title="Click to toggle Family References badge"
                              >
                                👨‍👩‍👧 Family
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Account Status Badge */}
                        <td className="py-3.5 pr-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : u.status === "PENDING_APPROVAL" || u.status === "PENDING_VERIFICATION"
                                ? "bg-amber-100 text-amber-800"
                                : u.status === "SUSPENDED"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        {/* Actions (Approve, Reject, Block, Suspend, Reactivate) */}
                        <td className="py-3.5 text-right space-x-1.5">
                          {u.status === "ACTIVE" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(u.id, "SUSPENDED", fullName)}
                                className="text-[11px] py-1 px-2.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                              >
                                Suspend
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(u.id, "BANNED", fullName)}
                                className="text-[11px] py-1 px-2.5"
                              >
                                <Ban className="w-3 h-3 mr-1" aria-hidden="true" /> Block / Ban
                              </Button>
                            </>
                          ) : u.status === "PENDING_APPROVAL" || u.status === "PENDING_VERIFICATION" ? (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isBusy}
                                isLoading={isBusy}
                                onClick={() => handleApproveProposal(u.id, u.email)}
                                className="text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <Check className="w-3 h-3 mr-1" aria-hidden="true" /> Accept
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleRejectProposal(u.id, u.email)}
                                className="text-[11px] py-1 px-2.5"
                              >
                                <XCircle className="w-3 h-3 mr-1" aria-hidden="true" /> Reject
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleStatusChange(u.id, "ACTIVE", fullName)}
                              className="text-[11px] py-1 px-2.5 bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <UserCheck className="w-3 h-3 mr-1" aria-hidden="true" /> Reactivate / Unblock
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Flagged Incident Reports Queue */}
      {activeTab === "reports" && (() => {
        const filteredReports = reports.filter((r) => {
          if (reportFilter === "PENDING") return r.status === "PENDING";
          if (reportFilter === "RESOLVED") return r.status === "RESOLVED" || r.status === "DISMISSED";
          return true;
        });

        return (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold font-serif text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" aria-hidden="true" />
                  Flagged Incident Review Queue ({reports.length})
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Harassment claims, profile violations, and member concerns managed by Administrators and Community Moderators
                </p>
              </div>

              {/* Incident Queue Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-2xl border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setReportFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                    reportFilter === "ALL"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All ({reports.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter("PENDING")}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                    reportFilter === "PENDING"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pending ({reports.filter((r) => r.status === "PENDING").length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter("RESOLVED")}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                    reportFilter === "RESOLVED"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Closed / Dismissed ({reports.filter((r) => r.status !== "PENDING").length})
                </button>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">
                  {reportFilter === "PENDING"
                    ? "Zero pending incident reports!"
                    : "No reports found in this category."}
                </h3>
                <p className="text-xs text-gray-500">
                  The matrimonial community is safe, respectful, and fully moderated.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((r) => {
                  const isResolved = r.status === "RESOLVED";
                  const isDismissed = r.status === "DISMISSED";

                  return (
                    <div
                      key={r.id}
                      className={`p-5 rounded-3xl border transition-[border-color,background-color] ${
                        isResolved
                          ? "border-emerald-200 bg-emerald-50/20"
                          : isDismissed
                          ? "border-gray-200 bg-gray-50/40"
                          : "border-amber-200 bg-amber-50/30"
                      } flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4`}
                    >
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="warning">{r.category ? r.category.replace(/_/g, " ") : "INCIDENT"}</Badge>
                          <span className="text-xs font-mono text-gray-400">#{r.id.slice(0, 8)}</span>
                          <Badge
                            variant={
                              isResolved ? "success" : isDismissed ? "neutral" : "brand"
                            }
                          >
                            {r.status || "PENDING"}
                          </Badge>
                          <span className="text-[11px] text-gray-400">
                            {new Intl.DateTimeFormat("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(r.created_at))}
                          </span>
                        </div>

                        <div className="text-xs text-gray-800 font-semibold">
                          Complainant: <span className="text-brand-700 font-bold">{r.reporter_name || "Member"}</span>{" "}
                          • Accused: <span className="text-rose-700 font-bold">{r.reported_name || "Reported User"}</span>
                        </div>

                        <p className="text-xs text-gray-700 font-medium bg-white p-3 rounded-2xl border border-gray-200 shadow-xs leading-relaxed">
                          &ldquo;{r.description}&rdquo;
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                          <span>Target User UUID: <code className="font-mono">{r.reported_user_id}</code></span>
                          {r.has_transcript && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                              <FileText className="w-3 h-3 text-indigo-600" aria-hidden="true" />
                              Full Chat Log Attached (.txt)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                        {/* Chat Transcript Actions for Admins/Moderators */}
                        {r.has_transcript && (
                          <div className="flex items-center gap-1.5 mr-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1 font-semibold"
                              onClick={() => {
                                setSelectedTranscriptReport(r);
                                setTranscriptModalOpen(true);
                              }}
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                              <span>View Chat Log (.txt)</span>
                            </Button>
                            <a
                              href={`/api/v1/admin/reports/${r.id}/transcript`}
                              download
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                              title="Download TXT transcript"
                            >
                              <Download className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                              <span>.txt</span>
                            </a>
                          </div>
                        )}
                        {isResolved ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300 shadow-xs">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                              <span>Resolved</span>
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-gray-600 hover:text-gray-900"
                              onClick={() => handleResolveReport(r.id, "PENDING")}
                              isLoading={actionInProgress === `${r.id}-pending`}
                            >
                              Reopen
                            </Button>
                          </div>
                        ) : isDismissed ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-200/80 px-3 py-1.5 rounded-full border border-gray-300 shadow-xs">
                              <XCircle className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
                              <span>Dismissed</span>
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-gray-600 hover:text-gray-900"
                              onClick={() => handleResolveReport(r.id, "PENDING")}
                              isLoading={actionInProgress === `${r.id}-pending`}
                            >
                              Reopen
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(
                                  r.reported_user_id,
                                  "BANNED",
                                  r.reported_name || "Reported User"
                                )
                              }
                              isLoading={actionInProgress === r.reported_user_id}
                            >
                              <Ban className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Block User
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveReport(r.id, "DISMISSED")}
                              isLoading={actionInProgress === `${r.id}-dismissed`}
                              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            >
                              Dismiss
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolveReport(r.id, "RESOLVED")}
                              isLoading={actionInProgress === `${r.id}-resolved`}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Tab 3: Monetary Plans & Credit Quotas Management */}
      {activeTab === "plans" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold font-serif text-gray-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" aria-hidden="true" />
                Monetary Plans &amp; Credit Quotas ({adminPlans.length})
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Moderators and Administrators can modify prices, contact credit allowances, and features directly.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setSelectedAdminPlan(null);
                  setEditPlanModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" /> Create New Tier
              </Button>
              <Link href="/pricing" target="_blank">
                <Button variant="outline" size="sm">
                  View Public Pricing <ArrowUpRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminPlans.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-gray-200 bg-slate-50/50 flex flex-col justify-between space-y-4 hover:border-amber-300 transition-[border-color,box-shadow]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900 font-serif text-base">{p.name}</span>
                    <Badge variant={p.is_active ? "success" : "neutral"}>
                      {p.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </div>

                  <div className="text-2xl font-black text-gray-900 font-serif tabular-nums mb-3">
                    {p.price_cents === 0
                      ? "Free"
                      : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p.price_cents / 100)}
                    <span className="text-xs font-normal text-gray-400"> / {p.duration_months} mo</span>
                  </div>

                  <ul className="text-xs text-gray-600 space-y-1.5 border-t border-gray-200/60 pt-3">
                    <li className="flex items-center justify-between">
                      <span>Contact Credits:</span>
                      <strong className="text-gray-900 tabular-nums">{p.contact_credits_quota} reveals</strong>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Recommendation Boost:</span>
                      <strong className="text-gray-900 tabular-nums">{p.priority_boost}x</strong>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Direct Chat:</span>
                      <strong>{p.can_initiate_chat ? "Enabled" : "Disabled"}</strong>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Protected Photos:</span>
                      <strong>{p.can_view_hidden_photos ? "Enabled" : "Disabled"}</strong>
                    </li>
                  </ul>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold text-amber-900 hover:bg-amber-50 hover:border-amber-300"
                  onClick={() => {
                    setSelectedAdminPlan(p);
                    setEditPlanModalOpen(true);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5 text-amber-600" aria-hidden="true" />
                  Edit Plan Config
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Edit Modal */}
      <PlanEditModal
        isOpen={editPlanModalOpen}
        onClose={() => setEditPlanModalOpen(false)}
        plan={selectedAdminPlan}
        onPlanSaved={(savedPlan) => {
          setActionNotice({
            type: "success",
            text: `Monetary plan "${savedPlan.name}" updated successfully! Price: ₹${Math.round(savedPlan.price_cents / 100)}, Credits: ${savedPlan.contact_credits_quota}.`,
          });
          fetchAdminStatsAndReports();
        }}
      />

      {/* Forensic Chat Transcript Modal */}
      <ChatTranscriptModal
        isOpen={transcriptModalOpen}
        onClose={() => setTranscriptModalOpen(false)}
        reportId={selectedTranscriptReport?.id || null}
        reporterName={selectedTranscriptReport?.reporter_name}
        reportedName={selectedTranscriptReport?.reported_name}
      />
    </div>
  );
}
