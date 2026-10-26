"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"FORM" | "OTP" | "AWAITING_APPROVAL">("FORM");
  const [profileFor, setProfileFor] = useState("SELF");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("FEMALE");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("123456");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    const formattedPhone = cleanPhone.startsWith("+")
      ? cleanPhone
      : cleanPhone.length === 10
      ? `+91${cleanPhone}`
      : `+${cleanPhone}`;

    try {
      await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          profile_for: profileFor,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          gender: gender,
          email: email.trim().toLowerCase(),
          phone_number: formattedPhone,
          password: password,
        }),
      });
      setPhoneNumber(formattedPhone);
      // Transition to OTP verification step
      setStep("OTP");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient<any>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          phone_number: phoneNumber,
          otp_code: otpCode.trim(),
        }),
      });
      if (res?.status === "PENDING_APPROVAL" || !res?.access_token) {
        setStep("AWAITING_APPROVAL");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP code. Please enter 123456.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-rose-100 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-gray-900 tracking-tight">
            {step === "FORM"
              ? "Begin Your Matrimonial Journey"
              : step === "OTP"
              ? "Verify Mobile Phone Number"
              : "Proposal Awaiting Approval"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {step === "FORM"
              ? "Join 100% verified marriage-minded members and authentic families"
              : step === "OTP"
              ? `Enter the 6-digit OTP code sent to ${phoneNumber}`
              : "Your registration has been received and queued for Trust & Governance review"}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {step === "FORM" ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-sm">
            <div>
              <label htmlFor="profileFor" className="block text-xs font-semibold text-gray-700 mb-1">This Profile is Created For</label>
              <select
                id="profileFor"
                name="profileFor"
                value={profileFor}
                onChange={(e) => setProfileFor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white text-gray-900"
              >
                <option value="SELF">Self (Myself)</option>
                <option value="PARENT">Son / Daughter (Parent)</option>
                <option value="SIBLING">Brother / Sister (Sibling)</option>
                <option value="RELATIVE">Relative / Friend</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Ananya…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Sharma…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-700 mb-1">Gender</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender("FEMALE")}
                  className={`py-2 text-xs font-medium rounded-xl border text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${gender === "FEMALE" ? "bg-rose-50 border-brand-500 text-brand-700 font-bold" : "border-gray-200 text-gray-600"}`}
                >
                  Female (Bride)
                </button>
                <button
                  type="button"
                  onClick={() => setGender("MALE")}
                  className={`py-2 text-xs font-medium rounded-xl border text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${gender === "MALE" ? "bg-rose-50 border-brand-500 text-brand-700 font-bold" : "border-gray-200 text-gray-600"}`}
                >
                  Male (Groom)
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya@example.com…"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-xs font-semibold text-gray-700 mb-1">Mobile Phone (with Country Code)</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+919876543210…"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">Set Account Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters…"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
              Continue to Phone Verification <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </form>
        ) : step === "OTP" ? (
          <form onSubmit={handleOtpSubmit} className="space-y-6 text-sm">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" aria-hidden="true" />
              <p className="text-xs text-emerald-800">
                A 6-digit verification code has been dispatched. (In development mode, enter code <strong>123456</strong>).
              </p>
            </div>

            <div>
              <label htmlFor="otpCode" className="block text-xs font-semibold text-gray-700 mb-1">6-Digit Verification Code</label>
              <input
                id="otpCode"
                name="otpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-4 py-3 text-center tracking-widest text-2xl font-mono font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
              Verify Phone Number <CheckCircle2 className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </form>
        ) : (
          <div className="space-y-6 text-sm text-center">
            <div className="p-6 bg-amber-50/90 border border-amber-200 rounded-3xl space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-8 h-8 text-amber-600" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-amber-950 font-serif">
                Membership Application Submitted!
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                Your phone number <strong>{phoneNumber}</strong> is verified. To protect families and maintain community trust, new member accounts require review and activation by our Trust &amp; Governance committee.
              </p>
              <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 text-left space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span>🔒 Account Gated Until Administrator Approval</span>
                </p>
                <p className="text-amber-800">
                  You will be able to log in to your dashboard once an Administrator approves your proposal.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/login" className="block">
                <Button variant="primary" size="lg" className="w-full">
                  Check Approval Status at Sign In <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Button>
              </Link>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 flex items-center justify-between">
                <span>Demo Admin Reviewer?</span>
                <Link href="/admin" className="text-brand-600 font-bold underline hover:text-brand-700">
                  Open Admin Command Center
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          Already registered on Bandham?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
