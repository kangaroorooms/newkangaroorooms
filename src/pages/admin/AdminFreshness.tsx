import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Clipboard,
  BarChart3,
  Home,
  MessageCircle,
  Search,
  ShieldAlert,
  ThumbsUp,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  adminApi,
  FreshnessCategory,
  InactiveOwnerFreshness,
  MarketplaceHealthMetrics,
  OwnerRiskCategory,
  ReminderLogResponse,
  StalePropertyFreshness,
} from '../../api/admin.api';
import { PaginationMeta } from '../../types/api.types';
import { showToast } from '../../store/slices/ui.slice';
import { useAppDispatch } from '../../store/hooks';
import { AdminAnalyticsDashboard } from '../../components/admin/AdminAnalyticsDashboard';
import { ActionMenu } from '../../components/admin/ActionMenu';
import { HealthStatus } from '../../components/admin/HealthStatus';
import {
  getMarketplaceHealthInsight,
  getRecoveryInsight,
  getReminderInsight,
  getOwnerResponsivenessInsight,
  getWorkloadInsight,
} from '../../utils/operationalInsights';

type TabKey = 'properties' | 'owners' | 'analytics';

const categoryStyles: Record<FreshnessCategory, string> = {
  fresh: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  aging: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  stale: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  dead: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
};

const riskStyles: Record<OwnerRiskCategory, string> = {
  healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  watch: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  inactive: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
};

const priorityStyles = {
  high_risk_stale: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  medium_risk: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
  recently_aging: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  recoverable_inventory: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  dead_inventory: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700',
};

const labelize = (value: string) => value.toLowerCase().replace(/_/g, ' ');

