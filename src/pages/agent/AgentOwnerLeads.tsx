import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOwnerLeads } from '../../store/slices/ownerLead.slice';
import { LeadCard } from '../../components/owner-leads/LeadCard';
import { OwnerLeadsPageLayout } from '../../components/owner-leads/OwnerLeadsPageLayout';

const DEFAULT_FILTERS = { page: 1, limit: 20 };

export function AgentOwnerLeads() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.ownerLead);

  const refreshLeads = useCallback(() => {
    dispatch(fetchOwnerLeads(DEFAULT_FILTERS));
  }, [dispatch]);

  useEffect(() => {
    refreshLeads();
  }, [refreshLeads]);

  return (
    <OwnerLeadsPageLayout title="My Owner Leads" description="Keep your field-acquired owner leads moving.">
      <div className="space-y-3">
        {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
        {loading && <p className="text-sm text-slate-500">Loading leads...</p>}
        {!loading && !items.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            No owner leads assigned to you yet.
          </div>
        )}
        {!loading && items.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
      </div>
    </OwnerLeadsPageLayout>
  );
}
