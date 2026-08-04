import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronDown, Sparkles } from "lucide-react";
import {
  AMENITIES_LIST,
  CATEGORY_LABELS,
  AMENITY_CATEGORIES,
  type AmenityCategoryKey,
} from "../constants/amenities.config";

import { Wifi, Wind, Zap, Shield, Check, Coffee, Car, Tv } from "lucide-react";

const getAmenityDetails = (amenityId: string) => {
  return AMENITIES_LIST.find((a) => a.id === amenityId);
};

const getIconForAmenity = (iconName?: string) => {
  const iconMap: Record<string, any> = {
    Wifi,
    Wind,
    Zap,
    Shield,
    Check,
    Coffee,
    Car,
    Tv,
  };

  return iconMap[iconName || "Check"] || Check;
};

const groupAmenitiesByCategory = (
  amenityIds: string[]
): Record<AmenityCategoryKey, string[]> => {
  const grouped: Record<AmenityCategoryKey, string[]> = {
    [AMENITY_CATEGORIES.ESSENTIALS]: [],
    [AMENITY_CATEGORIES.ROOM_FEATURES]: [],
    [AMENITY_CATEGORIES.KITCHEN]: [],
    [AMENITY_CATEGORIES.SAFETY]: [],
    [AMENITY_CATEGORIES.CONVENIENCE]: [],
  };

  amenityIds.forEach((id) => {
    const amenity = getAmenityDetails(id);
    if (amenity && grouped[amenity.category]) {
      grouped[amenity.category].push(id);
    }
  });

  return grouped;
};

const categoryOrder: AmenityCategoryKey[] = [
  AMENITY_CATEGORIES.ESSENTIALS,
  AMENITY_CATEGORIES.ROOM_FEATURES,
  AMENITY_CATEGORIES.KITCHEN,
  AMENITY_CATEGORIES.SAFETY,
  AMENITY_CATEGORIES.CONVENIENCE,
];

export function AmenitiesModal({
  isOpen,
  onClose,
  amenities,
}: {
  isOpen: boolean;
  onClose: () => void;
  amenities: string[];
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [expandedCategories, setExpandedCategories] = useState<
    Partial<Record<AmenityCategoryKey, boolean>>
  >({});

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handle);
      modalRef.current?.focus();
    }

    return () => document.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setExpandedCategories({});
    }
  }, [isOpen]);

  const grouped = useMemo(() => groupAmenitiesByCategory(amenities), [amenities]);

  if (!isOpen) return null;

  const toggleCategory = (categoryKey: AmenityCategoryKey) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalRef}
        tabIndex={-1}
        className="
          relative w-full overflow-hidden bg-white outline-none
          shadow-2xl dark:bg-[#0d0b06]
          h-[92dvh] rounded-t-3xl
          sm:h-auto sm:max-w-3xl sm:max-h-[88vh] sm:rounded-3xl
        "
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm dark:border-[rgba(212,175,55,0.2)] dark:bg-[#0d0b06]/95 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[rgba(212,175,55,0.95)]" />
                <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                  All Amenities
                </h3>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                {amenities.length} amenities available
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 transition hover:bg-gray-100 dark:hover:bg-white/5"
              aria-label="Close amenities modal"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-white/60" />
            </button>
          </div>
        </div>

        {/* Scrollable content only */}
        <div className="h-[calc(92dvh-132px)] overflow-y-auto px-4 py-4 sm:h-[calc(88vh-132px)] sm:px-6">
          <div className="space-y-5">
            {categoryOrder.map((categoryKey) => {
              const ids = grouped[categoryKey];
              if (!ids.length) return null;

              const isExpanded = expandedCategories[categoryKey] ?? false;
              const visibleIds = isExpanded ? ids : ids.slice(0, 6);
              const hasMore = ids.length > 6;

              return (
                <section
                  key={categoryKey}
                  className="
                    rounded-3xl border border-gray-200 bg-gray-50/70 p-3
                    dark:border-[rgba(212,175,55,0.18)] dark:bg-[rgba(212,175,55,0.06)]
                    sm:p-4
                  "
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {CATEGORY_LABELS[categoryKey]}
                      </h4>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 shadow-sm dark:bg-[rgba(212,175,55,0.12)] dark:text-[rgba(212,175,55,0.9)]">
                        {ids.length}
                      </span>
                    </div>

                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => toggleCategory(categoryKey)}
                        className="
                          inline-flex items-center gap-1 rounded-full border border-gray-200
                          bg-white px-3 py-1.5 text-xs font-semibold text-gray-700
                          transition hover:bg-gray-100
                          dark:border-[rgba(212,175,55,0.18)] dark:bg-[#0d0b06] dark:text-white/80
                          dark:hover:bg-white/5
                        "
                      >
                        {isExpanded ? "Show less" : "See more"}
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleIds.map((id) => {
                      const amenity = getAmenityDetails(id);
                      if (!amenity) return null;

                      const Icon = getIconForAmenity(amenity.icon);

                      return (
                        <div
                          key={id}
                          className="
                            flex items-start gap-3 rounded-2xl border border-gray-200
                            bg-white p-3 transition hover:-translate-y-[1px] hover:bg-gray-50
                            dark:border-[rgba(212,175,55,0.18)] dark:bg-[rgba(212,175,55,0.08)]
                            dark:hover:bg-[rgba(212,175,55,0.12)]
                          "
                        >
                          <div className="flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-[rgba(212,175,55,0.18)] dark:bg-[#0d0b06]">
                            <Icon className="h-4 w-4 text-yellow-600 dark:text-[rgba(212,175,55,0.9)]" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {amenity.label}
                            </p>
                            {amenity.description && (
                              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-white/60">
                                {amenity.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {hasMore && !isExpanded && (
                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleCategory(categoryKey)}
                        className="
                          rounded-full px-4 py-2 text-xs font-semibold
                          text-[rgba(212,175,55,0.95)] transition
                          hover:bg-[rgba(212,175,55,0.08)]
                          dark:hover:bg-[rgba(212,175,55,0.12)]
                        "
                      >
                        View all {ids.length} items
                      </button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-4 dark:border-[rgba(212,175,55,0.2)] dark:bg-[#0d0b06] sm:px-6">
          <button
            onClick={onClose}
            className="
              w-full rounded-xl py-3 text-sm font-semibold text-black
              bg-[rgba(212,175,55,0.92)] transition
              hover:bg-[rgba(212,175,55,1)]
              active:scale-[0.98]
              shadow-sm hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-[rgba(212,175,55,0.35)]
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}