const Badge = ({ label, className }: { label: string; className: string }) => (
  <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${className}`}>
    {label}
  </span>
);

const MetricBlock = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-navy dark:text-white">{value}</p>
    {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
  </div>
);

export function AdminFreshness() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<TabKey>('properties');
  const [health, setHealth] = useState<MarketplaceHealthMetrics | null>(null);
  const [properties, setProperties] = useState<StalePropertyFreshness[]>([]);
  const [owners, setOwners] = useState<InactiveOwnerFreshness[]>([]);
  const [propertyMeta, setPropertyMeta] = useState<PaginationMeta | null>(null);
  const [ownerMeta, setOwnerMeta] = useState<PaginationMeta | null>(null);
  const [propertyPage, setPropertyPage] = useState(1);
  const [ownerPage, setOwnerPage] = useState(1);
  const [propertyCategory, setPropertyCategory] = useState<FreshnessCategory | 'all'>('all');
  const [ownerRisk, setOwnerRisk] = useState<OwnerRiskCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reminder, setReminder] = useState<ReminderLogResponse | null>(null);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const trendIcon = useMemo(() => {
    if (!health) return Activity;
    if (health.trend.direction === 'up') return ArrowUp;
    if (health.trend.direction === 'down') return ArrowDown;
    return Activity;
  }, [health]);

  const TrendIcon = trendIcon;

  const fetchHealth = useCallback(async () => {
    const metrics = await adminApi.getFreshnessHealthMetrics();
    setHealth(metrics);
  }, []);

  const fetchProperties = useCallback(async (signal?: AbortSignal) => {
    const result = await adminApi.getStaleProperties({
      page: propertyPage,
      limit: 10,
      category: propertyCategory,
      search: search.trim() || undefined,
      sort: 'days_desc',
    }, signal);

    setProperties(result.data);
    setPropertyMeta(result.meta);
  }, [propertyCategory, propertyPage, search]);

  const fetchOwners = useCallback(async (signal?: AbortSignal) => {
    const result = await adminApi.getInactiveOwners({
      page: ownerPage,
      limit: 10,
      riskCategory: ownerRisk,
      search: search.trim() || undefined,
      sort: 'risk_desc',
    }, signal);

    setOwners(result.data);
    setOwnerMeta(result.meta);
  }, [ownerPage, ownerRisk, search]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    Promise.all([
      fetchHealth(),
      fetchProperties(controller.signal),
      fetchOwners(controller.signal),
    ]).catch((error) => {
      if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
        dispatch(showToast({ message: 'Failed to load freshness dashboard', type: 'error' }));
      }
    }).finally(() => setLoading(false));

    return () => controller.abort();
  }, [dispatch, fetchHealth, fetchOwners, fetchProperties]);

  const refreshDashboard = async () => {
    await Promise.all([
      fetchHealth(),
      fetchProperties(),
      fetchOwners(),
    ]);
  };

  const generatePropertyReminder = async (property: StalePropertyFreshness) => {
    setGeneratingKey(property.id);
    try {
      const result = await adminApi.generateFreshnessReminder({
        ownerId: property.ownerId,
        propertyId: property.id,
        type: 'PROPERTY_STALE',
      });
      setReminder(result);
      dispatch(showToast({ message: 'Reminder generated', type: 'success' }));
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || 'Failed to generate reminder', type: 'error' }));
    } finally {
      setGeneratingKey(null);
    }
  };

  const recordPropertyReview = async (
    property: StalePropertyFreshness,
    decision: Parameters<typeof adminApi.recordFreshnessReview>[0]['decision'],
    extras: Partial<Parameters<typeof adminApi.recordFreshnessReview>[0]> = {}
  ) => {
    setActionKey(`${property.id}:${decision}`);
    try {
      await adminApi.recordFreshnessReview({
        ownerId: property.ownerId,
        propertyId: property.id,
        decision,
        ...extras,
      });
      await refreshDashboard();
      dispatch(showToast({ message: 'Freshness review recorded', type: 'success' }));
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || 'Failed to record review', type: 'error' }));
    } finally {
      setActionKey(null);
    }
  };

  const ignorePropertyTemporarily = (property: StalePropertyFreshness) => {
    const ignoreUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    recordPropertyReview(property, 'IGNORE_TEMPORARILY', {
      ignoreUntil,
      followUpStatus: 'CLOSED',
      notes: 'Temporarily ignored from freshness review queue for 14 days.',
    });
  };

  const manuallyDisableProperty = async (property: StalePropertyFreshness) => {
    const confirmed = window.confirm(
      `Manually suspend "${property.title}" as stale inventory?\n\nThis uses the existing admin suspend workflow and will hide the property from tenants.`
    );

    if (!confirmed) return;

    setActionKey(`${property.id}:MANUAL_DISABLE`);
    try {
      await adminApi.suspendProperty(property.id, 'Manual stale inventory disable after admin freshness review');
      await adminApi.recordFreshnessReview({
        ownerId: property.ownerId,
        propertyId: property.id,
        decision: 'MANUAL_DISABLE_COMPLETED',
        followUpStatus: 'CLOSED',
        notes: 'Admin manually disabled stale inventory using existing suspend workflow.',
      });
      await refreshDashboard();
      dispatch(showToast({ message: 'Property manually suspended', type: 'success' }));
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || 'Failed to manually suspend property', type: 'error' }));
    } finally {
      setActionKey(null);
    }
  };

  const generateOwnerReminder = async (owner: InactiveOwnerFreshness) => {
    setGeneratingKey(owner.ownerId);
    try {
      const result = await adminApi.generateFreshnessReminder({
        ownerId: owner.ownerId,
        type: 'OWNER_INACTIVE',
      });
      setReminder(result);
      dispatch(showToast({ message: 'Reminder generated', type: 'success' }));
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || 'Failed to generate reminder', type: 'error' }));
    } finally {
      setGeneratingKey(null);
    }
  };

  const markReminderSent = async () => {
    if (!reminder) return;
    try {
      const updated = await adminApi.updateFreshnessReminderTracking(reminder.id, {
        manualSentAt: new Date().toISOString(),
        responseStatus: 'PENDING',
      });
      setReminder(updated);
      dispatch(showToast({ message: 'Reminder marked sent', type: 'success' }));
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || 'Failed to update reminder', type: 'error' }));
    }
  };

  const markReminderResponded = async () => {
    if (!reminder) return;
    try {
      const updated = await adminApi.updateFreshnessReminderTracking(reminder.id, {
        ownerRespondedAt: new Date().toISOString(),
        responseStatus: 'RESPONDED',
        outcome: 'OWNER_RESPONDED',
      });
      setReminder(updated);
      await refreshDashboard();
      dispatch(showToast({ message: 'Owner response recorded', type: 'success' }));
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || 'Failed to update reminder', type: 'error' }));
    }
  };

  const copyReminder = async () => {
    if (!reminder) return;
    await navigator.clipboard.writeText(reminder.message);
    dispatch(showToast({ message: 'Reminder copied', type: 'success' }));
  };

  return (
    <div className="min-h-screen bg-cream pt-20 transition-colors duration-300 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-playfair text-2xl font-bold text-navy dark:text-white md:text-3xl">
              Marketplace Freshness
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Approved active inventory, engagement signals, and reminder prep
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPropertyPage(1);
                setOwnerPage(1);
              }}
              placeholder="Search owner or property"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-navy shadow-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />
          </div>
        </div>

        {/* OPERATIONAL INSIGHTS: Marketplace Health */}
        <div className="mb-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Marketplace Overview
          </h3>
          {health && (
            <HealthStatus
              {...getMarketplaceHealthInsight(
                health.freshInventoryPercent,
                health.staleInventoryPercent,
                health.deadInventoryPercent,
                health.totalActiveInventory
              )}
            />
          )}
        </div>

        {/* OPERATIONAL INSIGHTS: System Performance */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Recovery Effectiveness */}
          {health && (
            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recovery</h3>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                {getRecoveryInsight(health.recoveredInventoryPercent, health.recoveredInventory).message}
              </p>
              {getRecoveryInsight(health.recoveredInventoryPercent, health.recoveredInventory).guidance && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  💡 {getRecoveryInsight(health.recoveredInventoryPercent, health.recoveredInventory).guidance}
                </p>
              )}
            </div>
          )}

          {/* Reminder Effectiveness */}
          {health && (
            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Reminders</h3>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                {getReminderInsight(health.reminderSuccessRate, health.successfulReminders, health.remindersGenerated).message}
              </p>
              {getReminderInsight(health.reminderSuccessRate, health.successfulReminders, health.remindersGenerated).guidance && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  💡 {getReminderInsight(health.reminderSuccessRate, health.successfulReminders, health.remindersGenerated).guidance}
                </p>
              )}
            </div>
          )}

          {/* Owner Responsiveness */}
          {health && (
            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Owner Response</h3>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                {getOwnerResponsivenessInsight(health.ownerResponsivenessRate, health.ownerResponses, health.remindersSent).message}
              </p>
              {getOwnerResponsivenessInsight(health.ownerResponsivenessRate, health.ownerResponses, health.remindersSent).guidance && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  💡 {getOwnerResponsivenessInsight(health.ownerResponsivenessRate, health.ownerResponses, health.remindersSent).guidance}
                </p>
              )}
            </div>
          )}

          {/* Admin Workload */}
          {health && (
            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Review Workload</h3>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                {getWorkloadInsight(health.adminReviewWorkload, health.totalActiveInventory).message}
              </p>
              {getWorkloadInsight(health.adminReviewWorkload, health.totalActiveInventory).guidance && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  💡 {getWorkloadInsight(health.adminReviewWorkload, health.totalActiveInventory).guidance}
                </p>
              )}
            </div>
          )}
        </div>

        {/* QUICK STATS: Detailed numbers for reference */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricBlock label="Active Inventory" value={health?.totalActiveInventory ?? 0} />
          <MetricBlock label="Fresh" value={`${health?.freshInventoryPercent ?? 0}%`} sub={`${health?.freshInventory ?? 0} listings`} />
          <MetricBlock label="Stale" value={`${health?.staleInventoryPercent ?? 0}%`} sub={`${health?.staleInventory ?? 0} listings`} />
          <MetricBlock label="Dead" value={`${health?.deadInventoryPercent ?? 0}%`} sub={`${health?.deadInventory ?? 0} listings`} />
          <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Trend</p>
              <TrendIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <p className="mt-1 text-2xl font-bold capitalize text-navy dark:text-white">{health?.trend.direction ?? 'flat'}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {health?.trend.delta ?? 0} events
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('properties')}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'properties' ? 'border-navy text-navy dark:border-white dark:text-white' : 'border-transparent text-slate-500 hover:text-navy dark:text-slate-400 dark:hover:text-white'}`}
            >
              <Home className="h-4 w-4" />
              Stale Properties
            </button>
            <button
              onClick={() => setActiveTab('owners')}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'owners' ? 'border-navy text-navy dark:border-white dark:text-white' : 'border-transparent text-slate-500 hover:text-navy dark:text-slate-400 dark:hover:text-white'}`}
            >
              <UserRound className="h-4 w-4" />
              Inactive Owners
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'analytics' ? 'border-navy text-navy dark:border-white dark:text-white' : 'border-transparent text-slate-500 hover:text-navy dark:text-slate-400 dark:hover:text-white'}`}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
          </div>

          {activeTab === 'properties' ? (
            <select
              value={propertyCategory}
              onChange={(event) => {
                setPropertyCategory(event.target.value as FreshnessCategory | 'all');
                setPropertyPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">All categories</option>
              <option value="fresh">Fresh</option>
              <option value="aging">Aging</option>
              <option value="stale">Stale</option>
              <option value="dead">Dead</option>
            </select>
          ) : activeTab === 'owners' ? (
            <select
              value={ownerRisk}
              onChange={(event) => {
                setOwnerRisk(event.target.value as OwnerRiskCategory | 'all');
                setOwnerPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">All risk levels</option>
              <option value="healthy">Healthy</option>
              <option value="watch">Watch</option>
              <option value="inactive">Inactive</option>
              <option value="critical">Critical</option>
            </select>
          ) : null}
        </div>

        {activeTab === 'analytics' ? (
          <AdminAnalyticsDashboard />
        ) : loading ? (
          <div className="rounded-lg border border-slate-100 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-navy dark:border-white" />
          </div>
        ) : activeTab === 'properties' ? (
          <PropertiesTable
            properties={properties}
            meta={propertyMeta}
            page={propertyPage}
            setPage={setPropertyPage}
            generateReminder={generatePropertyReminder}
            recordReview={recordPropertyReview}
            ignoreTemporarily={ignorePropertyTemporarily}
            manuallyDisable={manuallyDisableProperty}
            generatingKey={generatingKey}
            actionKey={actionKey}
          />
        ) : (
          <OwnersTable
            owners={owners}
            meta={ownerMeta}
            page={ownerPage}
            setPage={setOwnerPage}
            generateReminder={generateOwnerReminder}
            generatingKey={generatingKey}
          />
        )}
      </div>

      {reminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-slate-800">
            <div className="border-b border-slate-200 p-5 dark:border-slate-700">
              <h2 className="text-lg font-bold text-navy dark:text-white">Generated Reminder</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {reminder.owner.name}{reminder.property ? ` • ${reminder.property.title}` : ''}
              </p>
            </div>
            <div className="p-5">
              <textarea
                readOnly
                value={reminder.message}
                className="h-56 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex gap-3 border-t border-slate-200 p-5 dark:border-slate-700">
              <button
                onClick={copyReminder}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-navy dark:hover:bg-slate-100"
              >
                <Clipboard className="h-4 w-4" />
                Copy Message
              </button>
              <button
                onClick={markReminderSent}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <MessageCircle className="h-4 w-4" />
                Mark Sent
              </button>
              <button
                onClick={markReminderResponded}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <ThumbsUp className="h-4 w-4" />
                Responded
              </button>
              <button
                onClick={() => setReminder(null)}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertiesTable({
  properties,
  meta,
  page,
  setPage,
  generateReminder,
  recordReview,
  ignoreTemporarily,
  manuallyDisable,
  generatingKey,
  actionKey,
}: {
  properties: StalePropertyFreshness[];
  meta: PaginationMeta | null;
  page: number;
  setPage: (page: number) => void;
  generateReminder: (property: StalePropertyFreshness) => void;
  recordReview: (
    property: StalePropertyFreshness,
    decision: Parameters<typeof adminApi.recordFreshnessReview>[0]['decision'],
    extras?: Partial<Parameters<typeof adminApi.recordFreshnessReview>[0]>
  ) => void;
  ignoreTemporarily: (property: StalePropertyFreshness) => void;
  manuallyDisable: (property: StalePropertyFreshness) => void;
  generatingKey: string | null;
  actionKey: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Property</th>
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold">No Engagement</th>
              <th className="px-4 py-3 font-semibold">Recent Views</th>
              <th className="px-4 py-3 font-semibold">Recent Contacts</th>
              <th className="px-4 py-3 font-semibold">Freshness</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Confidence</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {properties.map((property) => (
              <tr key={property.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3">
                  <p className="max-w-[220px] truncate font-semibold text-navy dark:text-white">{property.title}</p>
                  <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500 dark:text-slate-400">{property.location}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{property.ownerName}</td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{property.city}</td>
                <td className="px-4 py-3 text-sm font-semibold text-navy dark:text-white">{property.daysWithoutEngagement}d</td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{property.recentViews}</td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{property.recentContacts}</td>
                <td className="px-4 py-3">
                  <Badge label={property.freshnessCategory} className={categoryStyles[property.freshnessCategory]} />
                </td>
                <td className="px-4 py-3">
                  <Badge label={labelize(property.priorityCategory)} className={priorityStyles[property.priorityCategory]} />
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-navy dark:text-white">{property.confidenceScore}/100</div>
                  <div className="text-xs capitalize text-slate-500 dark:text-slate-400">{property.engagementTrendDirection}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {/* Primary Actions: View Property + Generate */}
                    <Link to={`/admin/properties/${property.id}`} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                      View
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => generateReminder(property)}
                      disabled={generatingKey === property.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-navy dark:hover:bg-slate-100"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Gen
                    </button>

                    {/* Secondary Actions in Dropdown */}
                    <ActionMenu
                      label="…"
                      items={[
                        {
                          label: 'View Owner',
                          onClick: () => {
                            window.location.href = `/admin/users?search=${encodeURIComponent(property.ownerName)}`;
                          },
                        },
                        {
                          label: 'Mark Active',
                          onClick: () => recordReview(property, 'MARK_PROPERTY_ACTIVE', {
                            ownerResponse: 'CONFIRMED_AVAILABLE',
                            followUpStatus: 'CLOSED',
                            confidenceOverride: 95,
                          }),
                          disabled: actionKey === `${property.id}:MARK_PROPERTY_ACTIVE`,
                          variant: 'success',
                        },
                        {
                          label: 'False Positive',
                          onClick: () => recordReview(property, 'MARK_FALSE_POSITIVE', {
                            falsePositiveReason: 'OWNER_CONFIRMED',
                            followUpStatus: 'CLOSED',
                            confidenceOverride: 90,
                          }),
                          disabled: actionKey === `${property.id}:MARK_FALSE_POSITIVE`,
                          variant: 'warning',
                        },
                        {
                          label: 'Confirmed',
                          onClick: () => recordReview(property, 'OWNER_CONFIRMED_AVAILABLE', {
                            ownerResponse: 'CONFIRMED_AVAILABLE',
                            followUpStatus: 'CLOSED',
                            confidenceOverride: 92,
                          }),
                          disabled: actionKey === `${property.id}:OWNER_CONFIRMED_AVAILABLE`,
                          variant: 'success',
                        },
                        {
                          label: 'Follow-up',
                          onClick: () => recordReview(property, 'MARK_NEEDS_FOLLOW_UP', {
                            followUpStatus: 'NEEDS_FOLLOW_UP',
                          }),
                          disabled: actionKey === `${property.id}:MARK_NEEDS_FOLLOW_UP`,
                          variant: 'warning',
                        },
                        {
                          label: 'Ignore',
                          onClick: () => ignoreTemporarily(property),
                          disabled: actionKey === `${property.id}:IGNORE_TEMPORARILY`,
                        },
                        {
                          label: 'Disable',
                          onClick: () => manuallyDisable(property),
                          disabled: actionKey === `${property.id}:MANUAL_DISABLE`,
                          variant: 'danger',
                        },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
    </div>
  );
}

function OwnersTable({
  owners,
  meta,
  page,
  setPage,
  generateReminder,
  generatingKey,
}: {
  owners: InactiveOwnerFreshness[];
  meta: PaginationMeta | null;
  page: number;
  setPage: (page: number) => void;
  generateReminder: (owner: InactiveOwnerFreshness) => void;
  generatingKey: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-4 py-3 font-semibold">Active Properties</th>
              <th className="px-4 py-3 font-semibold">Average Freshness</th>
              <th className="px-4 py-3 font-semibold">Last Engagement</th>
              <th className="px-4 py-3 font-semibold">Risk</th>
              <th className="px-4 py-3 font-semibold">Signals</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {owners.map((owner) => (
              <tr key={owner.ownerId} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy dark:text-white">{owner.ownerName}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{owner.ownerEmail}</p>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-navy dark:text-white">{owner.activePropertyCount}</td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{owner.averageFreshnessScore}/100</td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{owner.daysSinceLastEngagement}d ago</td>
                <td className="px-4 py-3">
                  <Badge label={owner.riskCategory} className={riskStyles[owner.riskCategory]} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {owner.recentViews} views • {owner.recentContacts} contacts
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/users?search=${encodeURIComponent(owner.ownerName)}`} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                      View
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => generateReminder(owner)}
                      disabled={generatingKey === owner.ownerId}
                      className="inline-flex items-center gap-1 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-navy dark:hover:bg-slate-100"
                    >
                      <ShieldAlert className="h-3 w-3" />
                      Gen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} page={page} setPage={setPage} />
    </div>
  );
}

function Pagination({
  meta,
  page,
  setPage,
}: {
  meta: PaginationMeta | null;
  page: number;
  setPage: (page: number) => void;
}) {
  if (!meta) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Page <span className="font-semibold text-navy dark:text-white">{meta.page}</span> of{' '}
        <span className="font-semibold text-navy dark:text-white">{meta.totalPages || 1}</span> • {meta.total} records
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= (meta.totalPages || 1)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}
