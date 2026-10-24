"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Search, MessageSquare, Bell, User as UserIcon, Shield, Menu, X, Sparkles } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-700 to-rose-600 bg-clip-text text-transparent font-serif">
                Bandhan
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-xs font-medium text-rose-500 uppercase tracking-widest">
                Matrimony
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/matches" className="text-sm font-medium text-gray-700 hover:text-brand-600 flex items-center gap-1.5 transition-colors">
              <Sparkles className="w-4 h-4 text-gold-500" />
              Today's Matches
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
          </nav>

          {/* Right Action Icons & Profile Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/settings" className="p-2 text-gray-500 hover:text-brand-600 hover:bg-rose-50 rounded-full transition-colors" title="Settings & Privacy">
              <Shield className="w-5 h-5" />
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-brand-600 px-3 py-2">
              Login
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all">
              Register Free
            </Link>
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
          <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
            Dashboard
          </Link>
          <Link href="/matches" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
            Today's Matches
          </Link>
          <Link href="/search" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
            Search Directory
          </Link>
          <Link href="/inbox" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
            Inbox & Interests
          </Link>
          <Link href="/chat" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-rose-50 hover:text-brand-600">
            Chat Messenger
          </Link>
          <Link href="/pricing" className="block px-3 py-2 rounded-md text-base font-semibold text-gold-700 bg-gold-50">
            Membership Plans
          </Link>
          <div className="pt-4 border-t border-gray-100 flex gap-2">
            <Link href="/login" className="flex-1 text-center py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md">
              Login
            </Link>
            <Link href="/register" className="flex-1 text-center py-2 text-sm font-medium text-white bg-brand-600 rounded-md">
              Register Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
