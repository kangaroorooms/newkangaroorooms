import axiosInstance from './axios';
import { ApiResponse, PaginationMeta } from '../types/api.types';
import { generateIdempotencyKey } from './bookings.api';
import {
  OwnerLead,
  OwnerLeadFilters,
  OwnerLeadFormInput,
  OwnerLeadStatus,
} from '../types/ownerLead.types';

const OWNER_LEAD_BASE = '/owner-leads';

export const listOwnerLeads = async (filters: OwnerLeadFilters = {}) => {
  const response = await axiosInstance.get<ApiResponse<OwnerLead[]> & { meta: PaginationMeta }>(
    OWNER_LEAD_BASE,
    { params: filters },
  );

  return {
    data: response.data.data,
    meta: response.data.meta || null,
  };
};

export const createOwnerLead = async (payload: OwnerLeadFormInput, idempotencyKey?: string) => {
  const key = idempotencyKey || generateIdempotencyKey();
  const response = await axiosInstance.post<ApiResponse<OwnerLead>>(OWNER_LEAD_BASE, payload, {
    headers: {
      'Idempotency-Key': key,
    },
  });
  return response.data.data;
};

export const getOwnerLead = async (leadId: string) => {
  const response = await axiosInstance.get<ApiResponse<OwnerLead>>(`${OWNER_LEAD_BASE}/${leadId}`);
  return response.data.data;
};

export const updateOwnerLeadStatus = async (
  leadId: string,
  payload: { status: OwnerLeadStatus; reason?: string },
) => {
  const response = await axiosInstance.patch<ApiResponse<OwnerLead>>(
    `${OWNER_LEAD_BASE}/${leadId}/status`,
    payload,
  );
  return response.data.data;
};

export const ownerLeadApi = {
  listOwnerLeads,
  createOwnerLead,
  getOwnerLead,
  updateOwnerLeadStatus,
};
