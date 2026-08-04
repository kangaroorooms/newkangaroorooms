import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  adminApi,
  FreshnessTrendsResponse,
  RecoveryMetricsResponse,
  ReminderEffectivenessResponse,
  FalsePositiveMetricsResponse,
  AdminWorkloadResponse,
  OperationalConsistencyResponse,
} from "../../api/admin.api";
import { showToast } from "../../store/slices/ui.slice";
import { useAppDispatch } from "../../store/hooks";
import {
  TrendLineChart,
  AreaChartComponent,
  BarChartComponent,
  TrendIndicator,
  AnalyticsLoadingPlaceholder,
  AnalyticsEmptyState,
  AnalyticsErrorState,
  MetricCard,
} from "./AnalyticsCharts";
import { HealthStatus } from "./HealthStatus";
import {
  formatChartDate,
  getTrendDescription,
  getEffectivenessLabel,
  parsePercentageString,
  transformFalsePositiveReasons,
} from "../../utils/analyticsAdapters";
import { getEmptyStateMessage, getRecoveryInsight, getReminderInsight, getFalsePositiveInsight, getWorkloadInsight, getConsistencyInsight, getMarketplaceHealthInsight } from "../../utils/operationalInsights";

/**
 * MARKETPLACE ANALYTICS DASHBOARD
 *
 * Provides admin operational visibility:
 * - Freshness trends (inventory health)
 * - Recovery effectiveness (stale recovery rate)
 * - Reminder ROI (response rates)
 * - False positive analytics (scoring confidence)
 * - Admin workload (operational scalability)
 * - Operational consistency (data quality)
 *
 * SAFETY: Read-only analytics, no property mutations
 */

type AnalyticsRange = 7 | 30 | 90;
type TabKey =
  | "overview"
  | "freshness"
  | "recovery"
  | "reminders"
  | "false-positives"
  | "workload"
  | "consistency";

interface AnalyticsState {
  freshnessTrends: FreshnessTrendsResponse | null;
  recoveryMetrics: RecoveryMetricsResponse | null;
  reminderEffectiveness: ReminderEffectivenessResponse | null;
  falsePositiveMetrics: FalsePositiveMetricsResponse | null;
  adminWorkload: AdminWorkloadResponse | null;
  operationalConsistency: OperationalConsistencyResponse | null;
}

interface LoadingState {
  freshnessTrends: boolean;
  recoveryMetrics: boolean;
  reminderEffectiveness: boolean;
  falsePositiveMetrics: boolean;
  adminWorkload: boolean;
  operationalConsistency: boolean;
}

interface ErrorState {
  freshnessTrends: string | null;
  recoveryMetrics: string | null;
  reminderEffectiveness: string | null;
  falsePositiveMetrics: string | null;
  adminWorkload: string | null;
  operationalConsistency: string | null;
}

