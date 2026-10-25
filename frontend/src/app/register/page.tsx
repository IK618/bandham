"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
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
      await apiClient("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          phone_number: phoneNumber,
          otp_code: otpCode.trim(),
        }),
      });
      window.location.href = "/dashboard";
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
            {step === "FORM" ? "Begin Your Matrimonial Journey" : "Verify Mobile Phone Number"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {step === "FORM"
              ? "Join 100% verified marriage-minded members and authentic families"
              : `Enter the 6-digit OTP code sent to ${phoneNumber}`}
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">This Profile is Created For</label>
              <select
                value={profileFor}
                onChange={(e) => setProfileFor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
              >
                <option value="SELF">Self (Myself)</option>
                <option value="PARENT">Son / Daughter (Parent)</option>
                <option value="SIBLING">Brother / Sister (Sibling)</option>
                <option value="RELATIVE">Relative / Friend</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Ananya"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Sharma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender("FEMALE")}
                  className={`py-2 text-xs font-medium rounded-xl border text-center ${gender === "FEMALE" ? "bg-rose-50 border-brand-500 text-brand-700 font-bold" : "border-gray-200 text-gray-600"}`}
                >
                  Female (Bride)
                </button>
                <button
                  type="button"
                  onClick={() => setGender("MALE")}
                  className={`py-2 text-xs font-medium rounded-xl border text-center ${gender === "MALE" ? "bg-rose-50 border-brand-500 text-brand-700 font-bold" : "border-gray-200 text-gray-600"}`}
                >
                  Male (Groom)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Phone (with Country Code)</label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Set Account Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
              Continue to Phone Verification <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6 text-sm">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-800">
                A 6-digit verification code has been dispatched. (In development mode, enter code <strong>123456</strong>).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-4 py-3 text-center tracking-widest text-2xl font-mono font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
              Verify &amp; Enter Dashboard <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          </form>
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
