import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ownerLeadApi } from '../../api/ownerLead.api';
import { showToast } from './ui.slice';
import { OwnerLead, OwnerLeadFilters, OwnerLeadFormInput, OwnerLeadStatus } from '../../types/ownerLead.types';
import { PaginationMeta } from '../../types/api.types';

interface OwnerLeadState {
  items: OwnerLead[];
  meta: PaginationMeta | null;
  loading: boolean;
  creating: boolean;
  updatingStatus: boolean;
  error: string | null;
}

const initialState: OwnerLeadState = {
  items: [],
  meta: null,
  loading: false,
  creating: false,
  updatingStatus: false,
  error: null,
};

export const fetchOwnerLeads = createAsyncThunk(
  'ownerLead/fetchOwnerLeads',
  async (filters: OwnerLeadFilters = {}, { dispatch, rejectWithValue }) => {
    try {
      const response = await ownerLeadApi.listOwnerLeads(filters);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load owner leads';
      dispatch(showToast({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  },
);

export const createOwnerLead = createAsyncThunk(
  'ownerLead/createOwnerLead',
  async (payload: OwnerLeadFormInput, { rejectWithValue }) => {
    try {
      const lead = await ownerLeadApi.createOwnerLead(payload);
      return lead;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create owner lead';
      return rejectWithValue(message);
    }
  },
);

export const updateOwnerLeadStatus = createAsyncThunk(
  'ownerLead/updateOwnerLeadStatus',
  async ({ leadId, status, reason }: { leadId: string; status: OwnerLeadStatus; reason?: string }, { dispatch, rejectWithValue }) => {
    try {
      const lead = await ownerLeadApi.updateOwnerLeadStatus(leadId, { status, reason });
      dispatch(showToast({ message: 'Lead status updated', type: 'success' }));
      return lead;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update lead status';
      dispatch(showToast({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  },
);

const ownerLeadSlice = createSlice({
  name: 'ownerLead',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnerLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchOwnerLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createOwnerLead.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createOwnerLead.fulfilled, (state, action) => {
        state.creating = false;
        state.items = [action.payload, ...state.items.filter((lead) => lead.id !== action.payload.id)];
      })
      .addCase(createOwnerLead.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })
      .addCase(updateOwnerLeadStatus.pending, (state) => {
        state.updatingStatus = true;
        state.error = null;
      })
      .addCase(updateOwnerLeadStatus.fulfilled, (state, action) => {
        state.updatingStatus = false;
        state.items = state.items.map((lead) => (lead.id === action.payload.id ? action.payload : lead));
      })
      .addCase(updateOwnerLeadStatus.rejected, (state, action) => {
        state.updatingStatus = false;
        state.error = action.payload as string;
      });
  },
});

export default ownerLeadSlice.reducer;
