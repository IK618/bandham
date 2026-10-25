"use client";

import { useState } from "react";
import { Shield, Download, Trash2, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api";

export default function SettingsPage() {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [photoVisibility, setPhotoVisibility] = useState("registered");

  const handleExportData = async () => {
    setDownloading(true);
    try {
      const data = await apiClient("/privacy/export-my-data");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bandham_my_data_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Export failed.");
    } finally {
      setDownloading(false);
    }
  };

  const handleExecuteDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await apiClient<any>("/privacy/delete-my-account", { method: "DELETE" });
      alert(res.message);
      window.location.href = "/";
    } catch (err: any) {
      alert(err.message || "Account deletion failed.");
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
          Account Settings &amp; Data Privacy
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Control who can view your photos, export your personal records, or permanently delete your profile
        </p>
      </div>

      {/* Photo Privacy Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <Eye className="w-5 h-5 text-brand-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-gray-900 font-serif">Photo Visibility Controls</h2>
        </div>
        <p className="text-xs text-gray-600">
          Determine who can see your high-resolution profile photographs:
        </p>
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-rose-50/50 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="registered"
              checked={photoVisibility === "registered"}
              onChange={() => setPhotoVisibility("registered")}
              className="text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500"
            />
            <div>
              <span className="font-semibold text-gray-900">Visible to Registered Members (Recommended)</span>
              <p className="text-xs text-gray-500">Only logged-in and verified members can view your photos.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-rose-50/50 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="blurred"
              checked={photoVisibility === "blurred"}
              onChange={() => setPhotoVisibility("blurred")}
              className="text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500"
            />
            <div>
              <span className="font-semibold text-gray-900">Blur Photos Until Interest Accepted</span>
              <p className="text-xs text-gray-500">Photos appear with Gaussian blur to strangers until you accept their interest.</p>
            </div>
          </label>
        </div>
      </div>

      {/* GDPR / DPDP Compliance Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <Shield className="w-5 h-5 text-emerald-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-gray-900 font-serif">Your Data Rights (GDPR &amp; DPDP)</h2>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-gray-200">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Export Complete Personal Data</h3>
            <p className="text-xs text-gray-500">
              Download an unencrypted JSON archive of your personal profile, interests, and chat records.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportData} isLoading={downloading}>
            <Download className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Download JSON
          </Button>
        </div>

        <div className="p-4 bg-red-50/50 rounded-2xl border border-red-200 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
                Permanent Account Erasure
              </h3>
              <p className="text-xs text-red-700">
                Exercising your Right to be Forgotten. Permanently deletes your profile, photos, and interactions.
              </p>
            </div>
            {!confirmDeleteOpen && (
              <Button variant="danger" size="sm" onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Delete My Account
              </Button>
            )}
          </div>

          {confirmDeleteOpen && (
            <div className="p-4 bg-white border border-red-300 rounded-xl space-y-3" role="alert">
              <p className="text-xs font-semibold text-red-900">
                ⚠️ Are you sure? All profile information, photos, matches, and chats will be permanently erased.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={handleExecuteDeleteAccount} isLoading={deleting}>
                  Yes, Permanently Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
