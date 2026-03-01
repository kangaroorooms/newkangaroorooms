import { IRoomRepository } from '../repositories/interfaces';
import { Room, CreateRoomInput, UpdateRoomInput, RoomFilters } from '../models/Room';
import { CloudinaryService } from './CloudinaryService';
import { logger } from '../utils/logger';
import { normalizeCity } from '../utils/normalize';
import { ReviewStatus, Role } from '@prisma/client';
import { getPrismaClient } from '../utils/prisma';
export class RoomService {
  private roomRepository: IRoomRepository;
  private cloudinaryService: CloudinaryService;
  constructor(roomRepository: IRoomRepository) {
    this.roomRepository = roomRepository;
    this.cloudinaryService = new CloudinaryService();
  }
  async getAllRooms(filters: RoomFilters, requesterRole?: string): Promise<{
    rooms: Room[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    // ✅ FIX 2: Role-aware visibility enforcement.
    // TENANT or unauthenticated (PUBLIC) → enforce APPROVED + isActive only.
    // OWNER / ADMIN / AGENT → no forced reviewStatus filter (they use their own
    // dedicated endpoints, but if they ever hit this route they see everything).
    const isTenantOrPublic = !requesterRole || requesterRole === 'TENANT' || requesterRole === 'tenant';
    const result = await this.roomRepository.findAll({
      city: filters.city,
      roomType: filters.roomType,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      isPopular: filters.isPopular,
      onlyActive: filters.onlyActive ?? true,
      // Only enforce APPROVED for tenant/public requests
      ...(isTenantOrPublic ? {
        reviewStatus: ReviewStatus.APPROVED
      } : {}),
      sort: filters.sort,
      page,
      limit
    });
    return {
      ...result,
      page,
      limit
    };
  }
  async getRoomById(id: string, requesterRole?: string): Promise<Room> {
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new Error('Room not found');
    }

    // ✅ Tenant/public visibility enforcement for single-room fetch.
    // If requester is TENANT or unauthenticated, the room MUST be APPROVED + active.
    // We throw the same 'Room not found' error — never reveal a hidden room exists.
    const isTenantOrPublic = !requesterRole || requesterRole === 'TENANT' || requesterRole === 'tenant';
    if (isTenantOrPublic) {
      if (room.reviewStatus !== ReviewStatus.APPROVED || !room.isActive) {
        logger.info('Tenant/public blocked from non-approved room', {
          roomId: id,
          reviewStatus: room.reviewStatus,
          isActive: room.isActive,
          requesterRole
        });
        throw new Error('Room not found');
      }
    }
    return room;
  }

  /**
   * Create room - accepts single object with ownerId included
   * This matches the RoomController's call signature
   */
  async createRoom(roomData: any): Promise<Room> {
    logger.info('Creating room', {
      ownerId: roomData.ownerId
    });

    // Validate ownerId is present
    if (!roomData.ownerId) {
      throw new Error('ownerId is required');
    }

    // ── Auto-upgrade TENANT → OWNER on first property creation ──────
    // If the user creating a property is still a TENANT, silently upgrade
    // their role to OWNER so they gain access to owner features.
    // This does NOT block the request or change the response shape.
    try {
      const prisma = getPrismaClient();
      const creator = await prisma.user.findUnique({
        where: {
          id: roomData.ownerId
        }
      });
      if (creator && creator.role === Role.TENANT) {
        await prisma.user.update({
          where: {
            id: roomData.ownerId
          },
          data: {
            role: Role.OWNER
          }
        });
        logger.info('Auto-upgraded TENANT to OWNER on property creation', {
          userId: roomData.ownerId
        });
      }
    } catch (upgradeError) {
      // Non-fatal: log and continue. Property creation must not fail due to role upgrade issues.
      logger.error('Failed to auto-upgrade user role', {
        userId: roomData.ownerId,
        error: upgradeError instanceof Error ? upgradeError.message : 'Unknown error'
      });
    }
    // ────────────────────────────────────────────────────────────────

    // ✅ CRITICAL FIX: Normalize city to lowercase before saving
    // Prevents "Jaipur" vs "jaipur" mismatch in subscription checks
    if (roomData.city) {
      roomData.city = normalizeCity(roomData.city);
    }

    // Pass data directly to repository
    return await this.roomRepository.create(roomData);
  }
  async updateRoom(id: string, ownerId: string, input: UpdateRoomInput, requesterRole?: string): Promise<Room> {
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.ownerId !== ownerId) {
      throw new Error('You can only update your own properties');
    }

