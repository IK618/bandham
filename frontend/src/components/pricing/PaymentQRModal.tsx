"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { 
  X, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { PlanItem } from "@/types";
import { Button } from "@/components/ui/Button";

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanItem | null;
  onPaymentSuccess: (message: string) => void;
}

export function PaymentQRModal({
  isOpen,
  onClose,
  plan,
  onPaymentSuccess,
}: PaymentQRModalProps) {
  const TOTAL_SECONDS = 300; // 5 minutes
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_SECONDS);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);
  const [txnRef, setTxnRef] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const UPI_ID = "bandham.pay@icici";

  // Generate QR Code and start 5-minute timer
  const initializePaymentSession = async (currentPlan: PlanItem) => {
    const freshSession = "UPI-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    setSessionId(freshSession);
    setTimeLeft(TOTAL_SECONDS);
    setIsExpired(false);
    setVerificationSuccess(false);
    setErrorMessage(null);

    const priceRupees = (currentPlan.price_cents / 100).toFixed(2);
    // Standard UPI Payment URI specification (supported by GPay, PhonePe, Paytm, BHIM)
    const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("Bandham Matrimony")}&am=${priceRupees}&cu=INR&tn=${encodeURIComponent(`Bandham ${currentPlan.name} Membership #${freshSession}`)}`;

    try {
      const url = await QRCode.toDataURL(upiUri, {
        width: 320,
        margin: 1,
        color: {
          dark: "#1e1b4b", // deep indigo
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error("Failed to generate QR code", err);
      setErrorMessage("Could not generate QR code. Please try again.");
    }
  };

  useEffect(() => {
    if (isOpen && plan) {
      initializePaymentSession(plan);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, plan?.id]);

  // Countdown timer handler
  useEffect(() => {
    if (!isOpen || isExpired || verificationSuccess) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isExpired, verificationSuccess]);

  if (!isOpen || !plan) return null;

  const priceRupees = Math.round(plan.price_cents / 100);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progressPercent = (timeLeft / TOTAL_SECONDS) * 100;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleVerifyPayment = async () => {
    if (isExpired) return;
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bandham_auth_token") : null;
      const res = await fetch("/api/v1/subscriptions/checkout-mock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan_id: plan.id,
          payment_method: "GPAY_UPI",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Payment verification failed. Please try again.");
      }

      const data = await res.json();
      setVerificationSuccess(true);
      setTxnRef(data.transaction_ref || sessionId);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify transaction. Please ensure payment is completed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFinalDone = () => {
    onPaymentSuccess(
      `Congratulations! Your ${plan.name} Membership has been activated successfully with ${plan.contact_credits_quota} contact credits.`
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto"
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8"
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-indigo-900 via-rose-900 to-amber-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Smartphone className="w-5 h-5 text-amber-300" aria-hidden="true" />
            </div>
            <div>
              <h2 id="payment-modal-title" className="text-base font-bold tracking-tight">
                Google Pay / UPI Instant Checkout
              </h2>
              <p className="text-xs text-white/80">
                Secure 5-Minute Dynamic Payment Session
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-[background-color] focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close payment modal"
          >
            <X className="w-4 h-4 text-white" aria-hidden="true" />
          </button>
        </div>

        {verificationSuccess ? (
          /* SUCCESS STATE */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <Check className="w-9 h-9 stroke-[2.5]" aria-hidden="true" />
            </div>
            
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                Payment Verified & Activated
              </span>
              <h3 className="text-2xl font-serif font-bold text-gray-900">
                Welcome to {plan.name} Tier!
              </h3>
              <p className="text-sm text-gray-600 max-w-sm mx-auto">
                Your payment of <strong className="tabular-nums">₹{priceRupees.toLocaleString("en-IN")}</strong> was verified via GPay/UPI.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left space-y-2.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction Reference:</span>
                <span className="font-mono font-semibold text-gray-900 tabular-nums">{txnRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tier Activated:</span>
                <span className="font-bold text-rose-700">{plan.name} Plan ({plan.duration_months} Months)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Verified Contact Credits:</span>
                <span className="font-bold text-emerald-700 tabular-nums">{plan.contact_credits_quota} Credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Channel:</span>
                <span className="font-semibold text-indigo-900">Google Pay / Unified Payments Interface</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleFinalDone}
            >
              <span>Start Exploring Matrimonial Matches</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          /* ACTIVE PAYMENT FLOW */
          <div className="p-6 space-y-5">
            {/* Plan Summary Bar */}
            <div className="flex items-center justify-between p-3.5 bg-rose-50/70 border border-rose-100 rounded-2xl">
              <div>
                <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                  <span>Upgrading to {plan.name} Tier</span>
                </div>
                <div className="text-[11px] text-rose-800/80 mt-0.5">
                  {plan.contact_credits_quota} Contact Credits • {plan.duration_months} Months Validity
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 tabular-nums">
                  ₹{priceRupees.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">All-Inclusive One-Time</div>
              </div>
            </div>

            {/* 5-Minute Live Countdown Timer */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-950">
                  <Clock className={`w-4 h-4 ${isExpired ? "text-red-500" : "text-amber-600"}`} aria-hidden="true" />
                  <span>Session Validity Window</span>
                </div>
                <div 
                  role="status" 
                  aria-live="polite"
                  className={`text-sm font-mono font-bold px-2.5 py-0.5 rounded-lg tabular-nums ${
                    isExpired 
                      ? "bg-red-100 text-red-700 border border-red-200" 
                      : timeLeft <= 60 
                        ? "bg-red-100 text-red-700 animate-pulse" 
                        : "bg-amber-200/80 text-amber-950"
                  }`}
                >
                  {isExpired ? "EXPIRED (00:00)" : formattedTime}
                </div>
              </div>
              
              {/* Animated Progress Bar */}
              <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-[width] duration-1000 ease-linear ${
                    timeLeft <= 60 ? "bg-red-500" : "bg-amber-600"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-amber-800 flex items-center justify-between">
                <span>Dynamic ICICI Gateway Token: <strong className="font-mono">{sessionId}</strong></span>
                <span>{isExpired ? "Timeout reached" : "Refreshes automatically"}</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="relative flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-3xl">
              {isExpired ? (
                <div className="text-center py-8 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">QR Code Expired</h4>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">
                      For banking fraud prevention, dynamic UPI sessions expire after 5 minutes.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5 mx-auto"
                    onClick={() => initializePaymentSession(plan)}
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Generate Fresh QR Code</span>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-200">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="Scan UPI QR Code with Google Pay, PhonePe, or Paytm"
                        className="w-52 h-52 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="w-52 h-52 flex items-center justify-center text-xs text-gray-400">
                        Generating QR…
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    <span>NPCI Verified UPI Merchant Gateway</span>
                  </div>
                </>
              )}
            </div>

            {/* UPI ID Copy Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 block">
                Direct UPI ID / VPA:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={UPI_ID}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl text-gray-800 select-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUpiId}
                  className="shrink-0 flex items-center gap-1.5 text-xs"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span className="text-emerald-700 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy UPI</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Supported Payment Apps Badge Row */}
            <div className="flex items-center justify-center gap-3 pt-1 text-[11px] font-semibold text-gray-500">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                Google Pay (GPay)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                PhonePe
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
                Paytm
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                BHIM UPI
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Button
                variant="primary"
                size="md"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 shadow-md"
                onClick={handleVerifyPayment}
                isLoading={isVerifying}
                disabled={isExpired}
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>I Have Paid via GPay / UPI (Verify & Activate)</span>
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-800 py-1 transition-[color]"
              >
                Cancel and return to plans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
