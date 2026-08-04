import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { roomsApi } from "../api/rooms.api";
import type { RoomFilters, Room } from "../types/api.types";

export interface PropertyListingsPage {
  items: Room[];
  nextCursor?: string;
  hasNextPage: boolean;
  total: number;
}

interface UsePropertyListingsOptions {
  filters: RoomFilters;
  pageSize?: number;
}

function normalizeFilters(filters: RoomFilters) {
  return {
    ...filters,
    city: filters.city || undefined,
    areaId: filters.areaId || undefined,
    location: filters.location || undefined,
    q: filters.q || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    roomType: filters.roomType || undefined,
    roomTypes: filters.roomTypes?.length ? filters.roomTypes : undefined,
    idealFor: filters.idealFor?.length ? filters.idealFor : undefined,
    genderPreference: filters.genderPreference || undefined,
    sort: filters.sort || "latest",
    limit: filters.limit || 10,
  };
}

export function usePropertyListings({
  filters,
  pageSize = 10,
}: UsePropertyListingsOptions) {
  const normalizedFilters = useMemo(() => normalizeFilters({ ...filters, limit: pageSize }), [filters, pageSize]);

  const queryKey = useMemo(
    () => ["property-listings", normalizedFilters],
    [normalizedFilters],
  );

  const query = useInfiniteQuery<any, Error, any, any, string | undefined>({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      const response: any = await roomsApi.getRooms(
        {
          ...normalizedFilters,
          cursor: typeof pageParam === "string" ? pageParam : undefined,
        },
        signal,
      );

      return {
        items: response.items ?? response.rooms ?? [],
        nextCursor: response.nextCursor,
        hasNextPage: response.hasNextPage,
        total: response.total,
      } as PropertyListingsPage;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextCursor : undefined),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    retry: 1,
  });

  // ✅ Flatten pages and deduplicate by room.id (prevents duplicates in infinite scroll)
  const items = useMemo(() => {
    if (!query.data?.pages) return [];
    const allItems: Room[] = [];
    const seenIds = new Set<string>();
    const pagesArray = Array.isArray(query.data.pages) ? query.data.pages : [];
    
    
    for (let i = 0; i < pagesArray.length; i++) {
      const pageData = pagesArray[i] as any;
      if (pageData && Array.isArray(pageData.items)) {
        for (const item of pageData.items) {
          // Skip if we've already added this room (prevent duplicates)
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(item);
          }
        }
      }
    }
    return allItems;
  }, [query.data?.pages]);

  const refresh = useCallback(() => query.refetch(), [query]);

  return {
    items,
    total: query.data?.pages[0]?.total ?? 0,
    hasNextPage: query.hasNextPage,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    fetchNextPage: () => query.fetchNextPage(),
    refetch: refresh,
    status: query.status,
  };
}
