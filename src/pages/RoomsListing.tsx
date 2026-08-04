import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";

import { RoomCard } from "../components/RoomCard";
import { FilterSidebar } from "../components/FilterSidebar";
import { VirtualizedGrid } from "../components/VirtualizedGrid";
import { PullToRefreshIndicator } from "../components/PullToRefreshIndicator";
import { usePropertyListings } from "../hooks/usePropertyListings";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import type { GenderPreference, RoomFilters } from "../types/api.types";

/* ─────────────────────────────────────────────
   GOLD TOKENS  (inline because Tailwind can't
   handle runtime RGBA in arbitrary syntax)
───────────────────────────────────────────── */
const GOLD = "rgba(212,175,55,0.9)";
const GOLD_DIM = "rgba(212,175,55,0.55)";
const GOLD_BG = "rgba(212,175,55,0.08)";
const GOLD_BORDER = "rgba(212,175,55,0.22)";
const DARK_BASE = "#0d0b06";

/* ─────────────────────────────────────────────
   FILTER CHIP
───────────────────────────────────────────── */
const Chip = memo(function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-95"
      style={{
        background: GOLD_BG,
        border: `1px solid ${GOLD_BORDER}`,
        color: GOLD,
      }}
    >
      {label}
      <span className="flex h-3 w-3 items-center justify-center rounded-full transition-colors group-hover:bg-white/10">
        <X className="h-2 w-2" />
      </span>
    </button>
  );
});

