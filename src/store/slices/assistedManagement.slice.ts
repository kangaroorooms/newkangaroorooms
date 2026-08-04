import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { assistedManagementApi } from '../../api/assistedManagement.api';
import { showToast } from './ui.slice';
import {
  AssistedRequestWithTenant,
  RecommendedProperty,
  AssistedRequestFilters,
  AssignAgentRequest,
  UpdateWorkflowStatusRequest,
  AddRecommendationRequest,
  UpdateRecommendationRequest
} from '../../types/assistedManagement.types';
import { PaginationMeta } from '../../types/api.types';

/**
 * Assisted Management Slice
 *
 * Redux state for Assisted Request Management features.
 * Handles admin, agent, and tenant assisted request operations.
 */

interface AssistedManagementState {
  // Admin state
  adminRequests: AssistedRequestWithTenant[];
  adminRequestsMeta: PaginationMeta | null;
  adminRequestsLoading: boolean;
  adminRequestsError: string | null;

  // Agent state
  assignedRequests: AssistedRequestWithTenant[];
  assignedRequestsLoading: boolean;
  assignedRequestsError: string | null;

  // Recommendations state
  recommendedProperties: Record<string, RecommendedProperty[]>;
  recommendedPropertiesLoading: Record<string, boolean>;
  recommendedPropertiesError: Record<string, string | null>;

  // Action loading states
  assignAgentLoading: boolean;
  updateWorkflowStatusLoading: boolean;
  addRecommendationLoading: boolean;
  updateRecommendationLoading: boolean;
  deleteRecommendationLoading: boolean;
}

const initialState: AssistedManagementState = {
  // Admin state
  adminRequests: [],
  adminRequestsMeta: null,
  adminRequestsLoading: false,
  adminRequestsError: null,

  // Agent state
  assignedRequests: [],
  assignedRequestsLoading: false,
  assignedRequestsError: null,

  // Recommendations state
  recommendedProperties: {},
  recommendedPropertiesLoading: {},
  recommendedPropertiesError: {},

  // Action loading states
  assignAgentLoading: false,
  updateWorkflowStatusLoading: false,
  addRecommendationLoading: false,
  updateRecommendationLoading: false,
  deleteRecommendationLoading: false
};

// ============================================================================
// ADMIN THUNKS
// ============================================================================

