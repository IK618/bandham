"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Shield, Phone, Zap, Edit3, Plus, QrCode } from "lucide-react";
import { PlanItem, SubscriptionItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PlanEditModal } from "@/components/pricing/PlanEditModal";
import { PaymentQRModal } from "@/components/pricing/PaymentQRModal";
import { apiClient } from "@/lib/api";

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [sub, setSub] = useState<SubscriptionItem | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Moderator & Admin management states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Member 5-Minute GPay/UPI Payment Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PlanItem | null>(null);

  const fetchPlans = async () => {
    try {
      const [p, s, u] = await Promise.all([
        apiClient<PlanItem[]>("/plans"),
        apiClient<SubscriptionItem>("/subscriptions/me").catch(() => null),
        apiClient<any>("/auth/me").catch(() => null),
      ]);
      setPlans(p);
      setSub(s);
      setCurrentUser(u);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleInitiateUpgrade = (plan: PlanItem) => {
    if (!currentUser) {
      router.push("/login?redirect=/pricing");
      return;
    }

    if (isStaff) {
      setStatusNotice("Staff accounts (Admin/Moderator) manage plan definitions directly and do not purchase member passes.");
      return;
    }

    setSelectedPaymentPlan(plan);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (successMessage: string) => {
    setStatusNotice(successMessage);
    fetchPlans();
  };

  const handlePlanSaved = (updatedPlan: PlanItem) => {
    setStatusNotice(`Monetary Plan "${updatedPlan.name}" updated successfully! Price: ₹${Math.round(updatedPlan.price_cents / 100)}, Credits: ${updatedPlan.contact_credits_quota}.`);
    fetchPlans();
  };

  const isStaff = currentUser?.role === "ADMIN" || currentUser?.role === "MODERATOR";

  if (loading) return <LoadingSpinner text="Loading membership tiers…" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-900 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
          <span>Accelerate Your Search</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-gray-900">
          Transparent, Value-Driven Membership Plans
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Unlock verified phone numbers, initiate direct messaging, and receive priority placement in recommendations.
        </p>

        {sub && sub.plan_name !== "FREE" && (
          <div className="inline-block p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
            Current Tier: <strong>{sub.plan_name} Member</strong> • Remaining Contact Credits: <strong className="tabular-nums">{sub.contact_credits_remaining}</strong> • Valid until {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(sub.expires_at))}
          </div>
        )}
      </div>

      {/* Status & Confirmation Notice */}
      {statusNotice && (
        <div role="status" className="max-w-3xl mx-auto p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-sm">
          <span>{statusNotice}</span>
          <button onClick={() => setStatusNotice(null)} className="text-emerald-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Moderator & Admin Management Banner */}
      {isStaff && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-amber-700" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                  Staff Monetization Controls Active ({currentUser?.role})
                </span>
              </div>
              <p className="text-xs text-amber-950 mt-1 max-w-xl leading-relaxed">
                As a <strong>{currentUser?.role}</strong>, you have direct authorization to modify plan prices, contact credit quotas, duration, and feature permissions. Regular members only have permission to choose/upgrade plans.
              </p>
            </div>
          </div>
          <Button
            variant="gold"
            size="md"
            onClick={() => {
              setSelectedPlan(null);
              setEditModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Create New Plan
          </Button>
        </div>
      )}

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isGold = p.name === "GOLD";
          const isPlatinum = p.name === "PLATINUM";
          const isDiamond = p.name === "DIAMOND";
          const isCurrent = sub?.plan_name === p.name;

          return (
            <div
              key={p.id}
              className={`rounded-3xl p-6 flex flex-col justify-between border transition-[border-color,box-shadow] duration-200 ${
                isPlatinum
                  ? "border-rose-400 bg-gradient-to-b from-rose-50/50 to-white shadow-lg ring-2 ring-rose-300"
                  : isGold
                  ? "border-amber-300 bg-amber-50/30 shadow-md"
                  : isDiamond
                  ? "border-indigo-300 bg-indigo-50/20 shadow-md"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                      isPlatinum
                        ? "bg-rose-100 text-rose-800"
                        : isGold
                        ? "bg-amber-100 text-amber-800"
                        : isDiamond
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.name}
                  </span>
                  {isPlatinum && (
                    <span className="text-[10px] font-semibold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-serif font-bold text-gray-900 tabular-nums">
                      {p.price_cents === 0
                        ? "Free"
                        : new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(p.price_cents / 100)}
                    </span>
                    {p.duration_months > 0 && (
                      <span className="text-xs text-gray-500">
                        / {p.duration_months} mo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {p.name === "FREE"
                      ? "Browse profiles & register interests"
                      : `${p.contact_credits_quota} direct verified contact credits`}
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-gray-600 py-4 border-t border-gray-100">
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                    <span className="font-semibold text-gray-800 tabular-nums">
                      {p.contact_credits_quota} Contact Unlocks
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                    <span>{p.can_initiate_chat ? "Initiate Direct Chats" : "Reply to incoming chats"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 shrink-0 ${p.priority_boost > 0 ? "text-amber-500" : "text-gray-300"}`} aria-hidden="true" />
                    <span>{p.priority_boost > 0 ? "Priority Search Placement" : "Standard Search Ranking"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                    <span>{p.can_view_hidden_photos ? "View Protected Photos" : "Standard Photo Visibility"}</span>
                  </li>
                </ul>
              </div>

              <div>
                {/* Regular Member Plan Selection / Upgrade Controls */}
                {!isStaff ? (
                  <>
                    {isCurrent ? (
                      <Button variant="outline" size="md" className="w-full" disabled>
                        Current Active Plan
                      </Button>
                    ) : p.price_cents === 0 ? (
                      <Button variant="outline" size="md" className="w-full" disabled>
                        Default Free Tier
                      </Button>
                    ) : (
                      <Button
                        variant={isPlatinum ? "primary" : isGold ? "gold" : "primary"}
                        size="md"
                        className="w-full flex items-center justify-center gap-1.5"
                        onClick={() => handleInitiateUpgrade(p)}
                      >
                        <QrCode className="w-4 h-4" aria-hidden="true" />
                        <span>Upgrade with GPay / UPI</span>
                      </Button>
                    )}
                  </>
                ) : (
                  /* Staff Management Controls (No Payment Flow for Moderator/Admin) */
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="text-[11px] text-center font-medium text-amber-900 bg-amber-50 py-1.5 px-2 rounded-xl border border-amber-200">
                      Staff Configuration Access
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold text-gray-800 hover:text-amber-800 hover:border-amber-400 flex items-center justify-center gap-1.5"
                      onClick={() => {
                        setSelectedPlan(p);
                        setEditModalOpen(true);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                      <span>Edit Plan Config</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Edit Modal for Moderators & Admins */}
      <PlanEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        plan={selectedPlan}
        onPlanSaved={handlePlanSaved}
      />

      {/* 5-Minute Dynamic GPay / UPI Payment QR Modal for Members */}
      <PaymentQRModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        plan={selectedPaymentPlan}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
