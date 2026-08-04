import React from 'react';
import { OwnerLeadStatus } from '../../types/ownerLead.types';

const statusStyles: Record<OwnerLeadStatus, string> = {
  [OwnerLeadStatus.NEW]: 'bg-slate-100 text-slate-700',
  [OwnerLeadStatus.CONTACTED]: 'bg-blue-100 text-blue-700',
  [OwnerLeadStatus.INTERESTED]: 'bg-emerald-100 text-emerald-700',
  [OwnerLeadStatus.FOLLOW_UP]: 'bg-amber-100 text-amber-700',
  [OwnerLeadStatus.PAYMENT_PENDING]: 'bg-orange-100 text-orange-700',
  [OwnerLeadStatus.PAYMENT_RECEIVED]: 'bg-green-100 text-green-700',
  [OwnerLeadStatus.PROPERTY_UPLOAD_PENDING]: 'bg-violet-100 text-violet-700',
  [OwnerLeadStatus.PROPERTY_UPLOADING]: 'bg-indigo-100 text-indigo-700',
  [OwnerLeadStatus.PROPERTY_SUBMITTED]: 'bg-cyan-100 text-cyan-700',
  [OwnerLeadStatus.PROPERTY_APPROVED]: 'bg-emerald-100 text-emerald-700',
  [OwnerLeadStatus.CONVERTED]: 'bg-green-100 text-green-700',
  [OwnerLeadStatus.EXPIRED]: 'bg-rose-100 text-rose-700',
  [OwnerLeadStatus.REJECTED]: 'bg-rose-100 text-rose-700',
  [OwnerLeadStatus.TRANSFERRED]: 'bg-sky-100 text-sky-700',
};

export function LeadStatusBadge({ status }: { status: OwnerLeadStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
