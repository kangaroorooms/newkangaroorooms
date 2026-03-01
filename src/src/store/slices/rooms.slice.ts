import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { roomsApi } from "../../api/rooms.api";
import { Room, RoomFilters, CreateRoomInput, UpdateRoomInput, PaginationMeta } from "../../types/api.types";
import { showToast } from "./ui.slice";
interface RoomsState {
  rooms: Room[];
  currentRoom: Room | null;
  meta: PaginationMeta | null;
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
  meta: null,
  loading: {
    fetch: false,
    create: false,
    update: false,
    delete: false
  },
  error: null
};

// Async thunks
export const fetchRooms = createAsyncThunk("rooms/fetchRooms", async (filters: RoomFilters | undefined, {
  rejectWithValue
}) => {
  try {
    const response = await roomsApi.getRooms(filters);
    return response;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch rooms";
    return rejectWithValue(message);
  }
});
export const fetchRoomById = createAsyncThunk("rooms/fetchRoomById", async (id: string, {
  rejectWithValue
}) => {
  try {
    const room = await roomsApi.getRoomById(id);
    return room;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch room";
    return rejectWithValue(message);
  }
});
export const createRoom = createAsyncThunk("rooms/createRoom", async (data: CreateRoomInput, {
  dispatch,
  rejectWithValue
}) => {
  try {
    const room = await roomsApi.createRoom(data);
    dispatch(showToast({
      message: "Property added successfully!",
      type: "success"
    }));
    return room;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to create room";
    dispatch(showToast({
      message,
      type: "error"
    }));
    return rejectWithValue(message);
  }
});
export const updateRoom = createAsyncThunk("rooms/updateRoom", async ({
  id,
  data



}: {id: string;data: UpdateRoomInput;}, {
  dispatch,
  rejectWithValue
}) => {
  try {
    const room = await roomsApi.updateRoom(id, data);
    dispatch(showToast({
      message: "Property updated successfully!",
      type: "success"
    }));
    return room;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to update room";
    dispatch(showToast({
      message,
      type: "error"
    }));
    return rejectWithValue(message);
  }
});
export const deleteRoom = createAsyncThunk("rooms/deleteRoom", async (id: string, {
  dispatch,
  rejectWithValue
}) => {
  try {
    await roomsApi.deleteRoom(id);
    dispatch(showToast({
      message: "Property deleted successfully!",
      type: "success"
    }));
    return id;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to delete room";
    dispatch(showToast({
      message,
      type: "error"
    }));
    return rejectWithValue(message);
  }
});
export const toggleRoomStatus = createAsyncThunk("rooms/toggleRoomStatus", async (id: string, {
  dispatch,
  rejectWithValue
}) => {
  try {
    const room = await roomsApi.toggleRoomStatus(id);
    dispatch(showToast({
      message: "Room status updated!",
      type: "success"
    }));
    return room;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to toggle room status";
    dispatch(showToast({
      message,
      type: "error"
    }));
    return rejectWithValue(message);
  }
});
const roomsSlice = createSlice({
  name: "rooms",
  initialState,
  reducers: {
    clearCurrentRoom: (state) => {
      state.currentRoom = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // ✅ FIX: Add fetchRooms cases (MISSING BEFORE)
    builder.addCase(fetchRooms.pending, (state) => {
      state.loading.fetch = true;
      state.error = null;
    }).addCase(fetchRooms.fulfilled, (state, action) => {
      state.loading.fetch = false;
      state.rooms = action.payload.rooms;
      state.meta = action.payload.meta;
    }).addCase(fetchRooms.rejected, (state, action) => {
      state.loading.fetch = false;
      state.error = action.payload as string;
    });

    // ✅ FIX: Add fetchRoomById cases (MISSING BEFORE)
    builder.addCase(fetchRoomById.pending, (state) => {
      state.loading.fetch = true;
      state.error = null;
    }).addCase(fetchRoomById.fulfilled, (state, action) => {
      state.loading.fetch = false;
      state.currentRoom = action.payload;
    }).addCase(fetchRoomById.rejected, (state, action) => {
      state.loading.fetch = false;
      state.error = action.payload as string;
    });

    // Create room
    builder.addCase(createRoom.pending, (state) => {
      state.loading.create = true;
      state.error = null;
    }).addCase(createRoom.fulfilled, (state, action) => {
      state.loading.create = false;
      state.rooms.unshift(action.payload);
    }).addCase(createRoom.rejected, (state, action) => {
      state.loading.create = false;
      state.error = action.payload as string;
    });

    // Update room
    builder.addCase(updateRoom.pending, (state) => {
      state.loading.update = true;
      state.error = null;
    }).addCase(updateRoom.fulfilled, (state, action) => {
      state.loading.update = false;
      if (!action.payload) return;
      const index = state.rooms.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
      }
      if (state.currentRoom?.id === action.payload.id) {
        state.currentRoom = action.payload;
      }
    }).addCase(updateRoom.rejected, (state, action) => {
      state.loading.update = false;
      state.error = action.payload as string;
    });

    // ✅ FIX: Add deleteRoom cases (MISSING BEFORE)
    builder.addCase(deleteRoom.pending, (state) => {
      state.loading.delete = true;
      state.error = null;
    }).addCase(deleteRoom.fulfilled, (state, action) => {
      state.loading.delete = false;
      state.rooms = state.rooms.filter((r) => r.id !== action.payload);
    }).addCase(deleteRoom.rejected, (state, action) => {
      state.loading.delete = false;
      state.error = action.payload as string;
    });

    // ✅ FIX: Add toggleRoomStatus cases (MISSING BEFORE)
    builder.addCase(toggleRoomStatus.pending, (state) => {
      state.loading.update = true;
      state.error = null;
    }).addCase(toggleRoomStatus.fulfilled, (state, action) => {
      state.loading.update = false;
      const index = state.rooms.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
      }
    }).addCase(toggleRoomStatus.rejected, (state, action) => {
      state.loading.update = false;
      state.error = action.payload as string;
    });
  }
});
console.log("Rooms slice initialized with state:", roomsSlice);
export const {
  clearCurrentRoom,
  clearError
} = roomsSlice.actions;
export default roomsSlice.reducer;