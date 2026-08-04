import { OwnerLead, OwnerLeadStatus } from '../types/ownerLead.types';

export interface OwnerLeadStatusAction {
  label: string;
  status: OwnerLeadStatus;
  tone?: 'primary' | 'default' | 'danger';
}

const quickStatusActions: Partial<Record<OwnerLeadStatus, OwnerLeadStatusAction[]>> = {
  [OwnerLeadStatus.NEW]: [
    { label: 'Mark contacted', status: OwnerLeadStatus.CONTACTED, tone: 'primary' },
    { label: 'Interested', status: OwnerLeadStatus.INTERESTED },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
  [OwnerLeadStatus.CONTACTED]: [
    { label: 'Interested', status: OwnerLeadStatus.INTERESTED, tone: 'primary' },
    { label: 'Follow up', status: OwnerLeadStatus.FOLLOW_UP },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
  [OwnerLeadStatus.INTERESTED]: [
    { label: 'Payment pending', status: OwnerLeadStatus.PAYMENT_PENDING, tone: 'primary' },
    { label: 'Follow up', status: OwnerLeadStatus.FOLLOW_UP },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
  [OwnerLeadStatus.FOLLOW_UP]: [
    { label: 'Interested', status: OwnerLeadStatus.INTERESTED, tone: 'primary' },
    { label: 'Payment pending', status: OwnerLeadStatus.PAYMENT_PENDING },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
  [OwnerLeadStatus.PAYMENT_PENDING]: [
    { label: 'Follow up', status: OwnerLeadStatus.FOLLOW_UP },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
  [OwnerLeadStatus.PAYMENT_RECEIVED]: [
    { label: 'Upload pending', status: OwnerLeadStatus.PROPERTY_UPLOAD_PENDING, tone: 'primary' },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
  [OwnerLeadStatus.PROPERTY_UPLOAD_PENDING]: [
    { label: 'Uploading', status: OwnerLeadStatus.PROPERTY_UPLOADING, tone: 'primary' },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
  [OwnerLeadStatus.PROPERTY_UPLOADING]: [
    { label: 'Submitted', status: OwnerLeadStatus.PROPERTY_SUBMITTED, tone: 'primary' },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
  [OwnerLeadStatus.PROPERTY_SUBMITTED]: [
    { label: 'Approved', status: OwnerLeadStatus.PROPERTY_APPROVED, tone: 'primary' },
    { label: 'Uploading', status: OwnerLeadStatus.PROPERTY_UPLOADING },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
  [OwnerLeadStatus.EXPIRED]: [
    { label: 'Follow up', status: OwnerLeadStatus.FOLLOW_UP, tone: 'primary' },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
  [OwnerLeadStatus.TRANSFERRED]: [
    { label: 'Mark contacted', status: OwnerLeadStatus.CONTACTED, tone: 'primary' },
    { label: 'Interested', status: OwnerLeadStatus.INTERESTED },
    { label: 'Payment pending', status: OwnerLeadStatus.PAYMENT_PENDING },
    { label: 'Reject', status: OwnerLeadStatus.REJECTED, tone: 'danger' },
  ],
};

export const normalizePhoneForWhatsApp = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const buildOwnerLeadShareText = (lead: OwnerLead) => [
  `Owner lead: ${lead.ownerName}`,
  `Phone: ${lead.phone}`,
  `City: ${lead.city}`,
  `Source: ${lead.leadSource}`,
  `Status: ${lead.status.replace(/_/g, ' ')}`,
].join('\n');

export const getOwnerLeadWhatsAppUrl = (lead: OwnerLead) => {
  const phone = normalizePhoneForWhatsApp(lead.phone);
  const message = encodeURIComponent(buildOwnerLeadShareText(lead));
  return `https://wa.me/${phone}?text=${message}`;
};

export const getOwnerLeadQuickStatusActions = (status: OwnerLeadStatus) => (
  quickStatusActions[status] ?? []
);

export const shareOwnerLead = async (lead: OwnerLead) => {
  if (typeof navigator === 'undefined') return false;

  const text = buildOwnerLeadShareText(lead);

  try {
    if (navigator.share) {
      await navigator.share({
        title: `${lead.ownerName} owner lead`,
        text,
      });
      return true;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  return false;
};
