import Link from "next/link";
import { Heart, ShieldCheck, Lock, Sparkles, Users, Award, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50 via-white to-slate-50 pt-16 pb-24 border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100/80 border border-rose-200 text-brand-800 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                <span>The Privacy-First Matrimonial Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-gray-900 tracking-tight leading-[1.15]">
                Where sacred unions begin with{" "}
                <span className="bg-gradient-to-r from-brand-600 via-rose-600 to-amber-600 bg-clip-text text-transparent">
                  honor &amp; verified trust.
                </span>
              </h1>

              <p className="text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Connect with marriage-minded professionals and authentic families. 
                Enjoy zero telemarketing spam, dynamic photo privacy, and intelligent compatibility matching.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/register">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Create Free Profile <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Explore Matches
                  </Button>
                </Link>
              </div>

              {/* Trust Metrics Pill */}
              <div className="pt-6 border-t border-rose-100 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <p className="text-2xl font-bold text-gray-900 font-serif">500+</p>
                  <p className="text-xs text-gray-500">Verified Profiles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 font-serif">100%</p>
                  <p className="text-xs text-gray-500">Phone Verified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 font-serif">Zero</p>
                  <p className="text-xs text-gray-500">Spam Guarantee</p>
                </div>
              </div>
            </div>

            {/* Right Card Widget: Quick Match Finder */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-rose-100 shadow-xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-brand-600">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 font-serif">Find Your Ideal Match</h2>
                    <p className="text-xs text-gray-500">Search verified profiles across India &amp; Diaspora</p>
                  </div>
                </div>

                <form action="/search" method="GET" className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Looking For</label>
                    <select name="gender" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500">
                      <option value="FEMALE">A Bride (Female)</option>
                      <option value="MALE">A Groom (Male)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Religion</label>
                      <select name="religion" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500">
                        <option value="">Any Religion</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Christian">Christian</option>
                        <option value="Sikh">Sikh</option>
                        <option value="Jain">Jain</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Mother Tongue</label>
                      <select name="mother_tongue" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500">
                        <option value="">Any Language</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Telugu">Telugu</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Kannada">Kannada</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City or State</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="e.g. Bangalore, Mumbai, Delhi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="lg" className="w-full">
                    Search Profiles
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Differentiators Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-serif font-bold text-gray-900">
            Why Discerning Families Choose Bandham
          </h2>
          <p className="text-base text-gray-600">
            Engineered from first principles to prioritize dignity, safety, and mutual compatibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:border-rose-200 transition-colors">
            <div className="w-12 h-12 bg-rose-50 text-brand-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-serif text-gray-900">100% Mobile &amp; ID Verified</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every member verifies their telephone via dual-channel OTP, and profiles feature verified Government ID badges to eliminate catfish accounts.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:border-rose-200 transition-colors">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-serif text-gray-900">Dynamic Photo &amp; PII Privacy</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your photographs are protected with custom watermarking and optional Gaussian blurring. Phone numbers are never exposed to scrapers.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:border-rose-200 transition-colors">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-serif text-gray-900">Weighted Matching Engine</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Transparent compatibility scoring evaluated across age, education, career, lifestyle, and family values with full category breakdowns.
            </p>
          </div>
        </div>
      </section>

      {/* Verified Success Stories */}
      <section className="bg-gradient-to-tr from-rose-50 to-amber-50/50 py-16 border-y border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-serif font-bold text-gray-900">Recent Matrimonial Unions</h2>
            <p className="text-sm text-gray-600 mt-2">Real couples who met through Bandham&apos;s verified matching</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center font-serif font-bold text-brand-800">
                  R &amp; P
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 font-serif">Rohan &amp; Priya (Bengaluru)</h3>
                  <p className="text-xs text-gray-500">Married in February 2025</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">
                &ldquo;Bandham was refreshing because neither of us received aggressive telemarketing calls. We connected over our mutual love for Hindustani music and tech careers, and our families met within two months.&rdquo;
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center font-serif font-bold text-amber-900">
                  A &amp; S
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 font-serif">Ananya &amp; Siddharth (Mumbai)</h3>
                  <p className="text-xs text-gray-500">Married in November 2024</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">
                &ldquo;The photo blur and contact reveal verification gave my parents immense confidence. It felt dignified, modern, and genuinely focused on long-term compatibility.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
