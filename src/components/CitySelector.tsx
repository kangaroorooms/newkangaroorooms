import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadAllCities } from "../store/slices/metadata.slice";
import { MapPin, Search, ChevronDown, X, Star } from "lucide-react";
import { PortalDropdown } from "./ui/PortalDropdown";

interface CitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
  placeholder?: string;
  id?: string;
  showPopular?: boolean;
}

const POPULAR_CITIES = [
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Jaipur",
];

export function CitySelector({
  value,
  onChange,
  disabled = false,
  className = "",
  error,
  placeholder = "Search city...",
  id = "city",
  showPopular = true,
}: CitySelectorProps) {
  const dispatch = useAppDispatch();
  const allCities = useAppSelector((state) => state.metadata?.allCities ?? []);
  const loading = useAppSelector((state) => state.metadata?.loading ?? false);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (allCities.length === 0) {
      dispatch(loadAllCities());
    }
  }, [dispatch, allCities.length]);

  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  const filteredCities = useMemo(
    () =>
      allCities.filter(
        (city) =>
          city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (city.state && city.state.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [allCities, searchQuery],
  );

  const popularCities = useMemo(
    () =>
      showPopular
        ? allCities.filter((city) => POPULAR_CITIES.includes(city.name))
        : [],
    [allCities, showPopular],
  );

  const selectedCity = useMemo(
    () => allCities.find((city) => city.name === value) ?? null,
    [allCities, value],
  );

  const handleSelect = useCallback(
    (cityName: string) => {
      onChange(cityName);
      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(-1);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const visibleItems =
        showPopular && searchQuery === ""
          ? popularCities.length + filteredCities.length
          : filteredCities.length;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) => (visibleItems ? (prev + 1) % visibleItems : 0));
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            visibleItems ? (prev - 1 + visibleItems) % visibleItems : 0,
          );
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0) {
            const items =
              showPopular && searchQuery === ""
                ? [...popularCities, ...filteredCities]
                : filteredCities;
            handleSelect(items[highlightedIndex].name);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
          break;
      }
    },
    [filteredCities, highlightedIndex, handleSelect, popularCities, searchQuery, showPopular],
  );

  const handleClear = useCallback(() => {
    onChange("");
    setSearchQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        if (!disabled && !loading) {
          setIsOpen((prev) => !prev);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    },
    [disabled, loading],
  );

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const baseClassName = [
    "w-full px-4 py-3 rounded-[12px] border",
    "bg-white dark:bg-slate-800",
    "text-slate-900 dark:text-white",
    "placeholder-slate-400 dark:placeholder-slate-500",
    "focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-400/50",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "transition-all",
    "cursor-pointer",
  ].join(" ");

  const errorClassName = error
    ? "border-red-400 dark:border-red-700 focus:ring-4 focus:ring-red-500/10"
    : "border-slate-300/80 dark:border-slate-600/80";

  return (
    <>
      <div className="relative" ref={wrapperRef}>
        <label className="block text-sm font-semibold text-navy dark:text-white mb-1.5">
          <MapPin className="h-4 w-4 inline mr-2" />
          City
        </label>

        <div
          ref={triggerRef}
          id={id}
          onClick={() => !disabled && !loading && setIsOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
          className={`${baseClassName} ${errorClassName} ${className} flex items-center justify-between min-h-[48px]`}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={0}
        >
          <span
            className={
              value
                ? "text-slate-900 dark:text-white"
                : "text-slate-400 dark:text-slate-500"
            }
          >
            {selectedCity ? (
              <div className="flex items-center gap-2">
                <span>{selectedCity.name}</span>
                {selectedCity.state && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedCity.state}
                  </span>
                )}
              </div>
            ) : (
              placeholder
            )}
          </span>

          <div className="flex items-center gap-2">
            {value && !disabled && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Clear city selection"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </div>

      <PortalDropdown
        isOpen={isOpen}
        anchorRef={triggerRef}
        wrapperRef={wrapperRef}
        onClose={() => {
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
        }}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
        portalId="city-selector-dropdown"
        zIndex={9999}
      >
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search city or state..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-400/50 text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-60">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading cities...
            </div>
          ) : (
            <>
              {showPopular && searchQuery === "" && popularCities.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2">
                    <Star className="h-3 w-3 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Popular Cities
                    </span>
                  </div>
                  {popularCities.map((city, index) => (
                    <div
                      key={`popular-${city.id}`}
                      ref={(el) => (itemRefs.current[index] = el)}
                      onClick={() => handleSelect(city.name)}
                      className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${
                        highlightedIndex === index
                          ? "bg-amber-50 dark:bg-amber-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      } ${
                        value === city.name
                          ? "bg-amber-50 dark:bg-amber-900/20"
                          : ""
                      }`}
                      role="option"
                      aria-selected={value === city.name}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {city.name}
                        </span>
                        {city.state && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {city.state}
                          </span>
                        )}
                      </div>
                      {value === city.name && (
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchQuery !== "" && filteredCities.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Search Results ({filteredCities.length})
                    </span>
                  </div>
                  {filteredCities.map((city, index) => {
                    const actualIndex = showPopular ? index : index;
                    return (
                      <div
                        key={`search-${city.id}`}
                        ref={(el) => (itemRefs.current[actualIndex] = el)}
                        onClick={() => handleSelect(city.name)}
                        className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${
                          highlightedIndex === actualIndex
                            ? "bg-amber-50 dark:bg-amber-900/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        } ${
                          value === city.name
                            ? "bg-amber-50 dark:bg-amber-900/20"
                            : ""
                        }`}
                        role="option"
                        aria-selected={value === city.name}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {city.name}
                          </span>
                          {city.state && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {city.state}
                            </span>
                          )}
                        </div>
                        {value === city.name && (
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {searchQuery !== "" && filteredCities.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  No cities found matching "{searchQuery}"
                </div>
              )}

              {searchQuery === "" && filteredCities.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      All Cities ({filteredCities.length})
                    </span>
                  </div>
                  {filteredCities.map((city, index) => (
                    <div
                      key={`all-${city.id}`}
                      ref={(el) => (itemRefs.current[index] = el)}
                      onClick={() => handleSelect(city.name)}
                      className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${
                        highlightedIndex === index
                          ? "bg-amber-50 dark:bg-amber-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      } ${
                        value === city.name
                          ? "bg-amber-50 dark:bg-amber-900/20"
                          : ""
                      }`}
                      role="option"
                      aria-selected={value === city.name}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {city.name}
                        </span>
                        {city.state && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {city.state}
                          </span>
                        )}
                      </div>
                      {value === city.name && (
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </PortalDropdown>

      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </>
  );
}
