import axiosInstance from './axios';
import { ApiResponse, Room, RoomFilters, CreateRoomInput, UpdateRoomInput, PaginationMeta, DemandStats, UpdateAvailabilityInput } from '../types/api.types';
import { assertValidParam } from '../utils/apiGuard';
export const roomsApi = {
  // Get all rooms with filters and pagination
  // PRODUCTION: Supports AbortSignal for cancellation (pull-to-refresh)
  getRooms: async (
    filters?: RoomFilters,
    signal?: AbortSignal
  ): Promise<{
    items: Room[];
    rooms: Room[];
    nextCursor?: string;
    hasNextPage: boolean;
    total: number;
    meta: PaginationMeta;
  }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        // ✅ Handle array parameters specially (convert to CSV string)
        // Also filter out empty values from arrays
        if ((key === 'roomTypes' || key === 'idealFor' || key === 'areaIds') && Array.isArray(value)) {
          if (value.length > 0) {
            // Filter out empty/null values from array
            const filtered = (value as any[])
              .map(v => String(v).trim())
              .filter(v => v.length > 0);
            if (filtered.length > 0) {
              params.append(key, filtered.join(','));
            }
          }
        } else if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    // Ensure limit defaults to 10 if not specified
    if (!params.has('limit')) {
      params.append('limit', '10');
    }
    const response = await axiosInstance.get<ApiResponse<Room[]>>('/rooms', {
      params,
      signal
    });
    const items = response.data.data ?? [];
    const meta = response.data.meta || {
      page: 1,
      limit: 20,
      total: items.length
    };

    return {
      items,
      rooms: items,
      nextCursor: meta.nextCursor,
      hasNextPage: Boolean(meta.hasNextPage),
      total: meta.total ?? items.length,
      meta: {
        page: meta.page ?? 1,
        limit: meta.limit ?? 20,
        total: meta.total ?? items.length,
        hasNextPage: Boolean(meta.hasNextPage),
        nextCursor: meta.nextCursor,
      }
    };
  },
  // Get room by ID
  getRoomById: async (id: string): Promise<Room> => {
    assertValidParam(id, 'roomId');
    const response = await axiosInstance.get<ApiResponse<Room>>(`/rooms/${id}`);
    return response.data.data;
  },
  getDemandStats: async (id: string): Promise<DemandStats> => {
    assertValidParam(id, 'roomId');
    const response = await axiosInstance.get<ApiResponse<DemandStats>>(`/rooms/${id}/demand-stats`);
    return response.data.data;
  },
  // Create new room (owner only)
  createRoom: async (data: CreateRoomInput): Promise<Room> => {
    const response = await axiosInstance.post<ApiResponse<Room>>('/rooms', data);
    return response.data.data;
  },
  // Update room (owner only)
  updateRoom: async (id: string, data: UpdateRoomInput): Promise<Room> => {
    assertValidParam(id, 'roomId');
    const response = await axiosInstance.put<ApiResponse<Room>>(`/rooms/${id}`, data);
    return response.data.data;
  },
  // Delete room (owner only)
  deleteRoom: async (id: string): Promise<void> => {
    assertValidParam(id, 'roomId');
    await axiosInstance.delete(`/rooms/${id}`);
  },
  // Toggle room active status (owner only)
  toggleRoomStatus: async (id: string): Promise<Room> => {
    assertValidParam(id, 'roomId');
    const response = await axiosInstance.patch<ApiResponse<Room>>(`/rooms/${id}/status`);
    return response.data.data;
  },
  updateAvailability: async (id: string, data: UpdateAvailabilityInput): Promise<Room> => {
    assertValidParam(id, 'roomId');
    const response = await axiosInstance.patch<ApiResponse<Room>>(`/rooms/${id}/availability`, data);
    return response.data.data;
  },
  subscribeToAvailability: async (id: string): Promise<{ success: boolean; message: string }> => {
    assertValidParam(id, 'roomId');
    const response = await axiosInstance.post<ApiResponse<{ success: boolean; message: string }>>(`/rooms/${id}/availability-subscriptions`);
    return response.data.data;
  },
  // Resubmit property for review (owner only)
  resubmitForReview: async (id: string): Promise<Room> => {
    assertValidParam(id, 'roomId');
    const response = await axiosInstance.post<ApiResponse<Room>>(`/rooms/${id}/resubmit`);
    return response.data.data;
  }
};
