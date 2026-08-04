import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { roomsApi } from "../../api/rooms.api";
import {
  Room,
  CreateRoomInput,
  UpdateRoomInput,
  UpdateAvailabilityInput,
} from "../../types/api.types";
import { showToast } from "./ui.slice";
import { ownerService } from "../../services";
import { fetchOwnerRooms, fetchOwnerSummary } from "./owner.slice";

type RejectedValue = string | { code?: string; message: string };
interface RoomsState {
  rooms: Room[];
  currentRoom: Room | null;
  loading: {
    fetch: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  error: string | null;
}
const initialState: RoomsState = {
  rooms: [],
  currentRoom: null,
  loading: {
    fetch: false,
    create: false,
    update: false,
    delete: false,
  },
  error: null,
};

// Async thunks — single-entity operations only
// List pagination handled by TanStack Query in usePropertyListings hook
export const fetchRoomById = createAsyncThunk(
  "rooms/fetchRoomById",
  async (id: string, { rejectWithValue }) => {
    try {
      const room = await roomsApi.getRoomById(id);
      return room;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch room";
      return rejectWithValue(message);
    }
  },
);
export const createRoom = createAsyncThunk(
  "rooms/createRoom",
  async (data: CreateRoomInput, { dispatch, rejectWithValue }) => {
    try {
      const room = await roomsApi.createRoom(data);
      // ✅ NEW: Clear owner rooms cache after successful property creation
      // This ensures next fetchOwnerRooms() call gets fresh data instead of stale cache
      ownerService.clearOwnerRoomsCache();
      dispatch(
        showToast({
          message: "Property added successfully!",
          type: "success",
        }),
      );
      return room;
    } catch (error: any) {
      const code = error.response?.data?.code;
      const message = error.response?.data?.message || "Failed to create room";

      // For EMAIL_VERIFICATION_REQUIRED, let UI drive the modal+retry UX.
      if (code !== "EMAIL_VERIFICATION_REQUIRED") {
        dispatch(
          showToast({
            message,
            type: "error",
          }),
        );
      }

      return rejectWithValue(
        (code
          ? {
              code,
              message,
            }
          : message) as RejectedValue,
      );
    }
  },
);
export const updateRoom = createAsyncThunk(
  "rooms/updateRoom",
  async (
    { id, data }: { id: string; data: UpdateRoomInput },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const room = await roomsApi.updateRoom(id, data);

      // ✅ 1. Clear cache
      ownerService.clearOwnerRoomsCache();

      // ✅ 2. Refetch updated data
      await dispatch(fetchOwnerRooms());
      await dispatch(fetchOwnerSummary());

      // ✅ 3. Show success
      dispatch(
        showToast({
          message: "Property updated successfully!",
          type: "success",
        }),
      );

      return room;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update room";
      dispatch(
        showToast({
          message,
          type: "error",
        }),
      );
      return rejectWithValue(message);
    }
  },
);
export const deleteRoom = createAsyncThunk(
  "rooms/deleteRoom",
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await roomsApi.deleteRoom(id);
      dispatch(
        showToast({
          message: "Property deleted successfully!",
          type: "success",
        }),
      );
      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete room";
      dispatch(
        showToast({
          message,
          type: "error",
        }),
      );
      return rejectWithValue(message);
    }
  },
);
export const toggleRoomStatus = createAsyncThunk(
  "rooms/toggleRoomStatus",
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const room = await roomsApi.toggleRoomStatus(id);
      dispatch(
        showToast({
          message: "Room status updated!",
          type: "success",
        }),
      );
      return room;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to toggle room status";
      dispatch(
        showToast({
          message,
          type: "error",
        }),
      );
      return rejectWithValue(message);
    }
  },
);

export const updateRoomAvailability = createAsyncThunk(
  "rooms/updateAvailability",
  async (
    { id, data }: { id: string; data: UpdateAvailabilityInput },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const room = await roomsApi.updateAvailability(id, data);
      ownerService.clearOwnerRoomsCache();
      await dispatch(fetchOwnerRooms());
      await dispatch(fetchOwnerSummary());
      dispatch(
        showToast({
          message: "Availability updated",
          type: "success",
        }),
      );
      return room;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update availability";
      dispatch(
        showToast({
          message,
          type: "error",
        }),
      );
      return rejectWithValue(message);
    }
  },
);

const roomsSlice = createSlice({
  name: "rooms",
  initialState,
  reducers: {
    clearCurrentRoom: (state) => {
      state.currentRoom = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ✅ FIX: Add fetchRoomById cases (MISSING BEFORE)
    builder
      .addCase(fetchRoomById.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchRoomById.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.currentRoom = action.payload;
      })
      .addCase(fetchRoomById.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload as string;
      });

    // Create room
    builder
      .addCase(createRoom.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading.create = false;
        state.rooms.unshift(action.payload);
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading.create = false;
        const payload = action.payload as RejectedValue | undefined;
        state.error =
          typeof payload === "string"
            ? payload
            : payload?.message || "Failed to create room";
      });

    // Update room
    builder
      .addCase(updateRoom.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateRoom.fulfilled, (state, action) => {
        state.loading.update = false;
        if (!action.payload) return;
        const index = state.rooms.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
        if (state.currentRoom?.id === action.payload.id) {
          state.currentRoom = action.payload;
        }
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload as string;
      });

    // ✅ FIX: Add deleteRoom cases (MISSING BEFORE)
    builder
      .addCase(deleteRoom.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.rooms = state.rooms.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteRoom.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload as string;
      });

    // ✅ FIX: Add toggleRoomStatus cases (MISSING BEFORE)
    builder
      .addCase(toggleRoomStatus.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(toggleRoomStatus.fulfilled, (state, action) => {
        state.loading.update = false;
        const index = state.rooms.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
      })
      .addCase(toggleRoomStatus.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateRoomAvailability.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateRoomAvailability.fulfilled, (state, action) => {
        state.loading.update = false;
        const index = state.rooms.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
        if (state.currentRoom?.id === action.payload.id) {
          state.currentRoom = action.payload;
        }
      })
      .addCase(updateRoomAvailability.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload as string;
      });
  },
});
export const { clearCurrentRoom, clearError } = roomsSlice.actions;
export default roomsSlice.reducer;
