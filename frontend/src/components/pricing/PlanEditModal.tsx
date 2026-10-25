"use client";

import React, { useState, useEffect } from "react";
import { Edit3, Check, X, AlertCircle, Coins, ShieldCheck, Zap } from "lucide-react";
import { PlanItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api";

interface PlanEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanItem | null;
  onPlanSaved: (plan: PlanItem) => void;
}

export function PlanEditModal({
  isOpen,
  onClose,
  plan,
  onPlanSaved,
}: PlanEditModalProps) {
  const isEditing = Boolean(plan);

  const [name, setName] = useState("");
  const [priceInRupees, setPriceInRupees] = useState(0);
  const [contactCredits, setContactCredits] = useState(50);
  const [durationMonths, setDurationMonths] = useState(3);
  const [priorityBoost, setPriorityBoost] = useState(2);
  const [canInitiateChat, setCanInitiateChat] = useState(true);
  const [canViewHiddenPhotos, setCanViewHiddenPhotos] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setPriceInRupees(Math.round(plan.price_cents / 100));
      setContactCredits(plan.contact_credits_quota);
      setDurationMonths(plan.duration_months);
      setPriorityBoost(plan.priority_boost);
      setCanInitiateChat(plan.can_initiate_chat);
      setCanViewHiddenPhotos(plan.can_view_hidden_photos);
      setIsActive(plan.is_active);
    } else {
      setName("");
      setPriceInRupees(2999);
      setContactCredits(50);
      setDurationMonths(3);
      setPriorityBoost(2);
      setCanInitiateChat(true);
      setCanViewHiddenPhotos(false);
      setIsActive(true);
    }
    setError(null);
  }, [plan, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Plan name is required.");
      return;
    }
    if (priceInRupees < 0) {
      setError("Price cannot be negative.");
      return;
    }
    if (contactCredits < 0) {
      setError("Contact credits cannot be negative.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim().toUpperCase(),
      price_cents: Math.round(Number(priceInRupees) * 100),
      contact_credits_quota: Number(contactCredits),
      duration_months: Number(durationMonths),
      priority_boost: Number(priorityBoost),
      can_initiate_chat: canInitiateChat,
      can_view_hidden_photos: canViewHiddenPhotos,
      is_active: isActive,
    };

    try {
      let savedPlan: PlanItem;
      if (isEditing && plan) {
        savedPlan = await apiClient<PlanItem>(`/plans/${plan.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        savedPlan = await apiClient<PlanItem>("/plans", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      onPlanSaved(savedPlan);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save plan configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="plan-modal-title" className="text-base sm:text-lg font-bold font-serif text-gray-900">
                {isEditing ? `Edit Plan: ${plan?.name}` : "Create New Monetary Tier"}
              </h2>
              <p className="text-xs text-gray-500">
                Moderator &amp; Administrator Pricing Configuration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Name */}
          <div className="space-y-1">
            <label htmlFor="plan-name" className="text-xs font-semibold text-gray-800 block">
              Tier Name
            </label>
            <input
              id="plan-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GOLD, PLATINUM, DIAMOND, FESTIVE_SPECIAL"
              className="w-full text-xs font-bold text-gray-900 uppercase border border-gray-300 rounded-xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Amount to be Paid (INR) */}
            <div className="space-y-1">
              <label htmlFor="plan-price" className="text-xs font-semibold text-gray-800 block">
                Price (INR ₹)
              </label>
              <input
                id="plan-price"
                name="price"
                type="number"
                min="0"
                step="1"
                required
                value={priceInRupees}
                onChange={(e) => setPriceInRupees(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 rounded-xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 tabular-nums"
              />
              <p className="text-[10px] text-gray-400">Set 0 for free tier.</p>
            </div>

            {/* Contact Credits */}
            <div className="space-y-1">
              <label htmlFor="plan-credits" className="text-xs font-semibold text-gray-800 block">
                Verified Contact Credits
              </label>
              <input
                id="plan-credits"
                name="credits"
                type="number"
                min="0"
                step="1"
                required
                value={contactCredits}
                onChange={(e) => setContactCredits(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 rounded-xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 tabular-nums"
              />
              <p className="text-[10px] text-gray-400">Phone &amp; email reveals</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Duration Months */}
            <div className="space-y-1">
              <label htmlFor="plan-duration" className="text-xs font-semibold text-gray-800 block">
                Duration (Months)
              </label>
              <input
                id="plan-duration"
                name="duration"
                type="number"
                min="1"
                max="36"
                required
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold text-gray-900 border border-gray-300 rounded-xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 tabular-nums"
              />
            </div>

            {/* Recommendation Boost */}
            <div className="space-y-1">
              <label htmlFor="plan-boost" className="text-xs font-semibold text-gray-800 block">
                Priority Rank Boost
              </label>
              <select
                id="plan-boost"
                name="boost"
                value={priorityBoost}
                onChange={(e) => setPriorityBoost(Number(e.target.value))}
                className="w-full text-xs font-bold text-gray-900 border border-gray-300 rounded-xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <option value={1}>1x (Standard)</option>
                <option value={2}>2x (Gold Boost)</option>
                <option value={3}>3x (Platinum Boost)</option>
                <option value={5}>5x (Diamond Boost)</option>
                <option value={10}>10x (Executive VIP)</option>
              </select>
            </div>
          </div>

          {/* Privilege Toggles */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Tier Privileges &amp; Visibility
            </span>

            <label className="flex items-center gap-2.5 text-xs font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={canInitiateChat}
                onChange={(e) => setCanInitiateChat(e.target.checked)}
                className="rounded text-brand-600 focus-visible:ring-brand-500 w-4 h-4"
              />
              <span>Can initiate direct 1-on-1 chats with candidates</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={canViewHiddenPhotos}
                onChange={(e) => setCanViewHiddenPhotos(e.target.checked)}
                className="rounded text-brand-600 focus-visible:ring-brand-500 w-4 h-4"
              />
              <span>Can view protected/privacy-blurred photos</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-brand-600 focus-visible:ring-brand-500 w-4 h-4"
              />
              <span>Active in public catalog (visible for member checkout)</span>
            </label>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}>
              <Check className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              {isEditing ? "Save Plan Changes" : "Create Plan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
