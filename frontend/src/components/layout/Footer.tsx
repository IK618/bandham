import Link from "next/link";
import { ShieldCheck, Heart, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white">
                <Heart className="w-4 h-4 fill-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-royal font-bold tracking-wider text-white">Bandham</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              An authentic, privacy-first matrimonial community designed for meaningful marriages.
              Zero-tolerance for scams, complete data privacy, and culturally respectful matching.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/matches" className="hover:text-brand-400 transition-colors">Daily Recommendations</Link></li>
              <li><Link href="/search" className="hover:text-brand-400 transition-colors">Faceted Search</Link></li>
              <li><Link href="/pricing" className="hover:text-brand-400 transition-colors">Membership Plans</Link></li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Trust & Safety</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/settings" className="hover:text-brand-400 transition-colors">Privacy Settings & GDPR</Link></li>
              <li><Link href="/pricing" className="hover:text-brand-400 transition-colors">Subscription Tiers</Link></li>
            </ul>
          </div>

          {/* Grievance & Support */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Help & Grievance</h3>
            <p className="text-xs text-gray-400 mb-2">
              Statutory Grievance Officer available per Digital Personal Data Protection standards.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Lock className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>256-bit Encrypted SSL Communication</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300 mt-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" aria-hidden="true" />
              <span>100% Verified Mobile Members</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2026 Bandham Matrimonial Platform. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Designed with integrity for sacred matrimonial unions.</p>
        </div>
      </div>
    </footer>
  );
}
