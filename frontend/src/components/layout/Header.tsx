"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Search, MessageSquare, Shield, Menu, X, Sparkles, LogOut } from "lucide-react";
import { apiClient } from "@/lib/api";

interface UserProfilePreview {
  first_name: string;
  profile_id: string;
  role: string;
  isAdmin: boolean;
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfilePreview | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        // 1. Check account authentication and role
        const me = await apiClient<any>("/auth/me");
        if (me && me.role) {
          const isStaff = me.role === "ADMIN" || me.role === "MODERATOR";

          if (isStaff) {
            setCurrentUser({
              first_name: me.role === "ADMIN" ? "Admin" : "Moderator",
              profile_id: me.role,
              role: me.role,
              isAdmin: true,
            });
            return;
          }

          // 2. Member account: fetch member profile
          try {
            const prof = await apiClient<any>("/profiles/me");
            if (prof && prof.first_name) {
              setCurrentUser({
                first_name: prof.first_name,
                profile_id: prof.profile_id_display || "",
                role: "MEMBER",
                isAdmin: false,
              });
            } else {
              setCurrentUser({
                first_name: "Member",
                profile_id: "",
                role: "MEMBER",
                isAdmin: false,
              });
            }
          } catch {
            setCurrentUser({
              first_name: "Member",
              profile_id: "",
              role: "MEMBER",
              isAdmin: false,
            });
          }
        }
      } catch (e) {
        // Unauthenticated visitor
        setCurrentUser(null);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch (e) {
      // Ignore
    }
    setCurrentUser(null);
    window.location.href = "/login";
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-700 via-rose-600 to-amber-600 bg-clip-text text-transparent font-royal">
                Bandham
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-[10px] font-bold text-rose-700 uppercase tracking-[0.2em] px-2 py-0.5 bg-rose-50 rounded-full border border-rose-200">
                Matrimony
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {currentUser?.isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="text-sm font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300 flex items-center gap-1.5 transition-colors"
                >
                  <Shield className="w-4 h-4 text-amber-600" />
                  Trust &amp; Safety Portal
                </Link>
                <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-brand-600 flex items-center gap-1.5 transition-colors">
                  <Search className="w-4 h-4" />
                  Browse Profiles
                </Link>
                <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                  Monetization Plans
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                  Dashboard
                </Link>
                <Link href="/matches" className="text-sm font-medium text-gray-700 hover:text-brand-600 flex items-center gap-1.5 transition-colors">
                  <Sparkles className="w-4 h-4 text-gold-500" />
                  Today&apos;s Matches
                </Link>
                <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-brand-600 flex items-center gap-1.5 transition-colors">
                  <Search className="w-4 h-4" />
                  Search
                </Link>
                <Link href="/inbox" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                  Inbox
                </Link>
                <Link href="/chat" className="text-sm font-medium text-gray-700 hover:text-brand-600 flex items-center gap-1.5 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </Link>
                <Link href="/pricing" className="text-sm font-semibold text-gold-600 hover:text-gold-700 bg-gold-50 px-3 py-1 rounded-full border border-gold-200 transition-colors">
                  Upgrade Plans
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Icons & Auth Profile Menu */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={currentUser?.isAdmin ? "/admin" : "/settings"}
              className="p-2 text-gray-500 hover:text-brand-600 hover:bg-rose-50 rounded-full transition-colors"
              title={currentUser?.isAdmin ? "Admin Console" : "Settings & Privacy"}
            >
              <Shield className="w-5 h-5" />
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href={currentUser.isAdmin ? "/admin" : "/dashboard"}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                    currentUser.isAdmin
                      ? "bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
                      : "bg-rose-50 border-rose-200 text-brand-900 hover:bg-rose-100"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full font-serif font-bold text-xs flex items-center justify-center ${
                      currentUser.isAdmin ? "bg-amber-500 text-slate-900" : "bg-brand-600 text-white"
                    }`}
                  >
                    {currentUser.first_name?.[0] || "U"}
                  </div>
                  <span className="text-xs font-semibold">{currentUser.first_name}</span>
                  {currentUser.isAdmin && (
                    <span className="text-[10px] uppercase font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full ml-1">
                      {currentUser.role}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
                  title="Log out of Bandham"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-brand-600 px-3 py-2">
                  Login
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all">
                  Register Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-brand-600 hover:bg-rose-50"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-rose-100 bg-white px-4 pt-2 pb-6 space-y-3">
          {currentUser?.isAdmin ? (
            <>
              <Link href="/admin" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-bold text-amber-800 bg-amber-50">
                🛡️ Trust &amp; Safety Portal
              </Link>
              <Link href="/search" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
                Browse Profiles
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
                Dashboard
              </Link>
              <Link href="/matches" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
                Today&apos;s Matches
              </Link>
              <Link href="/search" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
                Search Profiles
              </Link>
              <Link href="/inbox" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
                Inbox &amp; Connections
              </Link>
              <Link href="/chat" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
                Messages
              </Link>
            </>
          )}

          <Link href="/pricing" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gold-600 hover:bg-gold-50">
            Membership Plans
          </Link>

          <div className="pt-4 border-t border-gray-100">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-1">
                  <div
                    className={`w-7 h-7 rounded-full font-serif font-bold text-xs flex items-center justify-center ${
                      currentUser.isAdmin ? "bg-amber-500 text-slate-900" : "bg-brand-600 text-white"
                    }`}
                  >
                    {currentUser.first_name?.[0] || "U"}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-900 block">{currentUser.first_name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{currentUser.profile_id}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    closeMenu();
                    handleLogout();
                  }}
                  className="w-full text-center px-4 py-2 border border-red-200 rounded-full text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" onClick={closeMenu} className="block w-full text-center px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Login
                </Link>
                <Link href="/register" onClick={closeMenu} className="block w-full text-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700">
                  Register Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
