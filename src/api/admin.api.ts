import axiosInstance from './axios';
import { ApiResponse, User, Room, FeedbackReason, FeedbackSeverity, PaginationMeta } from '../types/api.types';
import { PropertyAssignment, TenantAssignment } from '../types/admin.types';
import { assertValidParam } from '../utils/apiGuard';
import { clearCachePrefix } from '../utils/apiCache';
export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalProperties: number;
  pendingApprovals: number;
  activeListings: number;
  totalBookings: number;
}
export interface ActivityLog {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export interface AdminArea {
  id: string;
  cityId: string;
  city?: string;
  name: string;
  slug: string;
  aliases?: Array<{ id: string; name: string; slug: string }>;
  latitude?: number | null;
  longitude?: number | null;
  popularityScore?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoSlug?: string | null;
  displayOrder: number;
  isActive: boolean;
  roomCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAreaImportError {
  row: number;
  reason: string;
}

export interface AdminAreaImportReport {
  success: true;
  totalRows: number;
  rowsValidated: number;
  rowsInserted: number;
  citiesCreated: number;
  duplicateInCsv: number;
  duplicateInDatabase: number;
  failedRows: number;
  errors: AdminAreaImportError[];
}

export type FreshnessCategory = 'fresh' | 'aging' | 'stale' | 'dead';
export type OwnerRiskCategory = 'healthy' | 'watch' | 'inactive' | 'critical';
export type ReminderType = 'PROPERTY_STALE' | 'OWNER_INACTIVE';
export type FreshnessPriorityCategory =
  | 'high_risk_stale'
  | 'medium_risk'
  | 'recently_aging'
  | 'recoverable_inventory'
  | 'dead_inventory';
export type FreshnessReviewDecision =
  | 'MARK_PROPERTY_ACTIVE'
  | 'MARK_FALSE_POSITIVE'
  | 'OWNER_CONFIRMED_AVAILABLE'
  | 'MARK_NEEDS_FOLLOW_UP'
  | 'IGNORE_TEMPORARILY'
  | 'MANUAL_DISABLE_RECOMMENDED'
  | 'MANUAL_DISABLE_COMPLETED';
export type FreshnessFalsePositiveReason =
  | 'RECENTLY_VERIFIED'
  | 'LOW_DEMAND_AREA'
  | 'NEW_LISTING_GRACE'
  | 'SEASONAL_PATTERN'
  | 'OWNER_CONFIRMED'
  | 'OTHER';
export type FreshnessOwnerResponse =
  | 'ACKNOWLEDGED'
  | 'UPDATED_LISTING'
  | 'IGNORED_REMINDER'
  | 'REQUESTED_DISABLE'
  | 'CONFIRMED_FILLED'
  | 'CONFIRMED_AVAILABLE';
export type FreshnessFollowUpStatus =
  | 'NOT_REQUIRED'
  | 'NEEDS_FOLLOW_UP'
  | 'REMINDER_SENT'
  | 'OWNER_RESPONDED'
  | 'CLOSED';
export type ReminderOutcome =
  | 'OWNER_RESPONDED'
  | 'OWNER_UPDATED_LISTING'
  | 'ENGAGEMENT_INCREASED'
  | 'PROPERTY_RECOVERED'
  | 'OWNER_REQUESTED_DISABLE'
  | 'OWNER_CONFIRMED_FILLED';

export interface FreshnessThresholds {
  recentWindowDays: number;
  newPropertyDays: number;
  staleDays: number;
  deadDays: number;
}

export interface StalePropertyFreshness {
  id: string;
  title: string;
  city: string;
  location: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  createdAt: string;
  lastEngagementAt: string | null;
  daysWithoutEngagement: number;
  ageDays: number;
  recentViews: number;
  recentContacts: number;
  previousViews: number;
  previousContacts: number;
  engagementTrendDirection: 'up' | 'down' | 'flat';
  freshnessCategory: FreshnessCategory;
  priorityCategory: FreshnessPriorityCategory;
  freshnessScore: number;
  confidenceScore: number;
  latestReviewDecision: FreshnessReviewDecision | null;
  latestOwnerResponse: FreshnessOwnerResponse | null;
  latestFollowUpStatus: FreshnessFollowUpStatus | null;
  latestReviewAt: string | null;
  ignoreUntil: string | null;
  reminderCount: number;
  lastReminderGeneratedAt: string | null;
  lastReminderSentAt: string | null;
  postReminderEvents: number;
}

export interface InactiveOwnerFreshness {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  primaryCity: string | null;
  activePropertyCount: number;
  averageFreshnessScore: number;
  lastEngagementAt: string | null;
  daysSinceLastEngagement: number;
  recentViews: number;
  recentContacts: number;
  freshProperties: number;
  agingProperties: number;
  staleProperties: number;
  deadProperties: number;
  riskCategory: OwnerRiskCategory;
  riskRank: number;
}

export interface MarketplaceHealthMetrics {
  totalActiveInventory: number;
  freshInventory: number;
  agingInventory: number;
  staleInventory: number;
  deadInventory: number;
  freshInventoryPercent: number;
  agingInventoryPercent: number;
  staleInventoryPercent: number;
  deadInventoryPercent: number;
  recentViews: number;
  recentContacts: number;
  trend: {
    currentWindowEvents: number;
    previousWindowEvents: number;
    direction: 'up' | 'down' | 'flat';
    delta: number;
  };
  adminReviewWorkload: number;
  recoveredInventory: number;
  recoveredInventoryPercent: number;
  reminderSuccessRate: number;
  ownerResponsivenessRate: number;
  remindersGenerated: number;
  remindersSent: number;
  successfulReminders: number;
  ownerResponses: number;
  staleInventoryTrend: {
    direction: 'up' | 'down' | 'flat' | 'unavailable';
    reason?: string;
  };
  deadInventoryTrend: {
    direction: 'up' | 'down' | 'flat' | 'unavailable';
    reason?: string;
  };
  thresholds: FreshnessThresholds;
  generatedAt: string;
}

export interface ReminderLogResponse {
  id: string;
  adminId: string;
  ownerId: string;
  propertyId: string | null;
  type: ReminderType;
  message: string;
  generatedAt: string;
  manualSentAt?: string | null;
  ownerRespondedAt?: string | null;
  responseStatus: 'PENDING' | 'RESPONDED' | 'NO_RESPONSE' | 'NOT_NEEDED';
  outcome?: ReminderOutcome | null;
  notes?: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  property?: {
    id: string;
    title: string;
    city: string;
  } | null;
}

export interface FreshnessReviewResponse {
  id: string;
  adminId: string;
  ownerId: string;
  propertyId: string | null;
  reminderLogId: string | null;
  decision: FreshnessReviewDecision;
  queueStatus: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'IGNORED';
  falsePositiveReason?: FreshnessFalsePositiveReason | null;
  ownerResponse?: FreshnessOwnerResponse | null;
  followUpStatus: FreshnessFollowUpStatus;
  confidenceOverride?: number | null;
  notes?: string | null;
  ignoreUntil?: string | null;
  reviewedAt: string;
}

// =============================================================================
// MARKETPLACE ANALYTICS INTERFACES
// =============================================================================

export interface InventoryCategoryMetrics {
  start: number;
  end: number;
  change: number;
  changePercent: number;
  trend: 'improving' | 'degrading' | 'stable';
}

export interface FreshnessTrendsResponse {
  rangeInDays: number;
  dataPoints: number;
  startDate: string;
  endDate: string;
  freshInventory: InventoryCategoryMetrics;
  agingInventory: InventoryCategoryMetrics;
  staleInventory: InventoryCategoryMetrics;
  deadInventory: InventoryCategoryMetrics;
  overallHealthTrend: {
    description: string;
    freshnessTrendDirection: 'up' | 'down';
    staleInventoryTrendDirection: 'improving' | 'worsening';
  };
  historicalSnapshots: Array<{
    date: string;
    fresh: number;
    aging: number;
    stale: number;
    dead: number;
  }>;
}

export interface RecoveryMetricsResponse {
  rangeInDays: number;
  dataPoints: number;
  totalRecoveredProperties: number;
  averageRecoveryRate: number;
  recoveryTrend: 'up' | 'down' | 'stable';
  historicalRecoveries: Array<{
    date: string;
    recoveredCount: number;
    recoveryRate: number;
  }>;
}

export interface ReminderEffectivenessResponse {
  rangeInDays: number;
  dataPoints: number;
  totalRemindersGenerated: number;
  totalOwnerResponses: number;
  overallResponseRate: number;
  responseTrend: 'up' | 'down' | 'stable';
  effectiveness: 'highly_effective' | 'moderately_effective' | 'low_effectiveness';
  historicalData: Array<{
    date: string;
    remindersGenerated: number;
    responses: number;
    responseRate: number;
  }>;
}

export interface FalsePositiveMetricsResponse {
  rangeInDays: number;
  dataPoints: number;
  totalFalsePositives: number;
  falsePositiveRate: string; // "23.5%"
  trend: 'up' | 'down' | 'stable';
  commonReasons: Array<[string, number]>;
  historicalFalsePositives: Array<{
    date: string;
    count: number;
    rate: string;
  }>;
}

export interface AdminWorkloadResponse {
  rangeInDays: number;
  dataPoints: number;
  totalReviewsCompleted: number;
  averageQueueSize: number;
  reviewsPerDay: number;
  adminDisables: number;
  ownerRequestedDisables: number;
  workloadTrend: 'up' | 'down' | 'stable';
  historicalData: Array<{
    date: string;
    queueSize: number;
    reviewsCompleted: number;
  }>;
}

export interface OperationalConsistencyResponse {
  valid: boolean;
  snapshotDate: string;
  issues: string[];
  recommendations: string[];
}

export interface HealthTimelineResponse {
  dataPoints: number;
  historicalMetrics: Array<{
    date: string;
    totalInventory: number;
    freshCount: number;
    agingCount: number;
    staleCount: number;
    deadCount: number;
    recoveredCount: number;
    remindersGenerated: number;
    reminderResponses: number;
    falsePositiveCount: number;
  }>;
}

interface FreshnessListResponse<T> {
  data: T[];
  meta: PaginationMeta | null;
  thresholds: FreshnessThresholds;
}

export const adminApi = {
  // Get dashboard stats
  getStats: async (): Promise<AdminStats> => {
    const response = await axiosInstance.get<ApiResponse<AdminStats>>('/admin/stats');
    return response.data.data;
  },
  // Get all users (with pagination metadata support)
  getAllUsers: async (filters?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    cursor?: string;
    availabilityStatus?: string;
  }, signal?: AbortSignal): Promise<{ users: User[]; meta: PaginationMeta | null }> => {
    const response = await axiosInstance.get<ApiResponse<User[]>>('/admin/users', {
      params: filters,
      signal
    });
    // ✅ Handle both paginated response { data: [...], meta: {...} }
    // ✅ and legacy response { data: [...] } gracefully
    const meta = response.data.meta || null;
    return {
      users: response.data.data,
      meta
    };
  },
  // Update user status
  updateUserStatus: async (userId: string, status: 'active' | 'disabled'): Promise<User> => {
    assertValidParam(userId, 'userId');
    const response = await axiosInstance.patch<ApiResponse<User>>(`/admin/users/${userId}/status`, {
      status,
      isActive: status === 'active'
    });
    return response.data.data;
  },
  // Get all properties (with pagination metadata support)
  getAllProperties: async (filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    cursor?: string;
  }, signal?: AbortSignal): Promise<{ properties: Room[]; meta: PaginationMeta | null }> => {
    const response = await axiosInstance.get<ApiResponse<Room[]>>('/admin/properties', {
      params: filters,
      signal
    });
    // ✅ Handle both paginated response { data: [...], meta: {...} }
    // ✅ and legacy response { data: [...] } gracefully
    const meta = response.data.meta || null;
    return {
      properties: response.data.data,
      meta
    };
  },
  // Approve property
  approveProperty: async (propertyId: string): Promise<Room> => {
    assertValidParam(propertyId, 'propertyId');
    const response = await axiosInstance.patch<ApiResponse<Room>>(`/admin/properties/${propertyId}/approve`);
    return response.data.data;
  },
  // Reject property
  rejectProperty: async (propertyId: string, reason?: string): Promise<Room> => {
    assertValidParam(propertyId, 'propertyId');
    const response = await axiosInstance.patch<ApiResponse<Room>>(`/admin/properties/${propertyId}/reject`, {
      reason
    });
    return response.data.data;
  },
  // Suspend property
  suspendProperty: async (propertyId: string, reason?: string): Promise<Room> => {
    assertValidParam(propertyId, 'propertyId');
    const response = await axiosInstance.patch<ApiResponse<Room>>(`/admin/properties/${propertyId}/suspend`, {
      reason
    });
    return response.data.data;
  },
  // Request correction on a property
  requestPropertyCorrection: async (propertyId: string, reason: FeedbackReason, message: string, severity?: FeedbackSeverity): Promise<Room> => {
    assertValidParam(propertyId, 'propertyId');
    const response = await axiosInstance.patch<ApiResponse<Room>>(`/admin/properties/${propertyId}/needs-correction`, {
      reason,
      message,
      severity
    });
    return response.data.data;
  },
  updatePropertyAvailability: async (propertyId: string, availabilityStatus: string, reason?: string): Promise<Room> => {
    assertValidParam(propertyId, 'propertyId');
    const response = await axiosInstance.patch<ApiResponse<Room>>(`/admin/properties/${propertyId}/availability`, {
      availabilityStatus,
      reason
    });
    return response.data.data;
  },
  // Get activity log
  getActivity: async (limit: number = 10): Promise<ActivityLog[]> => {
    const response = await axiosInstance.get<ApiResponse<ActivityLog[]>>('/admin/activity', {
      params: {
        limit
      }
    });
    return response.data.data;
  },
  getAreas: async (filters: { city?: string; cityId?: string; includeInactive?: boolean }): Promise<AdminArea[]> => {
    const response = await axiosInstance.get<ApiResponse<AdminArea[]>>('/admin/areas', {
      params: filters
    });
    return response.data.data;
  },
  createArea: async (data: { city?: string; cityId?: string; name: string; displayOrder?: number; isActive?: boolean; aliases?: string[]; latitude?: number; longitude?: number; popularityScore?: number; seoTitle?: string; seoDescription?: string; seoSlug?: string }): Promise<AdminArea> => {
    const response = await axiosInstance.post<ApiResponse<AdminArea>>('/admin/areas', data);
    clearCachePrefix('metadata:locations:');
    return response.data.data;
  },
  updateArea: async (id: string, data: { name?: string; displayOrder?: number; isActive?: boolean; aliases?: string[]; latitude?: number | null; longitude?: number | null; popularityScore?: number; seoTitle?: string | null; seoDescription?: string | null; seoSlug?: string | null }): Promise<AdminArea> => {
    assertValidParam(id, 'areaId');
    const response = await axiosInstance.patch<ApiResponse<AdminArea>>(`/admin/areas/${id}`, data);
    clearCachePrefix('metadata:locations:');
    return response.data.data;
  },
  mergeAreas: async (sourceAreaId: string, targetAreaId: string): Promise<any> => {
    assertValidParam(sourceAreaId, 'sourceAreaId');
    assertValidParam(targetAreaId, 'targetAreaId');
    const response = await axiosInstance.post<ApiResponse<any>>('/admin/areas/merge', {
      sourceAreaId,
      targetAreaId
    });
    clearCachePrefix('metadata:locations:');
    return response.data.data;
  },
  reorderAreas: async (areas: Array<{ id: string; displayOrder: number }>): Promise<void> => {
    await axiosInstance.patch('/admin/areas/reorder', { areas });
    clearCachePrefix('metadata:locations:');
  },
  importAreas: async (file: File): Promise<AdminAreaImportReport> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<AdminAreaImportReport>('/admin/areas/import', formData);
    clearCachePrefix('metadata:locations:');
    return response.data;
  },
  getStaleProperties: async (filters?: {
    page?: number;
    limit?: number;
    city?: string;
    category?: FreshnessCategory | 'all';
    search?: string;
    sort?: string;
  }, signal?: AbortSignal): Promise<FreshnessListResponse<StalePropertyFreshness>> => {
    const response = await axiosInstance.get<ApiResponse<StalePropertyFreshness[]> & { thresholds: FreshnessThresholds }>(
      '/admin/freshness/stale-properties',
      {
        params: filters,
        signal
      }
    );

    return {
      data: response.data.data,
      meta: response.data.meta || null,
      thresholds: response.data.thresholds
    };
  },
  getInactiveOwners: async (filters?: {
    page?: number;
    limit?: number;
    city?: string;
    riskCategory?: OwnerRiskCategory | 'all';
    search?: string;
    sort?: string;
  }, signal?: AbortSignal): Promise<FreshnessListResponse<InactiveOwnerFreshness>> => {
    const response = await axiosInstance.get<ApiResponse<InactiveOwnerFreshness[]> & { thresholds: FreshnessThresholds }>(
      '/admin/freshness/inactive-owners',
      {
        params: filters,
        signal
      }
    );

    return {
      data: response.data.data,
      meta: response.data.meta || null,
      thresholds: response.data.thresholds
    };
  },
  getFreshnessHealthMetrics: async (): Promise<MarketplaceHealthMetrics> => {
    const response = await axiosInstance.get<ApiResponse<MarketplaceHealthMetrics>>('/admin/freshness/health-metrics');
    return response.data.data;
  },
  generateFreshnessReminder: async (input: {
    ownerId: string;
    propertyId?: string | null;
    type: ReminderType;
    notes?: string;
  }): Promise<ReminderLogResponse> => {
    assertValidParam(input.ownerId, 'ownerId');
    const response = await axiosInstance.post<ApiResponse<ReminderLogResponse>>('/admin/freshness/reminders', input);
    return response.data.data;
  },
  updateFreshnessReminderTracking: async (reminderId: string, input: {
    manualSentAt?: string | null;
    ownerRespondedAt?: string | null;
    responseStatus?: 'PENDING' | 'RESPONDED' | 'NO_RESPONSE' | 'NOT_NEEDED';
    outcome?: ReminderOutcome | null;
    notes?: string | null;
  }): Promise<ReminderLogResponse> => {
    assertValidParam(reminderId, 'reminderId');
    const response = await axiosInstance.patch<ApiResponse<ReminderLogResponse>>(
      `/admin/freshness/reminders/${reminderId}`,
      input
    );
    return response.data.data;
  },
  recordFreshnessReview: async (input: {
    ownerId: string;
    propertyId?: string | null;
    reminderLogId?: string | null;
    decision: FreshnessReviewDecision;
    falsePositiveReason?: FreshnessFalsePositiveReason | null;
    ownerResponse?: FreshnessOwnerResponse | null;
    followUpStatus?: FreshnessFollowUpStatus;
    confidenceOverride?: number | null;
    notes?: string | null;
    ignoreUntil?: string | null;
  }): Promise<FreshnessReviewResponse> => {
    assertValidParam(input.ownerId, 'ownerId');
    const response = await axiosInstance.post<ApiResponse<FreshnessReviewResponse>>('/admin/freshness/reviews', input);
    return response.data.data;
  },
  // ==========================================================================
  // ASSIGNMENT ENDPOINTS
  // ==========================================================================

  // Get property assignments
  getPropertyAssignments: async (filters?: {
    agentId?: string;
    isActive?: boolean;
  }): Promise<PropertyAssignment[]> => {
    const response = await axiosInstance.get<ApiResponse<PropertyAssignment[]>>('/admin/assignments/properties', {
      params: filters
    });
    return response.data.data;
  },
  // Get tenant assignments
  getTenantAssignments: async (filters?: {
    agentId?: string;
    isActive?: boolean;
  }): Promise<TenantAssignment[]> => {
    const response = await axiosInstance.get<ApiResponse<TenantAssignment[]>>('/admin/assignments/tenants', {
      params: filters
    });
    return response.data.data;
  },
  // Assign property to agent
  assignPropertyToAgent: async (agentId: string, propertyId: string, notes?: string): Promise<any> => {
    assertValidParam(agentId, 'agentId');
    assertValidParam(propertyId, 'propertyId');
    const response = await axiosInstance.post<ApiResponse<any>>(`/admin/agents/${agentId}/properties/${propertyId}`, {
      notes
    });
    return response.data.data;
  },
  // Unassign property from agent
  unassignPropertyFromAgent: async (agentId: string, propertyId: string): Promise<any> => {
    assertValidParam(agentId, 'agentId');
    assertValidParam(propertyId, 'propertyId');
    const response = await axiosInstance.delete<ApiResponse<any>>(`/admin/agents/${agentId}/properties/${propertyId}`);
    return response.data;
  },
  // Assign tenant to agent
  assignTenantToAgent: async (agentId: string, tenantId: string, reason?: string): Promise<any> => {
    assertValidParam(agentId, 'agentId');
    assertValidParam(tenantId, 'tenantId');
    const response = await axiosInstance.post<ApiResponse<any>>(`/admin/agents/${agentId}/tenants/${tenantId}`, {
      reason
    });
    return response.data.data;
  },
  // Unassign tenant from agent
  unassignTenantFromAgent: async (agentId: string, tenantId: string): Promise<any> => {
    assertValidParam(agentId, 'agentId');
    assertValidParam(tenantId, 'tenantId');
    const response = await axiosInstance.delete<ApiResponse<any>>(`/admin/agents/${agentId}/tenants/${tenantId}`);
    return response.data;
  },

  // ==========================================================================
  // CONTACT & ENGAGEMENT TRACKING (PROMPTS 1, 2, 3)
  // ==========================================================================

  // Track contact attempt - async, non-blocking
  trackContactAttempt: async (propertyIds: string[]): Promise<{ count: number; timestamp: string }> => {
    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      throw new Error('propertyIds must be a non-empty array');
    }
    try {
      const response = await axiosInstance.post<ApiResponse<{ count: number; timestamp: string }>>(
        '/admin/properties/track-contact',
        { propertyIds }
      );
      return response.data.data;
    } catch {
      return { count: 0, timestamp: new Date().toISOString() };
    }
  },

  // Track owner login (PROMPT 2)
  trackOwnerLogin: async (userId: string): Promise<{ userId: string; lastLoginAt: string }> => {
    if (!userId) {
      throw new Error('userId is required');
    }
    try {
      const response = await axiosInstance.post<ApiResponse<{ userId: string; lastLoginAt: string }>>(
        '/admin/engagement/track-login',
        { userId }
      );
      return response.data.data;
    } catch {
      return { userId, lastLoginAt: new Date().toISOString() };
    }
  },

  // Track property update (PROMPT 2)
  trackPropertyUpdate: async (propertyId: string): Promise<{ propertyId: string; ownerId: string; lastPropertyUpdateAt: string }> => {
    if (!propertyId) {
      throw new Error('propertyId is required');
    }
    try {
      const response = await axiosInstance.post<ApiResponse<{ propertyId: string; ownerId: string; lastPropertyUpdateAt: string }>>(
        '/admin/engagement/track-property-update',
        { propertyId }
      );
      return response.data.data;
    } catch {
      return { propertyId, ownerId: '', lastPropertyUpdateAt: new Date().toISOString() };
    }
  },

  // ==========================================================================
  // MARKETPLACE ANALYTICS ENDPOINTS (NEW)
  // ==========================================================================

  /**
   * Get freshness trends over time (7/30/90 day ranges)
   * Shows: fresh, aging, stale, dead inventory trends with historical data
   */
  getFreshnessTrends: async (range: 7 | 30 | 90 = 30): Promise<FreshnessTrendsResponse> => {
    const response = await axiosInstance.get<ApiResponse<FreshnessTrendsResponse>>(
      '/admin/analytics/freshness-trends',
      { params: { range } }
    );
    return response.data.data;
  },

  /**
   * Get recovery metrics over time
   * Shows: recovered properties count and recovery rate trends
   */
  getRecoveryMetrics: async (range: 7 | 30 | 90 = 30): Promise<RecoveryMetricsResponse> => {
    const response = await axiosInstance.get<ApiResponse<RecoveryMetricsResponse>>(
      '/admin/analytics/recovery-metrics',
      { params: { range } }
    );
    return response.data.data;
  },

  /**
   * Get reminder effectiveness analytics
   * Shows: reminders generated, owner responses, response rates, effectiveness level
   */
  getReminderEffectiveness: async (range: 7 | 30 | 90 = 30): Promise<ReminderEffectivenessResponse> => {
    const response = await axiosInstance.get<ApiResponse<ReminderEffectivenessResponse>>(
      '/admin/analytics/reminder-effectiveness',
      { params: { range } }
    );
    return response.data.data;
  },

  /**
   * Get false positive metrics and patterns
   * Shows: false positive rate, common reasons, trend
   */
  getFalsePositiveMetrics: async (range: 7 | 30 | 90 = 30): Promise<FalsePositiveMetricsResponse> => {
    const response = await axiosInstance.get<ApiResponse<FalsePositiveMetricsResponse>>(
      '/admin/analytics/false-positive-metrics',
      { params: { range } }
    );
    return response.data.data;
  },

  /**
   * Get admin workload analytics
   * Shows: queue size, reviews completed, disable patterns
   */
  getAdminWorkload: async (range: 7 | 30 | 90 = 30): Promise<AdminWorkloadResponse> => {
    const response = await axiosInstance.get<ApiResponse<AdminWorkloadResponse>>(
      '/admin/analytics/admin-workload',
      { params: { range } }
    );
    return response.data.data;
  },

  /**
   * Get operational consistency validation
   * Shows: data quality issues and recommendations (no auto-correction)
   */
  getOperationalConsistency: async (): Promise<OperationalConsistencyResponse> => {
    const response = await axiosInstance.get<ApiResponse<OperationalConsistencyResponse>>(
      '/admin/analytics/operational-consistency'
    );
    return response.data.data;
  },

  /**
   * Get complete health timeline
   * Shows: full historical view of all metrics
   */
  getHealthTimeline: async (range: 7 | 30 | 90 = 30): Promise<HealthTimelineResponse> => {
    const response = await axiosInstance.get<ApiResponse<HealthTimelineResponse>>(
      '/admin/analytics/health-timeline',
      { params: { range } }
    );
    return response.data.data;
  }
};
