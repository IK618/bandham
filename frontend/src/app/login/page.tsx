"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillCredentials = (email: string, pass: string) => {
    setEmailOrPhone(email);
    setPassword(pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email_or_phone: emailOrPhone,
          password: password,
        }),
      });
      // Route admin/moderator staff to trust center, and members to matchmaking dashboard
      if (res?.role === "ADMIN" || res?.role === "MODERATOR") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email/phone and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-rose-100 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-bold font-royal text-gray-900 tracking-tight">
            Welcome Back to Bandham
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Sign in to check today&apos;s matches and reply to incoming interests
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Registered Email or Phone Number
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="ananya@bandham.local or +919876543210"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
            Sign In Securely <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-3">
          <div className="text-center">
            <p>
              Don&apos;t have a profile yet?{" "}
              <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700 underline">
                Register Free
              </Link>
            </p>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
            <p className="text-[11px] font-semibold text-amber-900 tracking-wide uppercase text-center">
              Quick One-Click Demo Logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("ananya@bandham.local", "Ananya@12345")}
                className="py-1.5 px-2 bg-white rounded-lg border border-amber-200 text-[11px] font-medium text-amber-900 hover:bg-amber-100/50 hover:border-amber-300 transition-colors shadow-sm text-center"
              >
                👰 Member
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("admin@bandham.local", "Admin@12345")}
                className="py-1.5 px-2 bg-white rounded-lg border border-amber-200 text-[11px] font-medium text-amber-900 hover:bg-amber-100/50 hover:border-amber-300 transition-colors shadow-sm text-center"
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("moderator@bandham.local", "Moderator@12345")}
                className="py-1.5 px-2 bg-white rounded-lg border border-amber-200 text-[11px] font-medium text-amber-900 hover:bg-amber-100/50 hover:border-amber-300 transition-colors shadow-sm text-center"
              >
                ⚖️ Moderator
              </button>
            </div>
            <p className="text-[10px] text-amber-700 text-center">
              Click any role above to pre-fill verified credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
