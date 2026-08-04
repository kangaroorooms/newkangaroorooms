import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Heart,
  Search,
  Crown,
  MapPin,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Briefcase,
  Star,
  Home,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchTenantDashboardData } from "../../store/slices/tenantDashboard.slice";
import {
  fetchFavoritesWithDetails,
  selectFavoriteRooms,
} from "../../store/slices/favorites.slice";
import { fetchRecommendedProperties } from "../../store/slices/assistedManagement.slice";

import { SubscriptionStatusCard } from "../../components/SubscriptionStatusCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { PullToRefreshIndicator } from "../../components/PullToRefreshIndicator";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { RecommendedProperty } from "../../types/assistedManagement.types";

// ── Status pill config ─────────────────────────────────────────────────────────
const STATUS_PILL: Record<string, { light: string; dark: string }> = {
  confirmed: {
    light: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dark: "dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  },
  cancelled: {
    light: "bg-red-50 text-red-600 border border-red-200",
    dark: "dark:bg-red-950/60 dark:text-red-400 dark:border-red-800",
  },
  pending: {
    light: "bg-amber-50 text-amber-700 border border-amber-200",
    dark: "dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  },
};

function statusPillClass(status: string) {
  const s = STATUS_PILL[status];
  if (!s)
    return "bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700";
  return `${s.light} ${s.dark}`;
}

export function TenantDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data, loading, error } = useAppSelector((s) => s.tenantDashboard);
  const { user } = useAppSelector((s) => s.auth);
  const favoriteRooms = useAppSelector(selectFavoriteRooms);
  const {
    recommendedProperties,
    recommendedPropertiesLoading,
    recommendedPropertiesError,
  } = useAppSelector((s) => s.assistedManagement);

  const [showAllBookings, setShowAllBookings] = useState(false);
  const [showAllSaved, setShowAllSaved] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchTenantDashboardData());
    dispatch(fetchFavoritesWithDetails(50));
  }, [dispatch]);

  const refreshTenantDashboard = useCallback(async () => {
    await Promise.all([
      dispatch(fetchTenantDashboardData()),
      dispatch(fetchFavoritesWithDetails(50)),
    ]);
  }, [dispatch]);

  const toggleServiceExpansion = (serviceId: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      const isExpanding = !newSet.has(serviceId);

      if (isExpanding) {
        newSet.add(serviceId);
        // Lazy load recommendations only when expanding
        // Check if not already cached and not currently loading
        if (!recommendedProperties[serviceId] && !recommendedPropertiesLoading[serviceId]) {
          dispatch(fetchRecommendedProperties(serviceId));
        }
      } else {
        newSet.delete(serviceId);
      }
      return newSet;
    });
  };

  const { containerProps, ...pullToRefreshState } = usePullToRefresh({
    onRefresh: refreshTenantDashboard,
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && !data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0d0b06]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-[10px] tracking-[0.2em] uppercase text-amber-500 dark:text-amber-400">
            Loading
          </p>
        </div>
      </div>
    );

  if (error) return <div className="p-10 text-red-500">{error}</div>;
  if (!data) return null;

  const {
    bookings = [],
    subscriptions = [],
    assistedRequests = [],
  } = data as any;

  const activeSubscriptions = subscriptions.filter((s: any) => s?.isActive);

  const activeServices = assistedRequests;
  const visibleBookings = showAllBookings ? bookings : bookings.slice(0, 4);
  const visibleSaved = showAllSaved ? favoriteRooms : favoriteRooms.slice(0, 4);

  // ── Shared class helpers ───────────────────────────────────────────────────
  // Card wrapper
  const card =
    "rounded-2xl p-4 border bg-white border-amber-200/60 dark:bg-[#161616] dark:border-amber-400/20";

  // Section header icon badge
  const iconBadge =
    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 " +
    "bg-amber-100 dark:bg-amber-400/10";

  // Count badge
  const countBadge =
    "text-[10px] font-semibold px-2 py-0.5 rounded-full " +
    "bg-amber-100 text-amber-700 border border-amber-200 " +
    "dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20";

  // "Show more" button
  const moreBtn =
    "mt-3 w-full text-xs flex items-center justify-center gap-1 " +
    "text-amber-400/60 dark:text-amber-500/50 bg-transparent border-none cursor-pointer";

  // Inner room / booking card
  const innerCard =
    "rounded-xl border transition-all duration-200 " +
    "bg-white border-amber-200/50 hover:-translate-y-0.5 " +
    "dark:bg-[#1b1b1b] dark:border-amber-400/20";

  return (
    <>
      <PullToRefreshIndicator {...pullToRefreshState} />
      <div {...containerProps} className="m-2">
        <div className="min-h-screen text-neutral-800 dark:text-slate-100">
          {/* ── Hero greeting ──────────────────────────────────────────────── */}
          <div className="relative mb-6 rounded-2xl p-4 sm:p-5 overflow-hidden bg-white border border-amber-200/70 dark:bg-[#161616] dark:border-amber-400/20">
            {/* Soft glow blob */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none bg-amber-300/10 dark:bg-amber-400/5 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase mb-1 text-amber-600 dark:text-amber-400">
                  Tenant Dashboard
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                  Hey, {user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-xs sm:text-sm mt-0.5 text-amber-600/60 dark:text-amber-400/50">
                  Here's what's happening with your rentals.
                </p>
              </div>

              <Link to="/rooms">
                <button className="flex items-center gap-2 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl transition-all bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-[#0d0b06]">
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Find Room</span>
                </button>
              </Link>
            </div>
          </div>

          {/* ── Quick stats ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Visits", value: bookings.length },
              { label: "Saved", value: favoriteRooms.length },
              { label: "Active Plans", value: activeSubscriptions.length },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center rounded-xl p-3 sm:p-4 bg-white border border-amber-200/60 dark:bg-[#161616] dark:border-amber-400/20"
              >
                <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-[11px] mt-0.5 uppercase tracking-widest text-amber-500/60 dark:text-amber-400/45">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
            {/* ── MY SERVICES SECTION ──────────────────────────────────────────── */}
          <div className={`${card} mt-4`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={iconBadge}>
                  <Briefcase className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-sm font-semibold text-neutral-800 dark:text-white">
                  My Services
                </h2>
              </div>
              <span className={countBadge}>{activeServices.length}</span>
            </div>

            {activeServices.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No services yet"
                description="Get Property Concierge for personalized rental assistance"
              />
            ) : (
              <div className="space-y-3">
                {activeServices.map((service: any) => {
                  const isPropertyConcierge = true;

                  const serviceName = "Property Concierge";
                  const workflowStages = [
                    { key: "NEW", label: "Assigned", icon: "👤" },
                    { key: "CONTACTED", label: "Searching", icon: "🔍" },
                    { key: "SEARCHING", label: "Shortlisted", icon: "📋" },
                    { key: "PROPERTIES_SHARED", label: "Visits", icon: "🏠" },
                    {
                      key: "VISITS_SCHEDULED",
                      label: "Negotiating",
                      icon: "🤝",
                    },
                    { key: "COMPLETED", label: "Finalized", icon: "✅" },
                  ];
                  const workflowStatus = service.workflowStatus || "NEW";

                  const currentStageIndex = workflowStages.findIndex(
                    (stage) => stage.key === workflowStatus,
                  );
                  const displayStages =
                    currentStageIndex >= 0
                      ? workflowStages.slice(0, currentStageIndex + 2)
                      : workflowStages.slice(0, 2);

                  const getNextStepMessage = (status: string) => {
                    switch (status) {
                      case "NEW":
                        return "Expert will contact you within 24 hours";
                      case "CONTACTED":
                        return "Expert is searching for properties";
                      case "SEARCHING":
                        return "Receiving property shortlist soon";
                      case "PROPERTIES_SHARED":
                        return "Schedule visits at your convenience";
                      case "VISITS_SCHEDULED":
                        return "Expert handling negotiation";
                      case "COMPLETED":
                        return "Your property search is complete";
                      default:
                        return "Track your progress here";
                    }
                  };

                  return (
                    <div key={service.id} className={`p-4 ${innerCard}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                              {serviceName}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                              {service.status === "PAID"
                                ? "ACTIVE"
                                : service.status}
                            </span>
                          </div>
                          <p className="text-[11px] flex items-center gap-1 text-amber-600/60 dark:text-amber-400/45">
                            <MapPin className="w-2.5 h-2.5" />
                            {service.city}
                          </p>
                          <p className="text-xs font-bold flex items-center gap-0.5 mt-1 text-amber-600 dark:text-amber-400">
                            <IndianRupee className="w-3 h-3" />
                            {service.amount / 100}
                          </p>
                          {/* Assigned Expert Info */}
                          {service.assignedExecutive ? (
                            <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                              <p className="text-[10px] font-semibold text-blue-900 dark:text-blue-200 mb-1">
                                Assigned Expert
                              </p>
                              <p className="text-[11px] font-medium text-blue-800 dark:text-blue-300">
                                {service.assignedExecutive.name}
                              </p>
                              {service.assignedExecutive.phone && (
                                <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">
                                  {service.assignedExecutive.phone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                              <p className="text-[10px] font-medium text-amber-800 dark:text-amber-300">
                                Waiting For Assignment
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleServiceExpansion(service.id)}
                          className="text-xs text-amber-600/60 dark:text-amber-400/45 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1"
                        >
                          {expandedServices.has(service.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Progress Indicator for Property Concierge */}
                      {isPropertyConcierge && (
                        <>
                          <div className="mt-4 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Progress
                              </span>
                              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                                {currentStageIndex >= 0
                                  ? `${currentStageIndex + 1}/${
                                      workflowStages.length
                                    }`
                                  : "1/6"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                              {displayStages.map((stage, index) => (
                                <div
                                  key={stage.key}
                                  className="flex flex-col items-center flex-shrink-0"
                                >
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                                      index <= currentStageIndex &&
                                      currentStageIndex >= 0
                                        ? "bg-amber-500 text-white"
                                        : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                    }`}
                                  >
                                    {stage.icon}
                                  </div>
                                  <span className="text-[9px] text-slate-600 dark:text-slate-400 mt-1 whitespace-nowrap">
                                    {stage.label}
                                  </span>
                                </div>
                              ))}
                              {currentStageIndex <
                                workflowStages.length - 1 && (
                                <div className="flex flex-col items-center flex-shrink-0 ml-1">
                                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                                    <span className="text-[8px] text-slate-400">
                                      ...
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Next Step */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 border border-blue-100 dark:border-blue-800/30 mb-3">
                            <p className="text-[10px] font-semibold text-blue-900 dark:text-blue-200 mb-1">
                              Next Step
                            </p>
                            <p className="text-[10px] text-blue-800 dark:text-blue-300">
                              {getNextStepMessage(workflowStatus)}
                            </p>
                          </div>

                          {/* Recommended Properties */}
                          {expandedServices.has(service.id) && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2 mb-3">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="text-xs font-semibold text-neutral-800 dark:text-white">
                                  Recommended Properties
                                </span>
                              </div>
                              {recommendedPropertiesLoading[service.id] ? (
                                <div className="text-center py-4">
                                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                              ) : recommendedPropertiesError[service.id] ? (
                                <div className="text-center py-4">
                                  <p className="text-xs text-red-500 dark:text-red-400 mb-2">
                                    Failed to load recommendations
                                  </p>
                                  <button
                                    onClick={() => dispatch(fetchRecommendedProperties(service.id))}
                                    className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                                  >
                                    Retry
                                  </button>
                                </div>
                              ) : recommendedProperties[service.id]?.length > 0 ? (
                                <div className="space-y-2">
                                  {recommendedProperties[service.id].map((rec: RecommendedProperty) => (
                                    <div
                                      key={rec.id}
                                      onClick={() => navigate(`/rooms/${rec.property.id}`)}
                                      className="cursor-pointer p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:border-amber-400 dark:hover:border-amber-400/50 transition-colors"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                                          <img
                                            src={rec.property.images?.[0]}
                                            alt={rec.property.title}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium line-clamp-1 text-neutral-800 dark:text-white">
                                            {rec.property.title}
                                          </p>
                                          <p className="text-[10px] flex items-center gap-0.5 mt-0.5 text-amber-600/60 dark:text-amber-400/45">
                                            <MapPin className="w-2 h-2" />
                                            {rec.property.city}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                              <IndianRupee className="w-2.5 h-2.5" />
                                              {rec.property.pricePerMonth}
                                            </span>
                                            {rec.priority >= 4 && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                High Priority
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-amber-400/30 dark:text-amber-400/25 flex-shrink-0" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-xs">
                                  No recommendations yet. Expert will share properties soon.
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Main 3-col layout ──────────────────────────────────────────── */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1.6fr_1fr] gap-4">
            {/* ── COL 1 · SAVED ─────────────────────────────────────────── */}
            <div className={`order-3 lg:order-1 ${card}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={iconBadge}>
                    <Heart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-neutral-800 dark:text-white">
                    Saved Rooms
                  </h2>
                </div>
                <span className={countBadge}>{favoriteRooms.length}</span>
              </div>

              {favoriteRooms.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="Nothing saved yet"
                  description="Heart rooms you like"
                />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                  {visibleSaved.map((fav: any) => {
                    const room = fav.room || fav;
                    if (!room?.id) return null;
                    return (
                      <div
                        key={room.id}
                        onClick={() => navigate(`/rooms/${room.id}`)}
                        className={`group cursor-pointer overflow-hidden ${innerCard}`}
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={room.images?.[0]}
                            alt={room.title}
                            className="w-full h-24 lg:h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <span className="absolute bottom-2 left-2 text-xs font-bold flex items-center gap-0.5 text-amber-400">
                            <IndianRupee className="w-3 h-3" />
                            {room.pricePerMonth}
                            <span className="font-normal text-white/60">
                              /mo
                            </span>
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-medium line-clamp-1 text-neutral-800 dark:text-slate-200">
                            {room.title}
                          </p>
                          <p className="text-[10px] flex items-center gap-0.5 mt-0.5 text-amber-600/60 dark:text-amber-400/45">
                            <MapPin className="w-2.5 h-2.5" />
                            {room.city}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {favoriteRooms.length > 4 && (
                <button
                  className={moreBtn}
                  onClick={() => setShowAllSaved((p) => !p)}
                >
                  {showAllSaved ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />{" "}
                      {favoriteRooms.length - 4} more saved
                    </>
                  )}
                </button>
              )}
            </div>

            {/* ── COL 2 · BOOKINGS ──────────────────────────────────────── */}
            <div id="bookings" className={`order-1 lg:order-2 ${card}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={iconBadge}>
                    <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-neutral-800 dark:text-white">
                    Visits
                  </h2>
                </div>
                <span className={countBadge}>{bookings.length}</span>
              </div>

              {bookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No Visits yet"
                  description="Start exploring rooms nearby"
                />
              ) : (
                <div className="space-y-3">
                  {visibleBookings.map((b: any) => {
                    const room = b.room;
                    if (!room?.id) return null;
                    return (
                      <div
                        key={b.id}
                        onClick={() => navigate(`/rooms/${room.id}`)}
                        className={`group flex gap-3 p-3 cursor-pointer ${innerCard}`}
                      >
                        <div className="relative w-[72px] h-[60px] flex-shrink-0 rounded-lg overflow-hidden">
                          <img
                            src={room.images?.[0]}
                            alt={room.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1 text-neutral-900 dark:text-white">
                            {room.title}
                          </p>
                          <p className="text-[11px] flex items-center gap-1 mt-0.5 text-amber-600/60 dark:text-amber-400/45">
                            <MapPin className="w-2.5 h-2.5" />
                            {room.city}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-bold flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                              <IndianRupee className="w-3 h-3" />
                              {room.pricePerMonth}
                              <span className="font-normal text-amber-500/50 dark:text-amber-400/40">
                                /mo
                              </span>
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusPillClass(
                                b.status,
                              )}`}
                            >
                              {b.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center self-center">
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-all duration-200 text-amber-400/30 dark:text-amber-400/25" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {bookings.length > 4 && (
                <button
                  className={moreBtn}
                  onClick={() => {
                    setShowAllBookings((p) => !p);
                    setTimeout(() => {
                      document
                        .getElementById("bookings")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                >
                  {showAllBookings ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" /> View all{" "}
                      {bookings.length} bookings
                    </>
                  )}
                </button>
              )}
            </div>

            {/* ── COL 3 · PLAN ──────────────────────────────────────────── */}
            <div className={`order-2 lg:order-3 ${card}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={iconBadge}>
                    <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-neutral-800 dark:text-white">
                    Your Plan
                  </h2>
                </div>
                {activeSubscriptions.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                    Active
                  </span>
                )}
              </div>

              {activeSubscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 bg-amber-100 dark:bg-amber-400/10">
                    <Crown className="w-6 h-6 text-amber-400/50 dark:text-amber-400/35" />
                  </div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-white">
                    No active plan
                  </p>
                  <p className="text-xs mt-1 mb-5 text-amber-600/50 dark:text-amber-400/40">
                    Upgrade to unlock premium features
                  </p>
                  <Link to="/pricing">
                    <button className="text-xs font-semibold px-5 py-2 rounded-xl transition-all bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20 dark:hover:bg-amber-400/10">
                      View Plans
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 ">
                  {activeSubscriptions.map((sub: any) => (
                    <SubscriptionStatusCard key={sub.id} subscription={sub} />
                  ))}

                  <Link to="/pricing">
                    <button className="w-full text-xs font-semibold mt-2 px-5 py-2 rounded-xl transition-all bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 dark:bg-[#1b1b1b] dark:text-amber-400 dark:border-amber-400/20 dark:hover:bg-amber-400/10">
                      View All Plans
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
