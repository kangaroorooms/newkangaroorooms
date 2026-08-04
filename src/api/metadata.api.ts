import axiosInstance from './axios';
import { cachedFetch } from '../utils/apiCache';
import { Amenity } from '../constants/amenities.config';

export interface City {
  id: string;
  cityId?: string;
  slug?: string;
  name: string;
  state: string;
  totalListings: number;
}

export interface CityBasic {
  id: string;
  cityId?: string;
  slug?: string;
  name: string;
  state: string;
}

export interface Area {
  id: string;
  cityId: string;
  city?: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  count?: number;
}

// ✅ NEW: Amenities response with grouping support
export interface AmenityCategory {
  id: string;
  label: string;
  amenities: Amenity[];
}

export interface MetadataRegistryEntry {
  id: string;
  label: string;
  category?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface MetadataRegistry {
  propertyTypes: MetadataRegistryEntry[];
  listingTypes: MetadataRegistryEntry[];
  accommodationTypes: MetadataRegistryEntry[];
  roomTypes: MetadataRegistryEntry[];
  idealFor: MetadataRegistryEntry[];
  genderPreferences: MetadataRegistryEntry[];
  amenities: MetadataRegistryEntry[];
  bathroomCatalog: MetadataRegistryEntry[];
  kitchenCatalog: MetadataRegistryEntry[];
  furnishingCatalog: MetadataRegistryEntry[];
  propertyFeaturesCatalog: MetadataRegistryEntry[];
  rulesCatalog: MetadataRegistryEntry[];
  safetyCatalog: MetadataRegistryEntry[];
  utilitiesCatalog: MetadataRegistryEntry[];
  filters: {
    roomTypes: MetadataRegistryEntry[];
    idealFor: MetadataRegistryEntry[];
    genderPreferences: MetadataRegistryEntry[];
    budgetRanges: Array<{ id: string; label: string; min: number; max: number }>;
  };
}

// ✅ CACHED API CALLS: Prevent duplicate requests within 5 minutes
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const fetchCities = async (): Promise<City[]> => {
  return cachedFetch('metadata:cities', async () => {
    const response = await axiosInstance.get('/metadata/cities');
    return response.data.data;
  }, CACHE_TTL);
};

export const fetchAllCities = async (): Promise<CityBasic[]> => {
  return cachedFetch('metadata:allCities', async () => {
    const response = await axiosInstance.get('/metadata/cities/all');
    return response.data.data;
  }, CACHE_TTL);
};

// ✅ REFACTORED: Returns structured amenities with full details
export const fetchAmenities = async (): Promise<Amenity[]> => {
  return cachedFetch('metadata:amenities', async () => {
    const response = await axiosInstance.get('/metadata/amenities');
    return response.data.data;
  }, CACHE_TTL);
};

// ✅ NEW: Get amenities grouped by category
export const fetchAmenitiesGrouped = async (): Promise<AmenityCategory[]> => {
  return cachedFetch('metadata:amenities:grouped', async () => {
    const response = await axiosInstance.get('/metadata/amenities/grouped');
    return response.data.data;
  }, CACHE_TTL);
};

export const fetchMetadataRegistry = async (): Promise<MetadataRegistry> => {
  return cachedFetch('metadata:registry', async () => {
    const response = await axiosInstance.get('/metadata/registry');
    return response.data.data;
  }, CACHE_TTL);
};

// ✅ NEW: Location with count interface
export interface LocationWithCount {
  id?: string;
  cityId?: string;
  city?: string;
  name: string;
  slug?: string;
  displayOrder?: number;
  isActive?: boolean;
  count: number;
}

// ✅ NEW: Get locations for a given city with counts
export const fetchLocations = async (city: string): Promise<LocationWithCount[]> => {
  const cacheKey = `metadata:locations:${city}`;
  return cachedFetch(cacheKey, async () => {
    const response = await axiosInstance.get('/metadata/areas', {
      params: { city }
    });
    return response.data.data;
  }, CACHE_TTL);
};
