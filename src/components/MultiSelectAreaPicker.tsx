import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, X, ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";

type AreaOption = {
  id: string;
  name: string;
  count?: number;
  displayOrder?: number | null;
};

const sortAreaOptions = (areas: AreaOption[]): AreaOption[] => {
  return [...areas].sort((left, right) => {
    const nameCompare = left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
      numeric: true,
    });

    if (nameCompare !== 0) {
      return nameCompare;
    }

    const leftDisplayOrder =
      typeof left.displayOrder === "number" && Number.isFinite(left.displayOrder)
        ? left.displayOrder
        : Number.MAX_SAFE_INTEGER;
    const rightDisplayOrder =
      typeof right.displayOrder === "number" && Number.isFinite(right.displayOrder)
        ? right.displayOrder
        : Number.MAX_SAFE_INTEGER;

    if (leftDisplayOrder !== rightDisplayOrder) {
      return leftDisplayOrder - rightDisplayOrder;
    }

    return left.id.localeCompare(right.id);
  });
};

type MultiSelectAreaPickerProps = {
  areas: AreaOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  maxDisplayCount?: number;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
};

export default function MultiSelectAreaPicker({
  areas,
  selectedIds,
  onChange,
  placeholder = "Select areas...",
  searchPlaceholder = "Search areas...",
  maxDisplayCount = 3,
  disabled = false,
  isLoading = false,
  loadingText = "Loading areas...",
  className = "",
}: MultiSelectAreaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sortedAreas = useMemo(() => sortAreaOptions(areas), [areas]);

  // Filter areas based on search query while preserving alphabetical order
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return sortedAreas;
    const query = searchQuery.toLowerCase();
    return sortedAreas.filter((area) => area.name.toLowerCase().includes(query));
  }, [sortedAreas, searchQuery]);

  // Group areas alphabetically
  const groupedAreas = useMemo(() => {
    const groups: Record<string, AreaOption[]> = {};
    filteredAreas.forEach((area) => {
      const firstLetter = area.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(area);
    });
    return groups;
  }, [filteredAreas]);

  // Get selected areas in the same alphabetical order as the dropdown
  const selectedAreas = useMemo(() => {
    return sortedAreas.filter((area) => selectedIds.includes(area.id));
  }, [sortedAreas, selectedIds]);

  // Toggle area selection
  const toggleArea = useCallback((areaId: string) => {
    if (selectedIds.includes(areaId)) {
      onChange(selectedIds.filter((id) => id !== areaId));
    } else {
      onChange([...selectedIds, areaId]);
    }
  }, [selectedIds, onChange]);

  // Select all visible areas
  const selectAllVisible = useCallback(() => {
    const visibleIds = filteredAreas.map((a) => a.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onChange(selectedIds.filter((id) => !visibleIds.includes(id)));
    } else {
      onChange([...new Set([...selectedIds, ...visibleIds])]);
    }
  }, [filteredAreas, selectedIds, onChange]);

  // Clear all selections
  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  // Remove single selection from chip
  const removeSelection = useCallback((areaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== areaId));
  }, [selectedIds, onChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  const displayCount = isExpanded ? selectedAreas.length : Math.min(selectedAreas.length, maxDisplayCount);
  const hasMore = selectedAreas.length > maxDisplayCount;
  const allVisibleSelected = filteredAreas.length > 0 && filteredAreas.every((a) => selectedIds.includes(a.id));
  const isDisabled = disabled || isLoading;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`w-full min-h-[50px] flex items-center flex-wrap gap-2 px-3.5 py-2.5 rounded-2xl border transition-all duration-200 
          ${isOpen ? "border-[rgba(212,175,55,0.6)] bg-[rgba(212,175,55,0.08)] shadow-[0_0_0_4px_rgba(212,175,55,0.12)]" : "border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"}
          ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5"}
          outline-none focus:border-[rgba(212,175,55,0.6)] focus:shadow-[0_0_0_4px_rgba(212,175,55,0.12)]`}
      >
        {/* Selected Area Chips */}
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {isLoading ? (
            <span className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingText}
            </span>
          ) : selectedAreas.length === 0 ? (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {placeholder}
            </span>
          ) : (
            <>
              {selectedAreas.slice(0, displayCount).map((area) => (
                <span
                  key={area.id}
                  className="inline-flex items-center gap-1 rounded-full border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.14)] px-2.5 py-1 text-[11px] font-semibold text-[rgba(212,175,55,0.95)] shadow-sm transition-all duration-200 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  {area.name}
                  <button
                    type="button"
                    onClick={(e) => removeSelection(area.id, e)}
                    className="rounded-full p-0.5 transition-colors hover:bg-white/70 hover:text-amber-700 dark:hover:bg-slate-800/80 dark:hover:text-amber-300"
                    aria-label={`Remove ${area.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {hasMore && !isExpanded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                >
                  +{selectedAreas.length - maxDisplayCount} more
                </button>
              )}
            </>
          )}
        </div>

        {/* Chevron Icon */}
        {!isDisabled && (
          <div className="flex-shrink-0">
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 flex max-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
          
          {/* Search Header */}
          <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/95 p-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                role="searchbox"
                aria-label={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 
                  bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-700 dark:text-slate-200
                  outline-none focus:border-[rgba(212,175,55,0.6)] focus:ring-2 focus:ring-[rgba(212,175,55,0.15)]"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={selectAllVisible}
                className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
              >
                {allVisibleSelected ? "Deselect All" : "Select All Visible"}
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-amber-600 dark:text-amber-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingText}
              </div>
            ) : Object.keys(groupedAreas).length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No areas found
              </div>
            ) : (
              Object.entries(groupedAreas).map(([letter, areasInGroup]) => (
                <div key={letter}>
                  {/* Group Header */}
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {letter}
                    </span>
                  </div>
                  
                  {/* Group Items */}
                  {areasInGroup.map((area) => (
                    <label
                      key={area.id}
                      role="option"
                      aria-selected={selectedIds.includes(area.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-200 border-b border-slate-100 dark:border-slate-800/50 last:border-0 ${
                        selectedIds.includes(area.id)
                          ? "bg-amber-50/80 dark:bg-amber-500/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(area.id)}
                        onChange={() => toggleArea(area.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 
                          text-amber-500 focus:ring-amber-500 focus:ring-offset-0
                          bg-white dark:bg-slate-700"
                      />
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                        {area.name}
                      </span>
                      {area.count !== undefined && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {area.count}
                        </span>
                      )}
                      {selectedIds.includes(area.id) && (
                        <Check className="h-4 w-4 text-amber-500" />
                      )}
                    </label>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {selectedIds.length} area{selectedIds.length !== 1 ? "s" : ""} selected
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