const FilterChips = memo(function FilterChips({
  appliedFilters,
  onRemoveFilter,
}: any) {
  const hasFilters =
    appliedFilters.city ||
    appliedFilters.areaIds?.length > 0 ||
    appliedFilters.areaId ||
    appliedFilters.location ||
    appliedFilters.q ||
    appliedFilters.minPrice ||
    appliedFilters.maxPrice ||
    appliedFilters.roomType ||
    appliedFilters.roomTypes?.length > 0 ||
    (appliedFilters.genderPreference &&
      appliedFilters.genderPreference !== "ANY") ||
    appliedFilters.idealFor?.length > 0;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="text-[9px] font-bold uppercase tracking-[0.14em] mr-0.5"
        style={{ color: GOLD_DIM }}
      >
        Active:
      </span>
      {appliedFilters.city && (
        <Chip
          label={`📍 ${appliedFilters.city}`}
          onRemove={() => onRemoveFilter("city")}
        />
      )}
      {appliedFilters.areaIds?.length > 0 && (
        <Chip
          label={`🏘️ ${appliedFilters.areaIds.length} area${appliedFilters.areaIds.length !== 1 ? "s" : ""}`}
          onRemove={() => onRemoveFilter("areaIds")}
        />
      )}
      {(appliedFilters.areaId || appliedFilters.location) && !appliedFilters.areaIds?.length && (
        <Chip
          label={`🏘️ ${appliedFilters.location || "Area"}`}
          onRemove={() => onRemoveFilter("location")}
        />
      )}
      {appliedFilters.q && (
        <Chip
          label={`Search: ${appliedFilters.q}`}
          onRemove={() => onRemoveFilter("q")}
        />
      )}
      {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
        <Chip
          label={`₹${appliedFilters.minPrice || 0}–₹${
            appliedFilters.maxPrice || "∞"
          }`}
          onRemove={() => onRemoveFilter("price")}
        />
      )}
      {appliedFilters.roomType && (
        <Chip
          label={appliedFilters.roomType}
          onRemove={() => onRemoveFilter("roomType")}
        />
      )}
      {appliedFilters.roomTypes?.length > 0 && (
        <Chip
          label={appliedFilters.roomTypes.join(", ")}
          onRemove={() => onRemoveFilter("roomTypes")}
        />
      )}
      {appliedFilters.genderPreference &&
        appliedFilters.genderPreference !== "ANY" && (
          <Chip
            label={
              appliedFilters.genderPreference === "MALE_ONLY"
                ? "Boys Only"
                : "Girls Only"
            }
            onRemove={() => onRemoveFilter("genderPreference")}
          />
        )}
      {appliedFilters.idealFor?.length > 0 && (
        <Chip
          label={`For: ${appliedFilters.idealFor.join(", ")}`}
          onRemove={() => onRemoveFilter("idealFor")}
        />
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/[0.05] bg-white dark:bg-[#111009] animate-pulse">
      <div className="aspect-[16/10] bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800/60 dark:to-slate-900/40" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-800/70" />
        <div className="h-4 w-4/5 rounded-full bg-slate-200 dark:bg-slate-800/70" />
        <div className="h-3 w-1/2 rounded-full bg-slate-200 dark:bg-slate-800/70" />
        <div className="h-8 w-full rounded-xl bg-slate-100 dark:bg-slate-800/40 mt-4" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MOBILE FILTER DRAWER  (slides up from bottom)
───────────────────────────────────────────── */
function MobileFilterDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-3xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          background: "rgba(248,246,241,0.97)",
          backdropFilter: "blur(20px)",
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
          borderTop: `1px solid ${GOLD_BORDER}`,
          boxShadow: "0 -20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Dark-mode bg */}
        <div
          className="dark:block hidden absolute inset-0 rounded-t-3xl pointer-events-none"
          style={{ background: "rgba(13,11,6,0.97)" }}
        />
        {/* Handle */}
        <div className="relative flex justify-center pt-3 pb-1 flex-shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: GOLD_BORDER }}
          />
        </div>
        {/* Header row */}
        <div className="relative flex items-center justify-between px-5 pb-3 flex-shrink-0">
          <span
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}
          >
            Filters
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close filters"
          >
            <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        {/* Scrollable filter content */}
        <div className="relative flex-1 overflow-y-auto px-5 pb-6">
          {children}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   SORT OPTIONS
───────────────────────────────────────────── */
const sortOptions = [
  { value: "latest", label: "Latest" },
  { value: "most_viewed", label: "Most Viewed" },
  { value: "most_contacted", label: "Most Contacted" },
  { value: "price_high", label: "High Price ↑" },
  { value: "price_low", label: "Low Price ↓" },
];

/* ─────────────────────────────────────────────
   HEADER HEIGHT CONSTANT
   Keep in sync with the <header> rendered height.
   Used by: sticky sidebar top offset + VirtualizedGrid scrollMargin.
───────────────────────────────────────────── */
const HEADER_H = 69; // px — measure once and set here

const isGenderPreference = (value: string): value is GenderPreference =>
  value === "ANY" || value === "MALE_ONLY" || value === "FEMALE_ONLY";

/* ─────────────────────────────────────────────
   MAIN
───────────────────────────────────────────── */
export function RoomsListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  /* ── Responsive columns ── */
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setWindowWidth(window.innerWidth), 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const columns = useMemo(() => {
    if (windowWidth < 480) return 1; // xs  — single column, full width
    if (windowWidth < 768) return 2; // sm  — 2 col
    if (windowWidth < 1024) return 2; // md  — 2 col (no sidebar)
    if (windowWidth < 1280) return 3; // lg  — sidebar + 3 col
    return 4; // xl+ — sidebar + 4 col
  }, [windowWidth]);

  const estimateSize = useMemo(() => {
    if (columns === 1) return 400;
    if (columns === 2) return 420;
    if (columns === 3) return 430;
    return 440;
  }, [columns]);

  /* ── Helpers ── */
  const getFiltersFromURL = useCallback(() => {
    const roomTypesParam = searchParams.get("roomTypes") || "";
    const idealForParam = searchParams.get("idealFor") || "";
    const areaIdsParam = searchParams.get("areaIds") || "";
    return {
      city: searchParams.get("city") || "",
      areaId: searchParams.get("areaId") || "",
      areaIds: areaIdsParam ? areaIdsParam.split(",").filter(Boolean) : [],
      location: searchParams.get("location") || "",
      q: searchParams.get("q") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      roomType: searchParams.get("roomType") || "",
      roomTypes: roomTypesParam
        ? roomTypesParam.split(",").filter(Boolean)
        : [],
      genderPreference: searchParams.get("genderPreference") || "",
      idealFor: idealForParam ? idealForParam.split(",").filter(Boolean) : [],
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(() => getFiltersFromURL());
  const [appliedFilters, setAppliedFilters] = useState(() =>
    getFiltersFromURL(),
  );
  const [searchText, setSearchText] = useState(() => getFiltersFromURL().q);
  const [sortBy, setSortBy] = useState(
    () => searchParams.get("sort") || "latest",
  );
  const PAGE_LIMIT = 10;

  const baseFilters = useMemo<RoomFilters>(
    () => ({
      city: appliedFilters.city || undefined,
      areaId: appliedFilters.areaId || undefined,
      areaIds: appliedFilters.areaIds?.length ? appliedFilters.areaIds : undefined,
      location: appliedFilters.areaId ? undefined : appliedFilters.location || undefined,
      q: appliedFilters.q || undefined,
      minPrice: appliedFilters.minPrice || undefined,
      maxPrice: appliedFilters.maxPrice || undefined,
      roomType: appliedFilters.roomType || undefined,
      roomTypes: appliedFilters.roomTypes?.length
        ? appliedFilters.roomTypes
        : undefined,
      genderPreference:
        isGenderPreference(appliedFilters.genderPreference) &&
        appliedFilters.genderPreference !== "ANY"
          ? appliedFilters.genderPreference
          : undefined,
      idealFor: appliedFilters.idealFor?.length
        ? appliedFilters.idealFor
        : undefined,
      sort: sortBy,
      limit: PAGE_LIMIT,
    }),
    [
      appliedFilters.city,
      appliedFilters.areaId,
      appliedFilters.areaIds,
      appliedFilters.location,
      appliedFilters.q,
      appliedFilters.minPrice,
      appliedFilters.maxPrice,
      appliedFilters.roomType,
      appliedFilters.roomTypes,
      appliedFilters.genderPreference,
      appliedFilters.idealFor,
      sortBy,
    ],
  );

  const filterKey = useMemo(
    () => JSON.stringify({ ...appliedFilters, sort: sortBy }),
    [appliedFilters, sortBy],
  );

  const {
    items,
    total,
    hasNextPage,
    isPending,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = usePropertyListings({ filters: baseFilters, pageSize: PAGE_LIMIT }) as {
    items: import("../types/api.types").Room[];
    total: number;
    hasNextPage: boolean;
    isPending: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<unknown>;
    refetch: () => Promise<unknown>;
  };

  

  /* ── Handlers ── */
  const handleApplyFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setAppliedFilters(newFilters);
    setIsFilterOpen(false);
    setSearchText(newFilters.q || "");
  }, []);

  const handleSearchSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    const value = searchText.trim();
    const patch = (prev: any) => ({ ...prev, q: value });
    setFilters(patch);
    setAppliedFilters(patch);
  }, [searchText]);

  const handleRemoveFilter = useCallback((key: string) => {
    if (key === "q") {
      setSearchText("");
    }
    const patch = (prev: any) => {
      const u = { ...prev };
      if (key === "price") {
        u.minPrice = "";
        u.maxPrice = "";
      } else if (key === "roomTypes") u.roomTypes = [];
      else if (key === "idealFor") u.idealFor = [];
      else if (key === "location") {
        u.location = "";
        u.areaId = "";
      }
      else if (key === "areaIds") {
        u.areaIds = [];
        u.areaId = "";
        u.location = "";
      }
      else if (key === "q") {
        u.q = "";
      }
      else u[key] = "";
      return u;
    };
    setAppliedFilters(patch);
    setFilters(patch);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
  }, []);

  /* ── Sync URL ── */
  useEffect(() => {
    const p = new URLSearchParams();
    if (appliedFilters.city) p.set("city", appliedFilters.city);
    if (appliedFilters.areaId) p.set("areaId", appliedFilters.areaId);
    if (appliedFilters.location) p.set("location", appliedFilters.location);
    if (appliedFilters.q) p.set("q", appliedFilters.q);
    if (appliedFilters.minPrice) p.set("minPrice", appliedFilters.minPrice);
    if (appliedFilters.maxPrice) p.set("maxPrice", appliedFilters.maxPrice);
    if (appliedFilters.roomType) p.set("roomType", appliedFilters.roomType);
    if (appliedFilters.roomTypes?.length)
      p.set("roomTypes", appliedFilters.roomTypes.join(","));
    if (
      appliedFilters.genderPreference &&
      appliedFilters.genderPreference !== "ANY"
    )
      p.set("genderPreference", appliedFilters.genderPreference);
    if (appliedFilters.idealFor?.length)
      p.set("idealFor", appliedFilters.idealFor.join(","));
    if (sortBy !== "latest") p.set("sort", sortBy);
    setSearchParams(p);
  }, [appliedFilters, sortBy, setSearchParams]);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const { ref: sentinelRef } = useIntersectionObserver({
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
    onVisible: handleLoadMore,
    rootMargin: "220px 0px 220px 0px",
    threshold: 0.1,
  });

  const refreshRooms = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /* ── Derived ── */
  const isInitialLoading = isPending && items.length === 0;
  const isEmpty = !isInitialLoading && items.length === 0;

  /* ── Active filter count for mobile badge ── */
  const activeFilterCount = [
    appliedFilters.city,
    appliedFilters.areaIds?.length,
    appliedFilters.areaId || appliedFilters.location,
    appliedFilters.q,
    appliedFilters.minPrice || appliedFilters.maxPrice,
    appliedFilters.roomType,
    appliedFilters.roomTypes?.length > 0,
    appliedFilters.genderPreference &&
      appliedFilters.genderPreference !== "ANY",
    appliedFilters.idealFor?.length > 0,
  ].filter(Boolean).length;

  const { containerProps, ...pullToRefreshState } = usePullToRefresh({
    onRefresh: refreshRooms,
    enabled: !isFilterOpen,
  });

  /* ─────────────────────────────────────────────
     RENDER

     Layout:
     ┌─ document scroll ─────────────────────────┐
     │  sticky glass header                       │
     │  ┌─ max-w-[1400px] flex row ─────────────┐ │
     │  │  aside (sticky, lg+)   main (flex-1)  │ │
     │  └────────────────────────────────────────┘ │
     │  MobileFilterDrawer (portal-like, fixed)    │
     └────────────────────────────────────────────┘
  ───────────────────────────────────────────── */
  return (
    <>
      <PullToRefreshIndicator {...pullToRefreshState} />
      <div
        {...containerProps}
        className="min-h-screen bg-[#f8f6f1] dark:bg-[#0d0b06]"
      >
        {/* ════════════════════════════════════════
            STICKY HEADER
        ════════════════════════════════════════ */}
        <header
          className="sticky top-0 z-30 w-full border-b border-slate-200/60 dark:border-white/[0.05]"
          style={{
            background: "rgba(248,246,241,0.9)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        >
          {/* Dark-mode overlay */}
          <div
            className="dark:block hidden absolute inset-0 pointer-events-none"
            style={{
              background: "rgba(13,11,6,0.88)",
              backdropFilter: "blur(18px)",
            }}
          />

          <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex items-center justify-between gap-3">
              {/* Left: title + count */}
              <div className="min-w-0">
                <h1
                  className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight truncate"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Find Stay
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 tracking-wide mt-0.5">
                  {total > 0
                    ? `${total.toLocaleString()} properties`
                    : "Browse all properties"}
                </p>
              </div>

              {/* Right: mobile filter trigger + sort */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* ── Mobile filter button ── */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                  style={{
                    background: activeFilterCount > 0 ? GOLD_BG : "transparent",
                    border: `1px solid ${
                      activeFilterCount > 0
                        ? GOLD_BORDER
                        : "rgba(148,163,184,0.3)"
                    }`,
                    color: activeFilterCount > 0 ? GOLD : "rgba(100,116,139,1)",
                  }}
                  aria-label="Open filters"
                >
                  Filters
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black"
                      style={{ background: GOLD, color: DARK_BASE }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* ── Sort select ── */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200/70 dark:border-white/[0.07] bg-white dark:bg-[#111009] pl-3 pr-7 py-2 text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 outline-none transition focus:border-slate-300 dark:focus:border-white/20 cursor-pointer"
                    style={{ minWidth: 90 }}
                  >
                    {sortOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 dark:text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ════════════════════════════════════════
            BODY ROW
        ════════════════════════════════════════ */}
        <div className="mx-auto w-full max-w-[1400px] flex items-start">
          {/* ── Desktop sidebar (lg+) ── */}
          <aside
            className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 sticky border-r border-slate-200/60 dark:border-white/[0.05]"
            style={{
              top: HEADER_H,
              height: `calc(100vh - ${HEADER_H}px)`,
              background: "transparent",
            }}
          >
            <div
              className="h-full overflow-y-auto px-4 py-5"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Sidebar title */}
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em] mb-5 px-1"
                style={{ color: GOLD_DIM }}
              >
                Filter Properties
              </p>
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                onApplyFilters={handleApplyFilters}
                isOpen={false}
                onClose={() => {}}
              />
            </div>
          </aside>

          {/* ── Main grid column ── */}
          <main className="flex-1 min-w-0 px-4 sm:px-5 lg:px-6 xl:px-8 py-5 sm:py-6">
            <form onSubmit={handleSearchSubmit} className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search area, landmark, address, title..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 dark:border-white/[0.07] dark:bg-[#111009] dark:text-slate-200"
                />
              </div>
              <button
                type="submit"
                className="h-11 rounded-xl px-4 text-xs font-bold uppercase tracking-wider text-slate-950"
                style={{ background: GOLD }}
              >
                Search
              </button>
            </form>

            {/* Filter chips row */}
            {activeFilterCount > 0 && (
              <div className="mb-4 sm:mb-5">
                <FilterChips
                  appliedFilters={appliedFilters}
                  onRemoveFilter={handleRemoveFilter}
                />
              </div>
            )}

            {/* Result count — mobile friendly */}
            {!isInitialLoading && items.length > 0 && (
              <p className="text-[11px] text-slate-400 dark:text-slate-600 mb-4 tracking-wide">
                Showing{" "}
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  {items.length}
                </span>
                {total > 0 ? ` of ${total.toLocaleString()}` : ""}{" "}
                properties
              </p>
            )}

            {/* ── States ── */}
            {isInitialLoading ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: columns * 2 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : isEmpty ? (
              <div className="flex flex-col items-center justify-center py-24 sm:py-36 rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.01]">
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: GOLD_BG,
                    border: `1px solid ${GOLD_BORDER}`,
                  }}
                >
                  <Search className="h-5 w-5" style={{ color: GOLD_DIM }} />
                </div>
                <p
                  className="text-base font-bold"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "rgba(148,163,184,0.8)",
                  }}
                >
                  No properties found
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                  Try adjusting or clearing your filters
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      const empty = {
                        city: "",
                        areaId: "",
                        areaIds: [],
                        location: "",
                        q: "",
                        minPrice: "",
                        maxPrice: "",
                        roomType: "",
                        roomTypes: [],
                        genderPreference: "",
                        idealFor: [],
                      };
                      setFilters(empty);
                      setAppliedFilters(empty);
                      setSearchText("");
                    }}
                    className="mt-4 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                    style={{
                      background: GOLD_BG,
                      border: `1px solid ${GOLD_BORDER}`,
                      color: GOLD,
                    }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <VirtualizedGrid
                  key={`grid-${columns}-${filterKey}`}
                  items={items}
                  renderItem={(room) => <RoomCard room={room} />}
                  columns={columns}
                  estimateSize={estimateSize}
                  overscan={3}
                  scrollMargin={HEADER_H}
                />

                {/* Infinite scroll sentinel */}
                <div
                  ref={sentinelRef}
                  className="mt-4 py-8 flex justify-center"
                  data-testid="infinite-scroll-sentinel"
                >
                  {isFetchingNextPage && (
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        background: GOLD_BG,
                        border: `1px solid ${GOLD_BORDER}`,
                        color: GOLD,
                      }}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border-2 border-t-transparent animate-spin"
                        style={{
                          borderColor: `${GOLD} transparent transparent transparent`,
                        }}
                      />
                      Loading more…
                    </div>
                  )}
                  {!hasNextPage && items.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div
                        className="h-px w-12"
                        style={{
                          background: `linear-gradient(to right, transparent, ${GOLD_BORDER})`,
                        }}
                      />
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: GOLD_DIM }}
                      >
                        {items.length} properties loaded
                      </p>
                      <div
                        className="h-px w-12"
                        style={{
                          background: `linear-gradient(to left, transparent, ${GOLD_BORDER})`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE FILTER DRAWER (outside main div,
          renders above everything via fixed z-50)
      ════════════════════════════════════════ */}
      <MobileFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      >
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          onApplyFilters={handleApplyFilters}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />
      </MobileFilterDrawer>
    </>
  );
}