export function AdminAnalyticsDashboard() {
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [range, setRange] = useState<AnalyticsRange>(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [analytics, setAnalytics] = useState<AnalyticsState>({
    freshnessTrends: null,
    recoveryMetrics: null,
    reminderEffectiveness: null,
    falsePositiveMetrics: null,
    adminWorkload: null,
    operationalConsistency: null,
  });

  const [loading, setLoading] = useState<LoadingState>({
    freshnessTrends: true,
    recoveryMetrics: true,
    reminderEffectiveness: true,
    falsePositiveMetrics: true,
    adminWorkload: true,
    operationalConsistency: true,
  });

  const [errors, setErrors] = useState<ErrorState>({
    freshnessTrends: null,
    recoveryMetrics: null,
    reminderEffectiveness: null,
    falsePositiveMetrics: null,
    adminWorkload: null,
    operationalConsistency: null,
  });

  const fetchAllAnalytics = useCallback(async () => {
    // Set all sections as loading upfront
    setLoading({
      freshnessTrends: true,
      recoveryMetrics: true,
      reminderEffectiveness: true,
      falsePositiveMetrics: true,
      adminWorkload: true,
      operationalConsistency: true,
    });

    // PARALLELIZED: Fetch all endpoints concurrently instead of sequentially
    // Prevents 6x performance penalty (200ms × 6 = 1200ms → ~200ms)
    const results = await Promise.allSettled([
      adminApi.getFreshnessTrends(range),
      adminApi.getRecoveryMetrics(range),
      adminApi.getReminderEffectiveness(range),
      adminApi.getFalsePositiveMetrics(range),
      adminApi.getAdminWorkload(range),
      adminApi.getOperationalConsistency(),
    ]);

    const [freshnessTrendsResult, recoveryMetricsResult, reminderEffectivenessResult, falsePositiveMetricsResult, adminWorkloadResult, operationalConsistencyResult] = results;

    // Handle each result independently - one failure doesn't crash the whole dashboard
    if (freshnessTrendsResult.status === "fulfilled") {
      setAnalytics((prev) => ({ ...prev, freshnessTrends: freshnessTrendsResult.value }));
      setErrors((prev) => ({ ...prev, freshnessTrends: null }));
    } else {
      setErrors((prev) => ({
        ...prev,
        freshnessTrends: (freshnessTrendsResult.reason as any)?.response?.data?.message || "Failed to fetch trends",
      }));
    }

    if (recoveryMetricsResult.status === "fulfilled") {
      setAnalytics((prev) => ({ ...prev, recoveryMetrics: recoveryMetricsResult.value }));
      setErrors((prev) => ({ ...prev, recoveryMetrics: null }));
    } else {
      setErrors((prev) => ({
        ...prev,
        recoveryMetrics: (recoveryMetricsResult.reason as any)?.response?.data?.message || "Failed to fetch recovery metrics",
      }));
    }

    if (reminderEffectivenessResult.status === "fulfilled") {
      setAnalytics((prev) => ({ ...prev, reminderEffectiveness: reminderEffectivenessResult.value }));
      setErrors((prev) => ({ ...prev, reminderEffectiveness: null }));
    } else {
      setErrors((prev) => ({
        ...prev,
        reminderEffectiveness: (reminderEffectivenessResult.reason as any)?.response?.data?.message || "Failed to fetch reminder data",
      }));
    }

    if (falsePositiveMetricsResult.status === "fulfilled") {
      setAnalytics((prev) => ({ ...prev, falsePositiveMetrics: falsePositiveMetricsResult.value }));
      setErrors((prev) => ({ ...prev, falsePositiveMetrics: null }));
    } else {
      setErrors((prev) => ({
        ...prev,
        falsePositiveMetrics: (falsePositiveMetricsResult.reason as any)?.response?.data?.message || "Failed to fetch false positive data",
      }));
    }

    if (adminWorkloadResult.status === "fulfilled") {
      setAnalytics((prev) => ({ ...prev, adminWorkload: adminWorkloadResult.value }));
      setErrors((prev) => ({ ...prev, adminWorkload: null }));
    } else {
      setErrors((prev) => ({
        ...prev,
        adminWorkload: (adminWorkloadResult.reason as any)?.response?.data?.message || "Failed to fetch workload data",
      }));
    }

    if (operationalConsistencyResult.status === "fulfilled") {
      setAnalytics((prev) => ({ ...prev, operationalConsistency: operationalConsistencyResult.value }));
      setErrors((prev) => ({ ...prev, operationalConsistency: null }));
    } else {
      setErrors((prev) => ({
        ...prev,
        operationalConsistency: (operationalConsistencyResult.reason as any)?.response?.data?.message || "Failed to fetch consistency data",
      }));
    }

    // Set all sections as loaded
    setLoading({
      freshnessTrends: false,
      recoveryMetrics: false,
      reminderEffectiveness: false,
      falsePositiveMetrics: false,
      adminWorkload: false,
      operationalConsistency: false,
    });
    setIsRefreshing(false);
  }, [range]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllAnalytics();
    dispatch(showToast({ message: "Analytics refreshed", type: "success" }));
  };

  const handleRangeChange = (newRange: AnalyticsRange) => {
    setRange(newRange);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-navy dark:text-white">
            Marketplace Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Operational trends, effectiveness metrics, and data quality insights
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Range Selector */}
          <div className="flex gap-2">
            {([7, 30, 90] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  range === r
                    ? "bg-navy text-white dark:bg-white dark:text-navy"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {(
          [
            { key: "overview" as TabKey, label: "Overview", icon: Activity },
            {
              key: "freshness" as TabKey,
              label: "Freshness",
              icon: TrendingUp,
            },
            { key: "recovery" as TabKey, label: "Recovery", icon: CheckCircle },
            {
              key: "reminders" as TabKey,
              label: "Reminders",
              icon: AlertCircle,
            },
            {
              key: "false-positives" as TabKey,
              label: "False Positives",
              icon: AlertTriangle,
            },
            { key: "workload" as TabKey, label: "Workload", icon: BarChart3 },
            {
              key: "consistency" as TabKey,
              label: "Consistency",
              icon: CheckCircle,
            },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === key
                ? "border-navy text-navy dark:border-white dark:text-white"
                : "border-transparent text-slate-500 hover:text-navy dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "overview" && (
          <OverviewTab
            analytics={analytics}
            loading={loading}
            errors={errors}
          />
        )}
        {activeTab === "freshness" && (
          <FreshnessTab
            analytics={analytics}
            loading={loading}
            errors={errors}
          />
        )}
        {activeTab === "recovery" && (
          <RecoveryTab
            analytics={analytics}
            loading={loading}
            errors={errors}
          />
        )}
        {activeTab === "reminders" && (
          <RemindersTab
            analytics={analytics}
            loading={loading}
            errors={errors}
          />
        )}
        {activeTab === "false-positives" && (
          <FalsePositivesTab
            analytics={analytics}
            loading={loading}
            errors={errors}
          />
        )}
        {activeTab === "workload" && (
          <WorkloadTab
            analytics={analytics}
            loading={loading}
            errors={errors}
          />
        )}
        {activeTab === "consistency" && (
          <ConsistencyTab
            analytics={analytics}
            loading={loading}
            errors={errors}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TAB: OVERVIEW
// =============================================================================

function OverviewTab({
  analytics,
  loading,
  errors,
}: {
  analytics: AnalyticsState;
  loading: LoadingState;
  errors: ErrorState;
}) {
  if (Object.values(loading).some((l) => l)) {
    return <AnalyticsLoadingPlaceholder />;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Freshness Health */}
        {errors.freshnessTrends ? (
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {errors.freshnessTrends}
            </p>
          </div>
        ) : analytics.freshnessTrends ? (
          <>
            <MetricCard
              label="Fresh Inventory"
              value={`${analytics.freshnessTrends.freshInventory?.end ?? 0}`}
              sub={`${
                analytics.freshnessTrends.freshInventory?.trend === "improving"
                  ? "+"
                  : ""
              }${analytics.freshnessTrends.freshInventory?.change ?? 0} (${
                analytics.freshnessTrends.freshInventory?.changePercent ?? 0
              }%)`}
              icon={TrendingUp}
            />
            <MetricCard
              label="Stale Inventory"
              value={`${analytics.freshnessTrends.staleInventory?.end ?? 0}`}
              sub={`${analytics.freshnessTrends.staleInventory?.change ?? 0} (${analytics.freshnessTrends.staleInventory?.changePercent ?? 0}%)`}
            />
            <MetricCard
              label="Dead Inventory"
              value={`${analytics.freshnessTrends.deadInventory?.end ?? 0}`}
              sub={`${analytics.freshnessTrends.deadInventory?.change ?? 0} (${analytics.freshnessTrends.deadInventory?.changePercent ?? 0}%)`}
            />
          </>
        ) : null}

        {/* Recovery Health */}
        {errors.recoveryMetrics ? (
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {errors.recoveryMetrics}
            </p>
          </div>
        ) : analytics.recoveryMetrics ? (
          <>
            <MetricCard
              label="Recovered Count"
              value={analytics.recoveryMetrics.totalRecoveredProperties}
              sub={`${analytics.recoveryMetrics.averageRecoveryRate}% avg rate`}
            />
          </>
        ) : null}

        {/* Reminder Health */}
        {errors.reminderEffectiveness ? (
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {errors.reminderEffectiveness}
            </p>
          </div>
        ) : analytics.reminderEffectiveness ? (
          <>
            <MetricCard
              label="Reminder Response"
              value={`${analytics.reminderEffectiveness.overallResponseRate}%`}
              sub={`${analytics.reminderEffectiveness.totalOwnerResponses}/${analytics.reminderEffectiveness.totalRemindersGenerated}`}
            />
          </>
        ) : null}
      </div>

      {/* Health Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Freshness Trend */}
        {!errors.freshnessTrends && analytics.freshnessTrends && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-navy dark:text-white">
                Freshness Trend
              </h3>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {analytics.freshnessTrends.overallHealthTrend.description}
            </p>
          </div>
        )}

        {/* Recovery Status */}
        {!errors.recoveryMetrics && analytics.recoveryMetrics && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-navy dark:text-white">
                Recovery Status
              </h3>
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {analytics.recoveryMetrics.recoveryTrend === "up"
                ? "Recovery rate improving"
                : analytics.recoveryMetrics.recoveryTrend === "down"
                ? "Recovery rate declining"
                : "Recovery rate stable"}
            </p>
          </div>
        )}

        {/* Reminder Effectiveness */}
        {!errors.reminderEffectiveness && analytics.reminderEffectiveness && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-navy dark:text-white">
                Reminder ROI
              </h3>
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {analytics.reminderEffectiveness.effectiveness ===
              "highly_effective"
                ? "Highly effective"
                : analytics.reminderEffectiveness.effectiveness ===
                  "moderately_effective"
                ? "Moderately effective"
                : "Low effectiveness"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TAB: FRESHNESS TRENDS
// =============================================================================

function FreshnessTab({
  analytics,
  loading,
  errors,
}: {
  analytics: AnalyticsState;
  loading: LoadingState;
  errors: ErrorState;
}) {
  if (loading.freshnessTrends) return <AnalyticsLoadingPlaceholder />;
  if (errors.freshnessTrends)
    return <AnalyticsErrorState message={errors.freshnessTrends} />;
  if (!analytics.freshnessTrends) 
    return <AnalyticsEmptyState message={getEmptyStateMessage('freshness', 0, 7)} />;

  const data =
      (analytics.freshnessTrends?.historicalSnapshots ?? []).map((s) => ({
        date: formatChartDate(s.date),
        fresh: s.fresh,
        aging: s.aging,
        stale: s.stale,
        dead: s.dead,
      }));

  // Calculate freshness insight using latest snapshot
  const freshInsight = (() => {
    const latestSnapshot = analytics.freshnessTrends?.historicalSnapshots?.[analytics.freshnessTrends.historicalSnapshots.length - 1];
    if (!latestSnapshot) return { status: 'unknown' as const, message: 'No data available' };
    return getMarketplaceHealthInsight(
      latestSnapshot.fresh ?? 0,
      latestSnapshot.stale ?? 0,
      latestSnapshot.dead ?? 0,
      (latestSnapshot.fresh ?? 0) + (latestSnapshot.aging ?? 0) + (latestSnapshot.stale ?? 0) + (latestSnapshot.dead ?? 0)
    );
  })();

  return (
    <div className="space-y-6">
      {/* Operational Insight */}
      <HealthStatus {...freshInsight} />

      {/* Inventory Trend Chart */}
      <div>
        <h3 className="mb-4 font-semibold text-navy dark:text-white">
          Inventory Distribution Trend
        </h3>
        <TrendLineChart
          data={data}
          lines={[
            { key: "fresh", name: "Fresh", color: "#10b981" },
            { key: "aging", name: "Aging", color: "#f59e0b" },
            { key: "stale", name: "Stale", color: "#ef6340" },
            { key: "dead", name: "Dead", color: "#ef4444" },
          ]}
          height={400}
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Fresh Change
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {(analytics.freshnessTrends.freshInventory?.change ?? 0) >= 0 ? "+" : ""}
              {analytics.freshnessTrends.freshInventory?.change ?? 0}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({analytics.freshnessTrends.freshInventory?.changePercent ?? 0}%)
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Trend: {analytics.freshnessTrends.freshInventory?.trend ?? 'stable'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Stale Change
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {((analytics.freshnessTrends.staleInventory?.change) ?? 0) >= 0 ? "+" : ""}
              {analytics.freshnessTrends.staleInventory?.change ?? 0}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({analytics.freshnessTrends.staleInventory?.changePercent ?? 0}%)
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Trend: {analytics.freshnessTrends.staleInventory?.trend ?? 'stable'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Aging Change
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {(analytics.freshnessTrends.agingInventory?.change ?? 0) >= 0 ? "+" : ""}
              {analytics.freshnessTrends.agingInventory?.change ?? 0}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({analytics.freshnessTrends.agingInventory?.changePercent ?? 0}%)
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Trend: {analytics.freshnessTrends.agingInventory?.trend ?? 'stable'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Dead Change
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {(analytics.freshnessTrends.deadInventory?.change ?? 0) >= 0 ? "+" : ""}
              {analytics.freshnessTrends.deadInventory?.change ?? 0}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({analytics.freshnessTrends.deadInventory?.changePercent ?? 0}%)
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Trend: {analytics.freshnessTrends.deadInventory?.trend ?? 'stable'}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TAB: RECOVERY
// =============================================================================

function RecoveryTab({
  analytics,
  loading,
  errors,
}: {
  analytics: AnalyticsState;
  loading: LoadingState;
  errors: ErrorState;
}) {
  if (loading.recoveryMetrics) return <AnalyticsLoadingPlaceholder />;
  if (errors.recoveryMetrics)
    return <AnalyticsErrorState message={errors.recoveryMetrics} />;
  if (!analytics.recoveryMetrics) 
    return <AnalyticsEmptyState message={getEmptyStateMessage('recovery', 0, 7)} />;

  const data =
      (analytics.recoveryMetrics?.historicalRecoveries ?? []).map((h) => ({
        date: formatChartDate(h.date),
        recovered: h.recoveredCount ?? 0,
        rate: Math.round((h.recoveryRate ?? 0) * 100),
      }));

  // Calculate recovery insight
  const recoveryInsight = getRecoveryInsight(
      analytics.recoveryMetrics?.averageRecoveryRate ?? 0,
      analytics.recoveryMetrics?.totalRecoveredProperties ?? 0,
    );

  return (
    <div className="space-y-6">
      {/* Operational Insight */}
      <HealthStatus {...recoveryInsight} />

      {/* Recovery Trend */}
      <div>
        <h3 className="mb-4 font-semibold text-navy dark:text-white">
          Recovery Trend
        </h3>
        <TrendLineChart
          data={data}
          lines={[
            {
              key: "recovered",
              name: "Recovered Properties",
              color: "#3b82f6",
            },
          ]}
          height={300}
        />
      </div>

      {/* Recovery Rate */}
      <div>
        <h3 className="mb-4 font-semibold text-navy dark:text-white">
          Recovery Rate Trend
        </h3>
        <TrendLineChart
          data={data}
          lines={[{ key: "rate", name: "Recovery Rate (%)", color: "#10b981" }]}
          height={300}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Total Recovered
          </p>
          <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {analytics.recoveryMetrics.totalRecoveredProperties}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Properties recovered in period
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Avg Recovery Rate
          </p>
          <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {analytics.recoveryMetrics.averageRecoveryRate}%
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Average recovery rate
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TAB: REMINDERS
// =============================================================================

function RemindersTab({
  analytics,
  loading,
  errors,
}: {
  analytics: AnalyticsState;
  loading: LoadingState;
  errors: ErrorState;
}) {
  if (loading.reminderEffectiveness) return <AnalyticsLoadingPlaceholder />;
  if (errors.reminderEffectiveness)
    return <AnalyticsErrorState message={errors.reminderEffectiveness} />;
  if (!analytics.reminderEffectiveness) 
    return <AnalyticsEmptyState message={getEmptyStateMessage('reminders', 0, 7)} />;

  const data =
      (analytics.reminderEffectiveness?.historicalData ?? []).map((h) => ({
        date: formatChartDate(h.date),
        generated: h.remindersGenerated ?? 0,
        responses: h.responses ?? 0,
        rate: Math.round((h.responseRate ?? 0) * 100),
      }));

  // Calculate reminder insight
  const reminderInsight = getReminderInsight(
      analytics.reminderEffectiveness?.overallResponseRate ?? 0,
      analytics.reminderEffectiveness?.totalOwnerResponses ?? 0,
      analytics.reminderEffectiveness?.totalRemindersGenerated ?? 0,
    );

  return (
    <div className="space-y-6">
      {/* Operational Insight */}
      <HealthStatus {...reminderInsight} />

      {/* Response Rate Trend */}
      <div>
        <h3 className="mb-4 font-semibold text-navy dark:text-white">
          Response Rate Trend
        </h3>
        <TrendLineChart
          data={data}
          lines={[{ key: "rate", name: "Response Rate (%)", color: "#8b5cf6" }]}
          height={300}
        />
      </div>

      {/* Reminders Generated vs Responses */}
      <div>
        <h3 className="mb-4 font-semibold text-navy dark:text-white">
          Reminders Generated vs Responses
        </h3>
        <TrendLineChart
          data={data}
          lines={[
            { key: "generated", name: "Generated", color: "#3b82f6" },
            { key: "responses", name: "Responses", color: "#10b981" },
          ]}
          height={300}
        />
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Total Generated
          </p>
          <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {analytics.reminderEffectiveness.totalRemindersGenerated}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Responses
          </p>
          <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {analytics.reminderEffectiveness.totalOwnerResponses}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Overall Rate
          </p>
          <p className="mt-3 text-3xl font-bold text-purple-600 dark:text-purple-400">
            {analytics.reminderEffectiveness.overallResponseRate}%
          </p>
        </div>
      </div>

      {/* Effectiveness Assessment */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Effectiveness Assessment
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
              Reminders are{" "}
              <strong>
                {analytics.reminderEffectiveness.effectiveness ===
                "highly_effective"
                  ? "highly effective"
                  : analytics.reminderEffectiveness.effectiveness ===
                    "moderately_effective"
                  ? "moderately effective"
                  : "low effectiveness"}
              </strong>
              . Owner engagement indicates{" "}
              {analytics.reminderEffectiveness.responseTrend === "up"
                ? "improving trend"
                : analytics.reminderEffectiveness.responseTrend === "down"
                ? "declining trend"
                : "stable trend"}
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TAB: FALSE POSITIVES
// =============================================================================

function FalsePositivesTab({
  analytics,
  loading,
  errors,
}: {
  analytics: AnalyticsState;
  loading: LoadingState;
  errors: ErrorState;
}) {
  if (loading.falsePositiveMetrics) return <AnalyticsLoadingPlaceholder />;
  if (errors.falsePositiveMetrics)
    return <AnalyticsErrorState message={errors.falsePositiveMetrics} />;
  if (!analytics.falsePositiveMetrics) 
    return <AnalyticsEmptyState message={getEmptyStateMessage('false-positives', 0, 7)} />;

  const reasonsData = transformFalsePositiveReasons(
    analytics.falsePositiveMetrics?.commonReasons,
  );

  // Calculate false positive insight
  const fpRate = parseFloat(analytics.falsePositiveMetrics?.falsePositiveRate ?? "0");
  const falsePositiveInsight = getFalsePositiveInsight(fpRate);

  return (
    <div className="space-y-6">
      {/* Operational Insight */}
      <HealthStatus {...falsePositiveInsight} />

      {/* False Positive Rate */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
          Overall False Positive Rate
        </p>
        <p className="mt-3 text-4xl font-bold text-red-600 dark:text-red-400">
          {analytics.falsePositiveMetrics.falsePositiveRate}
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {analytics.falsePositiveMetrics.totalFalsePositives} false positives
          out of stale flagged inventory
        </p>
      </div>

      {/* Common Reasons */}
      {reasonsData.length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold text-navy dark:text-white">
            Common False Positive Reasons
          </h3>
          <BarChartComponent data={reasonsData} color="#ef4444" height={300} />
        </div>
      )}

      {/* Trend Assessment */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-900/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 text-orange-600 dark:text-orange-400" />
          <div>
            <p className="font-semibold text-orange-900 dark:text-orange-100">
              False Positive Trend
            </p>
            <p className="mt-1 text-sm text-orange-800 dark:text-orange-200">
              False positive rate is{" "}
              <strong>
                {analytics.falsePositiveMetrics.trend === "up"
                  ? "increasing"
                  : analytics.falsePositiveMetrics.trend === "down"
                  ? "decreasing"
                  : "stable"}
              </strong>
              . Consider reviewing scoring criteria if rate exceeds 20%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TAB: WORKLOAD
// =============================================================================

function WorkloadTab({
  analytics,
  loading,
  errors,
}: {
  analytics: AnalyticsState;
  loading: LoadingState;
  errors: ErrorState;
}) {
  if (loading.adminWorkload) return <AnalyticsLoadingPlaceholder />;
  if (errors.adminWorkload)
    return <AnalyticsErrorState message={errors.adminWorkload} />;
  if (!analytics.adminWorkload) 
    return <AnalyticsEmptyState message={getEmptyStateMessage('workload', 0, 7)} />;

  const data =
      (analytics.adminWorkload?.historicalData ?? []).map((h) => ({
        date: formatChartDate(h.date),
        queue: h.queueSize ?? 0,
        reviews: h.reviewsCompleted ?? 0,
      }));

  // Calculate workload insight
  const workloadInsight = getWorkloadInsight(
      analytics.adminWorkload?.averageQueueSize ?? 0,
      analytics.adminWorkload?.totalReviewsCompleted ?? 0,
    );

  return (
    <div className="space-y-6">
      {/* Operational Insight */}
      <HealthStatus {...workloadInsight} />

      {/* Queue Size Trend */}
      <div>
        <h3 className="mb-4 font-semibold text-navy dark:text-white">
          Review Queue Size
        </h3>
        <AreaChartComponent
          data={data}
          area={{
            key: "queue",
            name: "Queue Size (stale + dead)",
            color: "#ef4444",
          }}
          height={300}
        />
      </div>

      {/* Reviews Completed Trend */}
      <div>
        <h3 className="mb-4 font-semibold text-navy dark:text-white">
          Reviews Completed Per Day
        </h3>
        <TrendLineChart
          data={data}
          lines={[
            { key: "reviews", name: "Reviews Completed", color: "#3b82f6" },
          ]}
          height={300}
        />
      </div>

      {/* Workload Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Avg Queue Size
          </p>
          <p className="mt-3 text-3xl font-bold text-red-600 dark:text-red-400">
            {Math.round(analytics.adminWorkload.averageQueueSize)}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Average pending reviews
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Reviews/Day
          </p>
          <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round(analytics.adminWorkload.reviewsPerDay)}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Average reviews per day
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Total Reviewed
          </p>
          <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {analytics.adminWorkload.totalReviewsCompleted}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            In {analytics.adminWorkload.rangeInDays}d period
          </p>
        </div>
      </div>

      {/* Disable Patterns */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Admin Disables
          </p>
          <p className="mt-3 text-2xl font-bold text-orange-600 dark:text-orange-400">
            {analytics.adminWorkload.adminDisables}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Admin-initiated suspensions
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Owner Disables
          </p>
          <p className="mt-3 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {analytics.adminWorkload.ownerRequestedDisables}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Owner-requested disables
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TAB: OPERATIONAL CONSISTENCY
// =============================================================================

function ConsistencyTab({
  analytics,
  loading,
  errors,
}: {
  analytics: AnalyticsState;
  loading: LoadingState;
  errors: ErrorState;
}) {
  if (loading.operationalConsistency) return <AnalyticsLoadingPlaceholder />;
  if (errors.operationalConsistency)
    return <AnalyticsErrorState message={errors.operationalConsistency} />;
  if (!analytics.operationalConsistency) 
    return <AnalyticsEmptyState message={getEmptyStateMessage('consistency', 0, 7)} />;

  const consistency = analytics.operationalConsistency;

  // Calculate consistency insight
  const consistencyInsight = getConsistencyInsight(
    consistency.valid,
    consistency.issues.length,
  );

  return (
    <div className="space-y-6">
      {/* Operational Insight */}
      <HealthStatus {...consistencyInsight} />

      {/* Status */}
      <div
        className={`rounded-lg border p-4 ${
          consistency.valid
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20"
            : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20"
        }`}
      >
        <div className="flex items-center gap-3">
          {consistency.valid ? (
            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          )}
          <div>
            <p
              className={`font-semibold ${
                consistency.valid
                  ? "text-emerald-900 dark:text-emerald-100"
                  : "text-red-900 dark:text-red-100"
              }`}
            >
              {consistency.valid
                ? "Data Quality: Healthy"
                : "Data Quality: Issues Detected"}
            </p>
            <p
              className={`mt-1 text-sm ${
                consistency.valid
                  ? "text-emerald-800 dark:text-emerald-200"
                  : "text-red-800 dark:text-red-200"
              }`}
            >
              {consistency.valid
                ? "No operational consistency issues detected. Marketplace data is healthy."
                : `${consistency.issues.length} issue(s) detected. Review recommendations below.`}
            </p>
          </div>
        </div>
      </div>

      {/* Issues */}
      {(consistency.issues ?? []).length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold text-navy dark:text-white">
            Detected Issues
          </h3>
          <div className="space-y-3">
            {(consistency.issues ?? []).map((issue, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20"
              >
                <p className="text-sm text-red-800 dark:text-red-200">
                  • {issue}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {(consistency.recommendations ?? []).length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold text-navy dark:text-white">
            Recommendations
          </h3>
          <div className="space-y-3">
            {(consistency.recommendations ?? []).map((rec, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-900/20"
              >
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  • {rec}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Checked */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Last checked: {new Date(consistency.snapshotDate).toLocaleString()}
      </div>
    </div>
  );
}
