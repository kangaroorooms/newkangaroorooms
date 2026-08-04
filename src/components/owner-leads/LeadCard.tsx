import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock3, MapPin, MessageCircle, Pencil, PhoneCall, Share2 } from 'lucide-react';
import { OwnerLead, OwnerLeadStatus } from '../../types/ownerLead.types';
import { LeadStatusBadge } from './LeadStatusBadge';
import { getOwnerLeadQuickStatusActions, getOwnerLeadWhatsAppUrl, shareOwnerLead } from '../../utils/ownerLeadActions';

interface LeadCardProps {
  lead: OwnerLead;
  tag?: string;
  onEditLead?: (lead: OwnerLead) => void;
  onAdvanceStatus?: (leadId: string, status: OwnerLeadStatus) => void;
  statusActionLoading?: boolean;
}

const statusActionClass = {
  primary: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  default: 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
};

export function LeadCard({ lead, tag, onEditLead, onAdvanceStatus, statusActionLoading = false }: LeadCardProps) {
  const initials = lead.ownerName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase() || 'L';

  const propertyCount =
    typeof lead.metadata?.propertyCount === 'number'
      ? lead.metadata.propertyCount
      : 0;

  const createdLabel = new Date(lead.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const statusActions = getOwnerLeadQuickStatusActions(lead.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_-24px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">{lead.ownerName}</h3>
              <LeadStatusBadge status={lead.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="truncate">{lead.phone}</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {lead.city}
              </span>
            </div>
          </div>
        </div>
        {tag && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {tag}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <Clock3 className="h-4 w-4" />
          {createdLabel}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {lead.leadSource}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {propertyCount} properties
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-4 dark:border-slate-700">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-200">Assigned:</span>{' '}
          {lead.assignedAgent?.name || 'Unassigned'}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
            <PhoneCall className="h-4 w-4" /> Call
          </a>
          <a
            href={getOwnerLeadWhatsAppUrl(lead)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          {onEditLead && (
            <button
              type="button"
              onClick={() => onEditLead(lead)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => void shareOwnerLead(lead)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </div>

      {onAdvanceStatus && statusActions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {statusActions.map((action) => (
            <button
              key={action.status}
              type="button"
              onClick={() => onAdvanceStatus(lead.id, action.status)}
              disabled={statusActionLoading}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${statusActionClass[action.tone ?? 'default']}`}
            >
              {action.label}
              {action.tone === 'primary' && <ArrowUpRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
