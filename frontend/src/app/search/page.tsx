"use client";

import { useEffect, useState } from "react";
import { Search, Filter, RotateCcw } from "lucide-react";
import { ProfileCard as ProfileCardType } from "@/types";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api";

export default function SearchPage() {
  const [profiles, setProfiles] = useState<ProfileCardType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [gender, setGender] = useState("");
  const [religion, setReligion] = useState("");
  const [city, setCity] = useState("");
  const [diet, setDiet] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await apiClient<ProfileCardType[]>("/profiles", {
        params: {
          gender: gender || undefined,
          religion: religion || undefined,
          city: city || undefined,
          diet: diet || undefined,
          keyword: keyword || undefined,
          limit: 24,
        },
      });
      setProfiles(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleReset = () => {
    setGender("");
    setReligion("");
    setCity("");
    setDiet("");
    setKeyword("");
    fetchResults();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
          Search Matrimonial Profiles
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Apply fine-grained filters across religion, city, occupation, and lifestyle
        </p>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Genders</option>
              <option value="FEMALE">Female (Bride)</option>
              <option value="MALE">Male (Groom)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Religion</label>
            <select
              value={religion}
              onChange={(e) => setReligion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Religions</option>
              <option value="Hindu">Hindu</option>
              <option value="Muslim">Muslim</option>
              <option value="Christian">Christian</option>
              <option value="Sikh">Sikh</option>
              <option value="Jain">Jain</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">City / Region</label>
            <input
              type="text"
              placeholder="e.g. Bangalore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Diet</label>
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Diets</option>
              <option value="VEGETARIAN">Vegetarian</option>
              <option value="NON_VEGETARIAN">Non-Vegetarian</option>
              <option value="EGGETARIAN">Eggetarian</option>
              <option value="JAIN">Jain Vegetarian</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Keyword (Bio / Job)</label>
            <input
              type="text"
              placeholder="e.g. Architect, CA"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
          <Button variant="primary" size="sm" onClick={fetchResults}>
            <Search className="w-3.5 h-3.5 mr-1" /> Apply Filters
          </Button>
        </div>
      </div>

      {/* Search Results Grid */}
      {loading ? (
        <LoadingSpinner text="Searching verified profiles…" />
      ) : profiles.length === 0 ? (
        <EmptyState
          title="No Matching Profiles Found"
          description="Try broadening your search criteria or resetting filters to see more candidates."
          actionText="Reset Filters"
          actionHref="/search"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}
