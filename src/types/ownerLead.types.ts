export enum OwnerLeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  INTERESTED = 'INTERESTED',
  FOLLOW_UP = 'FOLLOW_UP',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PROPERTY_UPLOAD_PENDING = 'PROPERTY_UPLOAD_PENDING',
  PROPERTY_UPLOADING = 'PROPERTY_UPLOADING',
  PROPERTY_SUBMITTED = 'PROPERTY_SUBMITTED',
  PROPERTY_APPROVED = 'PROPERTY_APPROVED',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  TRANSFERRED = 'TRANSFERRED',
}

export interface LeadPerson {
  id: string;
  name: string;
  phone?: string | null;
}

export interface OwnerLeadActivity {
  id: string;
  leadId: string;
  type: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
  actor?: LeadPerson | null;
}

export interface OwnerLeadNote {
  id: string;
  leadId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: LeadPerson;
}

export interface OwnerLeadPhoto {
  id: string;
  leadId: string;
  url: string;
  publicId?: string | null;
  createdAt: string;
  uploadedBy?: LeadPerson;
}

export interface OwnerLead {
  id: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string | null;
  city: string;
  locality?: string | null;
  address?: string | null;
  landmark?: string | null;
  leadSource: string;
  createdByAgentId?: string | null;
  assignedAgentId?: string | null;
  createdByAdminId?: string | null;
  status: OwnerLeadStatus;
  expiryDate: string;
  convertedOwnerId?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  createdByAgent?: LeadPerson | null;
  assignedAgent?: LeadPerson | null;
  createdByAdmin?: LeadPerson | null;
  convertedOwner?: LeadPerson | null;
  activities?: OwnerLeadActivity[];
  leadNotes?: OwnerLeadNote[];
  photos?: OwnerLeadPhoto[];
  shares?: Array<{ id: string; sharedWithId: string; sharedWith: LeadPerson }>;
}

export interface OwnerLeadFilters {
  page?: number;
  limit?: number;
  phone?: string;
  name?: string;
  city?: string;
  status?: OwnerLeadStatus;
  agentId?: string;
  includeDeleted?: boolean;
}

export interface OwnerLeadFormInput {
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  city: string;
  locality?: string;
  address?: string;
  landmark?: string;
  leadSource: string;
  notes?: string;
  assignedAgentId?: string | null;
}

export interface OwnerLeadPageResponse {
  data: OwnerLead[];
  meta: { page: number; limit: number; total: number; hasNextPage: boolean };
}
