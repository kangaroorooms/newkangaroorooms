import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCities, fetchAllCities, fetchAmenities, fetchMetadataRegistry, fetchLocations, City, CityBasic, LocationWithCount, MetadataRegistry } from '../../api/metadata.api';
import { Amenity } from '../../constants/amenities.config';

interface MetadataState {
  cities: City[];
  allCities: CityBasic[];
  // ✅ REFACTORED: Amenities now store full Amenity objects with structure
  amenities: Amenity[];
  registry: MetadataRegistry | null;
  // ✅ NEW: Cache for locations by city with counts
  locationsByCity: Record<string, LocationWithCount[]>;
  locationsLoading: Record<string, boolean>;
  locationsError: Record<string, string | null>;
  loading: boolean;
  citiesLoading: boolean;  // ✅ CRITICAL: Separate loading state for cities
  amenitiesLoading: boolean;  // ✅ CRITICAL: Separate loading state for amenities
  registryLoading: boolean;
  error: string | null;
}

const initialState: MetadataState = {
  cities: [],
  allCities: [],
  amenities: [],
  registry: null,
  // ✅ NEW: Initialize location cache
  locationsByCity: {},
  locationsLoading: {},
  locationsError: {},
  loading: false,
  citiesLoading: false,
  amenitiesLoading: false,
  registryLoading: false,
  error: null
};

export const loadCities = createAsyncThunk('metadata/loadCities', async () => {
  return await fetchCities();
});

export const loadAllCities = createAsyncThunk('metadata/loadAllCities', async () => {
  return await fetchAllCities();
});

export const loadAmenities = createAsyncThunk('metadata/loadAmenities', async () => {
  return await fetchAmenities();
});

export const loadMetadataRegistry = createAsyncThunk('metadata/loadRegistry', async () => {
  return await fetchMetadataRegistry();
});

// ✅ NEW: Fetch locations for a specific city
export const loadLocations = createAsyncThunk('metadata/loadLocations', async (city: string) => {
  return await fetchLocations(city);
});

const metadataSlice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    // ✅ NEW: Clear locations cache when city changes
    clearLocationsCache: (state) => {
      state.locationsByCity = {};
      state.locationsLoading = {};
      state.locationsError = {};
    },
  },
  extraReducers: (builder) => {
    // ✅ CRITICAL: Use separate loading states per operation
    builder.addCase(loadCities.pending, (state) => {
      state.citiesLoading = true;
    }).addCase(loadCities.fulfilled, (state, action) => {
      state.citiesLoading = false;
      state.cities = action.payload;
    }).addCase(loadCities.rejected, (state, action) => {
      state.citiesLoading = false;
      state.error = action.error.message || 'Failed to load cities';
    }).addCase(loadAllCities.pending, (state) => {
      state.loading = true;
    }).addCase(loadAllCities.fulfilled, (state, action) => {
      state.loading = false;
      state.allCities = action.payload;
    }).addCase(loadAllCities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to load all cities';
    }).addCase(loadAmenities.pending, (state) => {
      state.amenitiesLoading = true;
    }).addCase(loadAmenities.fulfilled, (state, action) => {
      state.amenitiesLoading = false;
      // ✅ REFACTORED: Store full amenity objects
      state.amenities = action.payload;
    }).addCase(loadAmenities.rejected, (state, action) => {
      state.amenitiesLoading = false;
      state.error = action.error.message || 'Failed to load amenities';
    }).addCase(loadMetadataRegistry.pending, (state) => {
      state.registryLoading = true;
    }).addCase(loadMetadataRegistry.fulfilled, (state, action) => {
      state.registryLoading = false;
      state.registry = action.payload;
    }).addCase(loadMetadataRegistry.rejected, (state, action) => {
      state.registryLoading = false;
      state.error = action.error.message || 'Failed to load metadata registry';
    }).addCase(loadLocations.pending, (state, action) => {
      const city = action.meta.arg;
      state.locationsLoading[city] = true;
      state.locationsError[city] = null;
    }).addCase(loadLocations.fulfilled, (state, action) => {
      const city = action.meta.arg;
      state.locationsLoading[city] = false;
      state.locationsByCity[city] = action.payload;
    }).addCase(loadLocations.rejected, (state, action) => {
      const city = action.meta.arg;
      state.locationsLoading[city] = false;
      state.locationsError[city] = action.error.message || 'Failed to load locations';
    });
  }
});

export const { clearLocationsCache } = metadataSlice.actions;
export default metadataSlice.reducer;