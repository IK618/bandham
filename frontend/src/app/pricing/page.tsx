"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, Shield, Phone, Zap } from "lucide-react";
import { PlanItem, SubscriptionItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiClient } from "@/lib/api";

export default function PricingPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [sub, setSub] = useState<SubscriptionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const p = await apiClient<PlanItem[]>("/plans");
      const s = await apiClient<SubscriptionItem>("/subscriptions/me");
      setPlans(p);
      setSub(s);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      const res = await apiClient<any>("/subscriptions/checkout-mock", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId, payment_method: "UPI" }),
      });
      alert(res.message);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || "Upgrade failed.");
    } finally {
      setUpgrading(null);
    }
  };

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
              className={`bg-white rounded-3xl p-6 border flex flex-col justify-between transition-[border-color,box-shadow] ${
                isPlatinum
                  ? "border-brand-500 shadow-xl ring-2 ring-brand-500/20 relative"
                  : isGold
                  ? "border-amber-300 shadow-md"
                  : "border-gray-200 shadow-xs"
              }`}
            >
              {isPlatinum && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-gray-900 font-serif mb-1">{p.name}</h3>
                <p className="text-xs text-gray-500 mb-4">{p.duration_months} Months Access Pass</p>

                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-gray-900 font-serif tabular-nums">
                    {p.price_cents === 0
                      ? "Free"
                      : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p.price_cents / 100)}
                  </span>
                  {p.price_cents > 0 && <span className="text-xs text-gray-400"> / {p.duration_months} mos</span>}
                </div>

                <ul className="space-y-3 text-xs text-gray-600 mb-8 border-t border-gray-100 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                    <span><strong className="tabular-nums">{p.contact_credits_quota}</strong> Verified Contact Reveals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                    <span>{p.can_initiate_chat ? "Direct Messaging Initiation" : "Reply to Connected Chats Only"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                    <span><strong>{p.priority_boost}x</strong> Recommendation Rank Boost</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{p.can_view_hidden_photos ? "View Protected Photos" : "Standard Photo Visibility"}</span>
                  </li>
                </ul>
              </div>

              <div>
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
                    className="w-full"
                    onClick={() => handleUpgrade(p.id)}
                    isLoading={upgrading === p.id}
                  >
                    Upgrade to {p.name}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
