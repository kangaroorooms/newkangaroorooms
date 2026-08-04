import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createOwnerLead, fetchOwnerLeads, updateOwnerLeadStatus } from '../../store/slices/ownerLead.slice';
import { LeadCard } from '../../components/owner-leads/LeadCard';
import { LeadForm } from '../../components/owner-leads/LeadForm';
import { OwnerLeadsPageLayout } from '../../components/owner-leads/OwnerLeadsPageLayout';
import { OwnerLeadFormInput, OwnerLeadStatus } from '../../types/ownerLead.types';
import { showToast } from '../../store/slices/ui.slice';

const DEFAULT_FILTERS = { page: 1, limit: 20 };

export function AdminOwnerLeads() {
  const dispatch = useAppDispatch();
  const { items, loading, creating, updatingStatus, error } = useAppSelector((state) => state.ownerLead);

  const refreshLeads = useCallback(() => {
    dispatch(fetchOwnerLeads(DEFAULT_FILTERS));
  }, [dispatch]);

  useEffect(() => {
    refreshLeads();
  }, [refreshLeads]);

  const handleSubmit = async (payload: OwnerLeadFormInput) => {
    try {
      await dispatch(createOwnerLead(payload)).unwrap();
      dispatch(showToast({ message: 'Owner lead created', type: 'success' }));
      refreshLeads();
    } catch (error) {
      const message = typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : 'Failed to create owner lead';

      dispatch(showToast({ message, type: 'error' }));
      throw error;
    }
  };

  const handleAdvanceStatus = async (leadId: string, status: OwnerLeadStatus) => {
    await dispatch(updateOwnerLeadStatus({ leadId, status })).unwrap();
    refreshLeads();
  };

  return (
    <OwnerLeadsPageLayout title="Owner Lead Management" description="Create and track field-acquired owner leads.">
      <LeadForm isAdmin isLoading={creating} onSubmit={handleSubmit} />
      <div className="space-y-3">
        {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
        {loading && <p className="text-sm text-slate-500">Loading leads...</p>}
        {!loading && !items.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            No owner leads yet.
          </div>
        )}
        {!loading && items.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onAdvanceStatus={handleAdvanceStatus}
            statusActionLoading={updatingStatus}
          />
        ))}
      </div>
    </OwnerLeadsPageLayout>
  );
}
