import axiosInstance from './axios';
import { ApiResponse } from '../types/api.types';
import {
  AssistedRequestFilters,
  AssignAgentRequest,
  UpdateWorkflowStatusRequest,
  AddRecommendationRequest,
  UpdateRecommendationRequest,
  AdminAssistedRequestsResponse,
  AssignedRequestsResponse,
  RecommendedPropertiesResponse
} from '../types/assistedManagement.types';
import { assertValidParam } from '../utils/apiGuard';

/**
 * Assisted Management API
 * 
 * API service for Assisted Request Management features.
 * Handles admin, agent, and tenant assisted request operations.
 */

const ASSISTED_MANAGEMENT_BASE = '/assisted-management';
const ADMIN_BASE = '/admin';

// ============================================================================
// ADMIN APIs
// ============================================================================

/**
 * GET /api/admin/assisted/requests
 * 
 * Get all assisted requests with management data.
 * Supports filtering by city, workflow status, and assigned executive.
 */
export const getAdminAssistedRequests = async (
  filters: AssistedRequestFilters = {}
): Promise<AdminAssistedRequestsResponse> => {
  const response = await axiosInstance.get<ApiResponse<AdminAssistedRequestsResponse['data']> & { meta: any }>(
    `${ADMIN_BASE}/assisted/requests`,
    {
      params: filters
    }
  );

  return {
    data: response.data.data,
    meta: response.data.meta || null
  };
};

/**
 * POST /api/admin/assisted/:requestId/assign-agent
 * 
 * Assign an agent to an assisted request.
 */
export const assignAgentToRequest = async (
  requestId: string,
  data: AssignAgentRequest
): Promise<void> => {
  assertValidParam(requestId, 'requestId');
  assertValidParam(data.executiveId, 'executiveId');

  await axiosInstance.post<ApiResponse<void>>(
    `${ADMIN_BASE}/assisted/${requestId}/assign-agent`,
    data
  );
};

// ============================================================================
// AGENT APIs
// ============================================================================

/**
 * GET /api/assisted-management/agent/requests
 * 
 * Get all requests assigned to the authenticated agent.
 */
export const getAssignedRequests = async (): Promise<AssignedRequestsResponse> => {
  const response = await axiosInstance.get<ApiResponse<AssignedRequestsResponse['data']>>(
    `${ASSISTED_MANAGEMENT_BASE}/agent/requests`
  );

  return {
    data: response.data.data
  };
};

/**
 * PUT /api/assisted-management/agent/:requestId/workflow-status
 * 
 * Update workflow status of an assisted request.
 */
export const updateWorkflowStatus = async (
  requestId: string,
  data: UpdateWorkflowStatusRequest
): Promise<void> => {
  assertValidParam(requestId, 'requestId');

  await axiosInstance.put<ApiResponse<void>>(
    `${ASSISTED_MANAGEMENT_BASE}/agent/${requestId}/workflow-status`,
    data
  );
};

/**
 * POST /api/assisted-management/agent/:requestId/recommendations
 * 
 * Add a property recommendation to an assisted request.
 */
export const addRecommendation = async (
  requestId: string,
  data: AddRecommendationRequest
): Promise<void> => {
  assertValidParam(requestId, 'requestId');
  assertValidParam(data.propertyId, 'propertyId');

  await axiosInstance.post<ApiResponse<void>>(
    `${ASSISTED_MANAGEMENT_BASE}/agent/${requestId}/recommendations`,
    data
  );
};

/**
 * PUT /api/assisted-management/agent/recommendations/:recommendationId
 * 
 * Update a property recommendation.
 */
export const updateRecommendation = async (
  recommendationId: string,
  data: UpdateRecommendationRequest
): Promise<void> => {
  assertValidParam(recommendationId, 'recommendationId');

  await axiosInstance.put<ApiResponse<void>>(
    `${ASSISTED_MANAGEMENT_BASE}/agent/recommendations/${recommendationId}`,
    data
  );
};

/**
 * DELETE /api/assisted-management/agent/recommendations/:recommendationId
 * 
 * Remove a property recommendation.
 */
export const deleteRecommendation = async (
  recommendationId: string
): Promise<void> => {
  assertValidParam(recommendationId, 'recommendationId');

  await axiosInstance.delete<ApiResponse<void>>(
    `${ASSISTED_MANAGEMENT_BASE}/agent/recommendations/${recommendationId}`
  );
};

// ============================================================================
// TENANT APIs
// ============================================================================

/**
 * GET /api/tenant/assisted/:requestId/recommendations
 * 
 * Get recommended properties for an assisted request.
 */
export const getRecommendedProperties = async (
  requestId: string
): Promise<RecommendedPropertiesResponse> => {
  assertValidParam(requestId, 'requestId');

  const response = await axiosInstance.get<ApiResponse<RecommendedPropertiesResponse['data']>>(
    `/tenant/assisted/${requestId}/recommendations`
  );

  return {
    data: response.data.data
  };
};

// ============================================================================
// EXPORT AS OBJECT (for consistency with existing API files)
// ============================================================================

export const assistedManagementApi = {
  // Admin
  getAdminAssistedRequests,
  assignAgentToRequest,

  // Agent
  getAssignedRequests,
  updateWorkflowStatus,
  addRecommendation,
  updateRecommendation,
  deleteRecommendation,

  // Tenant
  getRecommendedProperties
};
