import { ApiResponse, PaginationMeta } from './api.types';

/**
 * Workflow Status Enum
 * 
 * Represents the current stage of an assisted request in the service lifecycle.
 */
export enum WorkflowStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  SEARCHING = 'SEARCHING',
  PROPERTIES_SHARED = 'PROPERTIES_SHARED',
  VISITS_SCHEDULED = 'VISITS_SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Assisted Request
 * 
 * Core assisted request entity.
 */
export interface AssistedRequest {
  id: string;
  name: string;
  phone: string;
  city: string;
  budget?: number | null;
  amount: number;
  paymentId: string;
  orderId: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Assisted Request with Tenant
 * 
 * Extended assisted request with tenant information and workflow status.
 */
export interface AssistedRequestWithTenant {
  id: string;
  name: string;
  phone: string;
  city: string;
  budget?: number | null;
  amount: number;
  paymentId: string;
  orderId: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  workflowStatus: WorkflowStatus;
  assignedExecutiveId?: string | null;
  tenantId?: string | null;
  tenant?: {
    id: string;
    name: string;
    phone: string;
  };
}

/**
 * Recommended Property
 * 
 * Property recommendation for an assisted request.
 */
export interface RecommendedProperty {
  id: string;
  assistedRequestId: string;
  propertyId: string;
  priority: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    location: string;
    pricePerMonth: number;
    images: string[];
    roomType: string;
    availabilityStatus: string;
    ownerId: string;
  };
}

/**
 * Assisted Request Filters
 * 
 * Query parameters for filtering assisted requests.
 */
export interface AssistedRequestFilters {
  page?: number;
  limit?: number;
  city?: string;
  workflowStatus?: WorkflowStatus;
  assignedExecutiveId?: string;
}

/**
 * Assign Agent Request
 * 
 * Request body for assigning an agent to an assisted request.
 */
export interface AssignAgentRequest {
  executiveId: string;
}

/**
 * Update Workflow Status Request
 * 
 * Request body for updating workflow status.
 */
export interface UpdateWorkflowStatusRequest {
  workflowStatus: WorkflowStatus;
}

/**
 * Add Recommendation Request
 * 
 * Request body for adding a property recommendation.
 */
export interface AddRecommendationRequest {
  propertyId: string;
  priority: number;
  notes?: string;
}

/**
 * Update Recommendation Request
 * 
 * Request body for updating a property recommendation.
 */
export interface UpdateRecommendationRequest {
  priority?: number;
  notes?: string;
}

/**
 * Admin Assisted Requests Response
 * 
 * Response for admin assisted requests query.
 */
export interface AdminAssistedRequestsResponse {
  data: AssistedRequestWithTenant[];
  meta: PaginationMeta;
}

/**
 * Assigned Requests Response
 * 
 * Response for agent assigned requests query.
 */
export interface AssignedRequestsResponse {
  data: AssistedRequestWithTenant[];
}

/**
 * Recommended Properties Response
 * 
 * Response for recommended properties query.
 */
export interface RecommendedPropertiesResponse {
  data: RecommendedProperty[];
}