    // ✅ CRITICAL FIX: Normalize city to lowercase if present in update
    if (input.city) {
      input.city = normalizeCity(input.city);
    }

    // ✅ FIX 1: Role-aware reviewStatus reset.
    // OWNER or AGENT edit → reset to PENDING (enforces moderation lifecycle).
    // ADMIN edit → keep existing reviewStatus unchanged.
    const isOwnerOrAgent = !requesterRole || requesterRole === 'OWNER' || requesterRole === 'owner' || requesterRole === 'AGENT' || requesterRole === 'agent';
    const updateData: any = {
      ...input
    };
    if (isOwnerOrAgent) {
      updateData.reviewStatus = ReviewStatus.PENDING;
      logger.info('Owner/Agent edit: resetting reviewStatus to PENDING', {
        roomId: id,
        ownerId,
        requesterRole
      });
    } else {
      logger.info('Admin edit: preserving existing reviewStatus', {
        roomId: id,
        ownerId,
        requesterRole,
        currentStatus: room.reviewStatus
      });
    }
    const updatedRoom = await this.roomRepository.update(id, updateData);
    if (!updatedRoom) {
      throw new Error('Failed to update room');
    }
    return updatedRoom;
  }
  async deleteRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.ownerId !== userId) {
      throw new Error('Unauthorized to delete this room');
    }

    // Delete Cloudinary images before deleting room
    if (room.images && room.images.length > 0) {
      try {
        await this.cloudinaryService.deleteImages(room.images);
      } catch (error) {
        logger.error('Error deleting Cloudinary images', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Continue with room deletion even if image cleanup fails
      }
    }
    await this.roomRepository.delete(roomId);
  }
  async toggleRoomStatus(id: string, ownerId: string): Promise<Room> {
    // console.log('[RoomService] Toggling room status for room:', id);
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.ownerId !== ownerId) {
      throw new Error('You can only update your own properties');
    }
    // console.log('[RoomService] Toggling room status for room: from RoomService', id); // working
    const updatedRoom = await this.roomRepository.toggleRoomStatus(id);
    if (!updatedRoom) {
      throw new Error('Failed to update room status');
    }
    return updatedRoom;
  }

  //   async toggleRoomStatus(id: string, ownerId: string): Promise<Room> {
  //   const room = await this.roomRepository.findById(id);

  //   if (!room) throw new Error('Room not found');
  //   if (room.ownerId !== ownerId) {
  //     throw new Error('You can only update your own properties');
  //   }

  //   return this.roomRepository.update(id, {
  //     isActive: !room.isActive
  //   });
  // }

  async getOwnerRooms(ownerId: string): Promise<Room[]> {
    return this.roomRepository.findByOwnerId(ownerId);
  }

  /**
   * Search rooms with role-aware visibility enforcement.
   * TENANT/public → only APPROVED + isActive rooms returned.
   * OWNER/ADMIN/AGENT → unrestricted search.
   */
  async search(filters: any, requesterRole?: string): Promise<Room[]> {
    const isTenantOrPublic = !requesterRole || requesterRole === 'TENANT' || requesterRole === 'tenant';

    // ✅ Inject reviewStatus filter at service layer for tenant/public.
    // Repository receives it as a plain filter — no visibility logic in repository.
    const searchFilters = {
      ...filters,
      ...(isTenantOrPublic ? {
        reviewStatus: ReviewStatus.APPROVED
      } : {})
    };
    logger.info('RoomService.search called', {
      requesterRole,
      isTenantOrPublic,
      enforcingApproved: isTenantOrPublic
    });
    return this.roomRepository.search(searchFilters);
  }
}