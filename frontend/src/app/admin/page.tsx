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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiClient } from "@/lib/api";

interface AdminUser {
  id: string;
  email: string;
  phone_number: string;
  role: "MEMBER" | "MODERATOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING_VERIFICATION";
  created_at: string;
  first_name?: string;
  last_name?: string;
  profile_id_display?: string;
  gender?: string;
  city?: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"users" | "reports">("users");
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // User Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchAdminStatsAndReports = async () => {
    try {
      const s = await apiClient<any>("/admin/dashboard-stats");
      const r = await apiClient<any[]>("/admin/reports");
      setStats(s);
      setReports(r);
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
      await fetchUsers();
      setLoading(false);
    }
    init();
  }, [fetchUsers]);

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
    newStatus: "ACTIVE" | "SUSPENDED" | "BANNED",
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
    try {
      await apiClient(`/admin/reports/${reportId}/resolve?resolution_status=${statusVal}`, { method: "PATCH" });
      fetchAdminStatsAndReports();
      setActionNotice({
        type: "success",
        text: `Incident report marked as ${statusVal}.`,
      });
    } catch (err: any) {
      alert(err.message || "Action failed.");
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
              fetchUsers();
            }}
            isLoading={usersLoading}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-gray-500">Total Registered</span>
            <p className="text-3xl font-bold font-serif text-gray-900 mt-1">
              {stats.metrics.total_registered_users}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-emerald-600 font-semibold">Active Profiles</span>
            <p className="text-3xl font-bold font-serif text-emerald-600 mt-1">
              {stats.metrics.active_verified_members}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-rose-600 font-semibold">Suspended / Banned</span>
            <p className="text-3xl font-bold font-serif text-rose-600 mt-1">
              {stats.metrics.suspended_members}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-amber-600 font-semibold">Flagged Incidents</span>
            <p className="text-3xl font-bold font-serif text-amber-600 mt-1">
              {stats.metrics.pending_moderation_reports}
            </p>
          </div>
        </div>
      )}

      {/* Primary Section Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "users"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Member Census &amp; Position Governance ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "reports"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Flagged Incident Queue ({reports.length})
        </button>
      </div>

      {/* Tab 1: Member Census, Role Upgrade/Degrade, and Blocking */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or BDN ID…"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="ALL">All Positions</option>
                <option value="MEMBER">Members Only</option>
                <option value="MODERATOR">Moderators</option>
                <option value="ADMIN">Administrators</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned / Blocked</option>
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
                          <span className="text-[11px] text-gray-400 font-mono block">{u.phone_number}</span>
                        </td>

                        {/* Upgrade / Degrade Position */}
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-1.5">
                            <select
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
                              <option value="MEMBER">👤 Member</option>
                              <option value="MODERATOR">⚖️ Moderator</option>
                              <option value="ADMIN">🛡️ Administrator</option>
                            </select>
                          </div>
                        </td>

                        {/* Account Status Badge */}
                        <td className="py-3.5 pr-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : u.status === "SUSPENDED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        {/* Actions (Block / Suspend / Reactivate) */}
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
                                <Ban className="w-3 h-3 mr-1" /> Block / Ban
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
                              <UserCheck className="w-3 h-3 mr-1" /> Reactivate / Unblock
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
      {activeTab === "reports" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-bold font-serif text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Flagged Incident Review Queue ({reports.length})
          </h2>

          {reports.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">Zero pending reports. The community is healthy.</p>
          ) : (
            <div className="space-y-4">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="warning">{r.category}</Badge>
                      <span className="text-xs text-gray-400">Report ID: {r.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">{r.description}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Reported User ID: <span className="font-mono">{r.reported_user_id}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleStatusChange(r.reported_user_id, "BANNED", "Reported User")}
                    >
                      <Ban className="w-3.5 h-3.5 mr-1" /> Block User
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleResolveReport(r.id, "DISMISSED")}>
                      Dismiss
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleResolveReport(r.id, "RESOLVED")}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
