"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, RotateCcw } from "lucide-react";
import { ProfileCard as ProfileCardType } from "@/types";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<ProfileCardType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States initialized from URL params if present
  const [gender, setGender] = useState("");
  const [religion, setReligion] = useState("");
  const [city, setCity] = useState("");
  const [diet, setDiet] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchResults = async (customFilters?: {
    gender?: string;
    religion?: string;
    city?: string;
    diet?: string;
    keyword?: string;
  }) => {
    setLoading(true);
    try {
      const g = customFilters?.gender !== undefined ? customFilters.gender : gender;
      const r = customFilters?.religion !== undefined ? customFilters.religion : religion;
      const c = customFilters?.city !== undefined ? customFilters.city : city;
      const d = customFilters?.diet !== undefined ? customFilters.diet : diet;
      const k = customFilters?.keyword !== undefined ? customFilters.keyword : keyword;

      const data = await apiClient<ProfileCardType[]>("/profiles", {
        params: {
          gender: g || undefined,
          religion: r || undefined,
          city: c || undefined,
          diet: d || undefined,
          keyword: k || undefined,
          limit: 24,
        },
      });
      setProfiles(data);
    } catch (err: any) {
      console.error("Search query failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Hydrate filters from URL search params on mount or when params change
  useEffect(() => {
    const urlGender = searchParams.get("gender") || "";
    const urlReligion = searchParams.get("religion") || "";
    const urlCity = searchParams.get("city") || "";
    const urlDiet = searchParams.get("diet") || "";
    const urlKeyword = searchParams.get("keyword") || searchParams.get("mother_tongue") || "";

    setGender(urlGender);
    setReligion(urlReligion);
    setCity(urlCity);
    setDiet(urlDiet);
    setKeyword(urlKeyword);

    fetchResults({
      gender: urlGender,
      religion: urlReligion,
      city: urlCity,
      diet: urlDiet,
      keyword: urlKeyword,
    });
  }, [searchParams]);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = new URLSearchParams();
    if (gender) query.set("gender", gender);
    if (religion) query.set("religion", religion);
    if (city) query.set("city", city);
    if (diet) query.set("diet", diet);
    if (keyword) query.set("keyword", keyword);

    const queryString = query.toString();
    router.replace(queryString ? `/search?${queryString}` : "/search");
    fetchResults();
  };

  const handleReset = () => {
    setGender("");
    setReligion("");
    setCity("");
    setDiet("");
    setKeyword("");
    router.replace("/search");
    fetchResults({
      gender: "",
      religion: "",
      city: "",
      diet: "",
      keyword: "",
    });
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

      {/* Filter Control Form */}
      <form onSubmit={handleApplyFilters} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label htmlFor="genderFilter" className="block font-semibold text-gray-700 mb-1">Gender</label>
            <select
              id="genderFilter"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white text-gray-900"
            >
              <option value="">All Genders</option>
              <option value="FEMALE">Female (Bride)</option>
              <option value="MALE">Male (Groom)</option>
            </select>
          </div>

          <div>
            <label htmlFor="religionFilter" className="block font-semibold text-gray-700 mb-1">Religion</label>
            <select
              id="religionFilter"
              name="religion"
              value={religion}
              onChange={(e) => setReligion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white text-gray-900"
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
            <label htmlFor="cityFilter" className="block font-semibold text-gray-700 mb-1">City / Region</label>
            <input
              id="cityFilter"
              name="city"
              type="text"
              placeholder="e.g. Bangalore, Mumbai…"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="dietFilter" className="block font-semibold text-gray-700 mb-1">Diet</label>
            <select
              id="dietFilter"
              name="diet"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white text-gray-900"
            >
              <option value="">All Diets</option>
              <option value="VEGETARIAN">Vegetarian</option>
              <option value="NON_VEGETARIAN">Non-Vegetarian</option>
              <option value="EGGETARIAN">Eggetarian</option>
              <option value="JAIN">Jain Vegetarian</option>
            </select>
          </div>

          <div>
            <label htmlFor="keywordFilter" className="block font-semibold text-gray-700 mb-1">Keyword (Bio / Job)</label>
            <input
              id="keywordFilter"
              name="keyword"
              type="text"
              placeholder="e.g. Architect, CA, Tech…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Reset
          </Button>
          <Button type="submit" variant="primary" size="sm">
            <Search className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Apply Filters
          </Button>
        </div>
      </form>

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

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading search directory…" />}>
      <SearchContent />
    </Suspense>
  );
}
