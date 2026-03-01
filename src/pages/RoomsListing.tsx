import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search } from 'lucide-react';
import { RoomCard } from '../components/RoomCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { fetchRooms } from '../src/store/slices/rooms.slice';
import { RoomFilters } from '../src/types/api.types';
export function RoomsListing() {
  const dispatch = useAppDispatch();
  const {
    rooms,
    loading,
    meta
  } = useAppSelector((state) => state.rooms);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  // Initialize filters from URL params
  const [filters, setFilters] = useState<any>({
    city: searchParams.get('city') || '',
    minPrice: '',
    maxPrice: '',
    roomType: searchParams.get('type') ? [searchParams.get('type')] : [],
    forWhom: '',
    amenities: [] as string[]
  });
  useEffect(() => {
    // Prepare filters for API
    const apiFilters: RoomFilters = {
      city: filters.city || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      roomType: filters.roomType?.length ? filters.roomType[0] : undefined,
      idealFor: filters.forWhom || undefined,
      amenities: filters.amenities?.length ? filters.amenities.join(',') : undefined,
      onlyActive: 'true',
      page: 1,
      limit: 20
    };
    dispatch(fetchRooms(apiFilters));
  }, [dispatch, filters]);
  // Client-side sorting (since API doesn't support sort param yet)
  const sortedRooms = [...rooms].sort((a, b) => {
    if (sortBy === 'price_asc') return a.pricePerMonth - b.pricePerMonth;
    if (sortBy === 'price_desc') return b.pricePerMonth - a.pricePerMonth;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0; // recommended (default order)
  });
  return <div className="min-h-screen bg-cream dark:bg-slate-950 pt-16 md:pt-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy dark:text-white font-playfair mb-1">
              Find Your Stay
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Showing {meta?.total || 0} properties available now
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button onClick={() => setIsFilterOpen(true)} className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-navy dark:text-white font-medium shadow-sm active:scale-95 transition-all">

              <Filter className="w-4 h-4" />
              Filters
            </button>

            <div className="relative flex-1 min-w-[180px] md:w-56">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-white text-sm font-medium focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 cursor-pointer shadow-sm">

                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-8 items-start">
          {/* Sidebar */}
          <FilterSidebar filters={filters} setFilters={setFilters} isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />


          {/* Grid */}
          <div className="flex-1 min-w-0">
            {loading.fetch ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] animate-pulse">

                    <div className="h-56 bg-slate-200 dark:bg-slate-800"></div>
                    <div className="p-5 space-y-4">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </div>
                  </div>)}
              </div> : sortedRooms.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedRooms.map((room) => <RoomCard key={room.id} room={room} />)}
              </div> : <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center px-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-navy dark:text-white mb-2 font-playfair">
                  No properties found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                  We couldn't find any matches for your current filters. Try
                  adjusting your search criteria.
                </p>
                <button onClick={() => setFilters({
              city: '',
              minPrice: '',
              maxPrice: '',
              roomType: [],
              forWhom: '',
              amenities: []
            })} className="px-8 py-3 bg-navy dark:bg-white text-white dark:text-navy font-semibold rounded-xl hover:bg-gold dark:hover:bg-slate-200 transition-colors shadow-lg shadow-navy/20">

                  Clear All Filters
                </button>
              </div>}
          </div>
        </div>
      </div>
    </div>;
}