export const fetchAdminAssistedRequests = createAsyncThunk(
  'assistedManagement/fetchAdminRequests',
  async (filters: AssistedRequestFilters = {}, { dispatch, rejectWithValue }) => {
    try {
      const response = await assistedManagementApi.getAdminAssistedRequests(filters);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch assisted requests';
      dispatch(showToast({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  }
);

export const assignAgentToRequest = createAsyncThunk(
  'assistedManagement/assignAgent',
  async ({ requestId, data }: { requestId: string; data: AssignAgentRequest }, { dispatch, rejectWithValue }) => {
    try {
      await assistedManagementApi.assignAgentToRequest(requestId, data);
      dispatch(showToast({ message: 'Agent assigned successfully', type: 'success' }));
      return { requestId, executiveId: data.executiveId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to assign agent';
      dispatch(showToast({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  }
);

// ============================================================================
// AGENT THUNKS
// ============================================================================

export const fetchAssignedRequests = createAsyncThunk(
  'assistedManagement/fetchAssignedRequests',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await assistedManagementApi.getAssignedRequests();
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch assigned requests';
      dispatch(showToast({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  }
);

export const updateWorkflowStatus = createAsyncThunk(
  'assistedManagement/updateWorkflowStatus',
  async ({ requestId, data }: { requestId: string; data: UpdateWorkflowStatusRequest }, { dispatch, rejectWithValue }) => {
    try {
      await assistedManagementApi.updateWorkflowStatus(requestId, data);
      dispatch(showToast({ message: 'Workflow status updated', type: 'success' }));
      return { requestId, workflowStatus: data.workflowStatus };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update workflow status';
      dispatch(showToast({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  }
);

export const addRecommendation = createAsyncThunk(
  'assistedManagement/addRecommendation',
  async ({ requestId, data }: { requestId: string; data: AddRecommendationRequest }, { dispatch, rejectWithValue }) => {
    try {
      await assistedManagementApi.addRecommendation(requestId, data);
      dispatch(showToast({ message: 'Recommendation added', type: 'success' }));
      return { requestId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add recommendation';
      dispatch(showToast({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  }
);

export const updateRecommendation = createAsyncThunk(
  'assistedManagement/updateRecommendation',
  async ({ recommendationId, data }: { recommendationId: string; data: UpdateRecommendationRequest }, { dispatch, rejectWithValue }) => {
    try {
      await assistedManagementApi.updateRecommendation(recommendationId, data);
      dispatch(showToast({ message: 'Recommendation updated', type: 'success' }));
      return { recommendationId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update recommendation';
      dispatch(showToast({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  }
);

export const deleteRecommendation = createAsyncThunk(
  'assistedManagement/deleteRecommendation',
  async ({ recommendationId, requestId }: { recommendationId: string; requestId: string }, { dispatch, rejectWithValue }) => {
    try {
      await assistedManagementApi.deleteRecommendation(recommendationId);
      dispatch(showToast({ message: 'Recommendation removed', type: 'success' }));
      return { recommendationId, requestId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove recommendation';
      dispatch(showToast({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  }
);

// ============================================================================
// TENANT THUNKS
// ============================================================================

export const fetchRecommendedProperties = createAsyncThunk(
  'assistedManagement/fetchRecommendedProperties',
  async (requestId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await assistedManagementApi.getRecommendedProperties(requestId);
      return { requestId, data: response };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch recommended properties';
      dispatch(showToast({ message, type: 'error' }));
      return rejectWithValue({ requestId, message });
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const assistedManagementSlice = createSlice({
  name: 'assistedManagement',
  initialState,
  reducers: {
    clearAdminRequests: (state) => {
      state.adminRequests = [];
      state.adminRequestsMeta = null;
      state.adminRequestsError = null;
    },
    clearAssignedRequests: (state) => {
      state.assignedRequests = [];
      state.assignedRequestsError = null;
    },
    clearRecommendedProperties: (state, action: { payload: string }) => {
      const requestId = action.payload;
      delete state.recommendedProperties[requestId];
      delete state.recommendedPropertiesLoading[requestId];
      delete state.recommendedPropertiesError[requestId];
    }
  },
  extraReducers: (builder) => {
    // Admin requests
    builder
      .addCase(fetchAdminAssistedRequests.pending, (state) => {
        state.adminRequestsLoading = true;
        state.adminRequestsError = null;
      })
      .addCase(fetchAdminAssistedRequests.fulfilled, (state, action) => {
        state.adminRequestsLoading = false;
        state.adminRequests = action.payload.data;
        state.adminRequestsMeta = action.payload.meta;
      })
      .addCase(fetchAdminAssistedRequests.rejected, (state, action) => {
        state.adminRequestsLoading = false;
        state.adminRequestsError = action.payload as string;
      });

    // Assign agent
    builder
      .addCase(assignAgentToRequest.pending, (state) => {
        state.assignAgentLoading = true;
      })
      .addCase(assignAgentToRequest.fulfilled, (state, action) => {
        state.assignAgentLoading = false;
        // Update the request with the assigned agent
        const request = state.adminRequests.find(r => r.id === action.payload.requestId);
        if (request) {
          request.assignedExecutiveId = action.payload.executiveId;
        }
      })
      .addCase(assignAgentToRequest.rejected, (state) => {
        state.assignAgentLoading = false;
      });

    // Assigned requests
    builder
      .addCase(fetchAssignedRequests.pending, (state) => {
        state.assignedRequestsLoading = true;
        state.assignedRequestsError = null;
      })
      .addCase(fetchAssignedRequests.fulfilled, (state, action) => {
        state.assignedRequestsLoading = false;
        state.assignedRequests = action.payload.data;
      })
      .addCase(fetchAssignedRequests.rejected, (state, action) => {
        state.assignedRequestsLoading = false;
        state.assignedRequestsError = action.payload as string;
      });

    // Update workflow status
    builder
      .addCase(updateWorkflowStatus.pending, (state) => {
        state.updateWorkflowStatusLoading = true;
      })
      .addCase(updateWorkflowStatus.fulfilled, (state, action) => {
        state.updateWorkflowStatusLoading = false;
        // Update the request with the new status
        const request = state.assignedRequests.find(r => r.id === action.payload.requestId);
        if (request) {
          request.workflowStatus = action.payload.workflowStatus;
        }
      })
      .addCase(updateWorkflowStatus.rejected, (state) => {
        state.updateWorkflowStatusLoading = false;
      });

    // Add recommendation
    builder
      .addCase(addRecommendation.pending, (state) => {
        state.addRecommendationLoading = true;
      })
      .addCase(addRecommendation.fulfilled, (state) => {
        state.addRecommendationLoading = false;
      })
      .addCase(addRecommendation.rejected, (state) => {
        state.addRecommendationLoading = false;
      });

    // Update recommendation
    builder
      .addCase(updateRecommendation.pending, (state) => {
        state.updateRecommendationLoading = true;
      })
      .addCase(updateRecommendation.fulfilled, (state) => {
        state.updateRecommendationLoading = false;
      })
      .addCase(updateRecommendation.rejected, (state) => {
        state.updateRecommendationLoading = false;
      });

    // Delete recommendation
    builder
      .addCase(deleteRecommendation.pending, (state) => {
        state.deleteRecommendationLoading = true;
      })
      .addCase(deleteRecommendation.fulfilled, (state, action) => {
        state.deleteRecommendationLoading = false;
        // Remove the recommendation from state
        const requestId = action.payload.requestId;
        const recommendations = state.recommendedProperties[requestId];
        if (recommendations) {
          state.recommendedProperties[requestId] = recommendations.filter(
            r => r.id !== action.payload.recommendationId
          );
        }
      })
      .addCase(deleteRecommendation.rejected, (state) => {
        state.deleteRecommendationLoading = false;
      });

    // Fetch recommended properties
    builder
      .addCase(fetchRecommendedProperties.pending, (state, action) => {
        const requestId = action.meta.arg;
        state.recommendedPropertiesLoading[requestId] = true;
        state.recommendedPropertiesError[requestId] = null;
      })
      .addCase(fetchRecommendedProperties.fulfilled, (state, action) => {
        const { requestId, data } = action.payload;
        state.recommendedPropertiesLoading[requestId] = false;
        state.recommendedProperties[requestId] = data.data;
      })
      .addCase(fetchRecommendedProperties.rejected, (state, action) => {
        const { requestId, message } = action.payload as { requestId: string; message: string };
        state.recommendedPropertiesLoading[requestId] = false;
        state.recommendedPropertiesError[requestId] = message;
      });
  }
});

export const {
  clearAdminRequests,
  clearAssignedRequests,
  clearRecommendedProperties
} = assistedManagementSlice.actions;

export default assistedManagementSlice.reducer;
