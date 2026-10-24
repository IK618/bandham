"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, Users, CheckCircle, Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiClient } from "@/lib/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const s = await apiClient<any>("/admin/dashboard-stats");
      const r = await apiClient<any[]>("/admin/reports");
      setStats(s);
      setReports(r);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolveReport = async (reportId: string, statusVal: string) => {
    try {
      await apiClient(`/admin/reports/${reportId}/resolve?resolution_status=${statusVal}`, { method: "PATCH" });
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Action failed.");
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm("Are you sure you want to suspend this user?")) return;
    try {
      await apiClient(`/admin/users/${userId}/suspend?suspend=true`, { method: "PATCH" });
      alert("User suspended.");
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Suspend failed.");
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to administrative command portal…" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
            Trust &amp; Safety Control Center
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Real-time platform census, harassment incident resolution, and account moderation
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-gray-500">Registered Members</span>
            <p className="text-3xl font-bold font-serif text-gray-900 mt-1">
              {stats.metrics.total_registered_users}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-emerald-600 font-semibold">Active Members</span>
            <p className="text-3xl font-bold font-serif text-emerald-600 mt-1">
              {stats.metrics.active_verified_members}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-amber-600 font-semibold">Pending Reports</span>
            <p className="text-3xl font-bold font-serif text-amber-600 mt-1">
              {stats.metrics.pending_moderation_reports}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-gold-600 font-semibold">Paid Subscriptions</span>
            <p className="text-3xl font-bold font-serif text-gold-600 mt-1">
              {stats.metrics.active_paid_subscriptions}
            </p>
          </div>
        </div>
      )}

      {/* Moderation Queue */}
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
              <div key={r.id} className="p-4 rounded-2xl border border-gray-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                  <Button variant="danger" size="sm" onClick={() => handleSuspendUser(r.reported_user_id)}>
                    <Ban className="w-3.5 h-3.5 mr-1" /> Suspend User
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
    </div>
  );
}
