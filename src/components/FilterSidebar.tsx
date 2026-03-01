import React, { useEffect } from "react";
import { X, Filter } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../src/store/hooks";
import { loadCities, loadAmenities } from "../src/store/slices/metadata.slice";
interface FilterSidebarProps {
  filters: any;
  setFilters: (filters: any) => void;
  isOpen: boolean;
  onClose: () => void;
}
const MAX_RENT = 500000; // industry upper bound
const MIN_RENT = 0;
export function FilterSidebar({
  filters,
  setFilters,
  isOpen,
  onClose
}: FilterSidebarProps) {
  const dispatch = useAppDispatch();
  const {
    cities,
    amenities
  } = useAppSelector((state) => state.metadata);
  useEffect(() => {
    if (cities.length === 0) {
      dispatch(loadCities());
    }
    if (amenities.length === 0) {
      dispatch(loadAmenities());
    }
  }, [dispatch, cities.length, amenities.length]);
  // Lock body scroll when mobile menu is open
  // useEffect(() => {
  //   if (isOpen) {
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.style.overflow = '';
  //   }
  //   return () => {
  //     document.body.style.overflow = '';
  //   };
  // }, [isOpen]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  const handleChange = (key: string, value: any) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };
  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities || [];
    const updated = current.includes(amenity) ? current.filter((a: string) => a !== amenity) : [...current, amenity];
    handleChange("amenities", updated);
  };
  return <>
      {/* Overlay for mobile */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={onClose} aria-hidden="true" />

      <aside style={{
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)"
    }} className={`
    fixed inset-y-0 left-0 z-50 w-full max-w-[300px]
    bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
    shadow-2xl transform transition-transform duration-300 ease-in-out
    lg:translate-x-0 lg:static lg:shadow-none lg:z-0 lg:h-auto lg:block
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
  `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="pt-6 px-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-bold text-navy dark:text-white font-playfair">
                Filters
              </h2>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors" aria-label="Close filters">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-8">
            {/* City */}
            <div>
              <h3 className="font-semibold text-sm text-navy dark:text-white mb-3 uppercase tracking-wider">
                Location
              </h3>
              <div className="relative">
                <select value={filters.city || ""} onChange={(e) => handleChange("city", e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all appearance-none cursor-pointer">
                  <option value="">All Cities</option>
                  {cities.map((c) => <option key={c.id} value={c.id}>
                      {c.name}
                    </option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-semibold text-sm text-navy dark:text-white mb-3 uppercase tracking-wider">
                Price Range (₹)
              </h3>
              <div className="flex gap-3 items-center">
                <input type="number" placeholder="Min" value={filters.minPrice || ""} onChange={(e) => handleChange("minPrice", e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all placeholder:text-slate-400" />

                <span className="text-slate-400">-</span>
                <input type="number" placeholder="Max" value={filters.maxPrice || ""} onChange={(e) => handleChange("maxPrice", e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all placeholder:text-slate-400" />
              </div>
            </div>

            {/* Room Type */}
            <div>
              <h3 className="font-semibold text-sm text-navy dark:text-white mb-3 uppercase tracking-wider">
                Room Type
              </h3>
              <div className="space-y-2.5">
                {["Single", "Shared", "PG", "1BHK", "2BHK"].map((type) => <label key={type} className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                      <input type="checkbox" checked={filters.roomType?.includes(type)} onChange={(e) => {
                    const current = filters.roomType || [];
                    const updated = e.target.checked ? [...current, type] : current.filter((t: string) => t !== type);
                    handleChange("roomType", updated);
                  }} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition-all checked:border-gold checked:bg-gold hover:border-gold" />

                      <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 group-hover:text-navy dark:group-hover:text-white transition-colors">
                      {type}
                    </span>
                  </label>)}
              </div>
            </div>

            {/* For Whom */}
            <div>
              <h3 className="font-semibold text-sm text-navy dark:text-white mb-3 uppercase tracking-wider">
                Ideal For
              </h3>
              <div className="space-y-2.5">
                {["Students", "Working Professionals", "Family"].map((target) => <label key={target} className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className="relative flex items-center">
                        <input type="radio" name="forWhom" checked={filters.forWhom === target} onChange={() => handleChange("forWhom", target)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition-all checked:border-gold checked:bg-gold hover:border-gold" />

                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity peer-checked:opacity-100"></div>
                      </div>
                      <span className="text-slate-600 dark:text-slate-300 group-hover:text-navy dark:group-hover:text-white transition-colors">
                        {target}
                      </span>
                    </label>)}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="font-semibold text-sm text-navy dark:text-white mb-3 uppercase tracking-wider">
                Amenities
              </h3>
              <div className="space-y-2.5">
                {amenities.map((amenity) => <label key={amenity} className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                      <input type="checkbox" checked={filters.amenities?.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition-all checked:border-gold checked:bg-gold hover:border-gold" />

                      <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 group-hover:text-navy dark:group-hover:text-white transition-colors">
                      {amenity}
                    </span>
                  </label>)}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <button onClick={() => setFilters({})} className="w-full py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-white dark:hover:bg-slate-800 hover:text-navy dark:hover:text-white hover:border-navy dark:hover:border-white transition-all shadow-sm">
              Reset All Filters
            </button>
          </div>
        </div>
      </aside>
    </>;
}