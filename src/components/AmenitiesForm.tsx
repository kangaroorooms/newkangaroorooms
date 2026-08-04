import React, { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Search,
  X,
  Sparkles,
  CheckCircle2,
  Tag,
  AlertTriangle,
  ArrowUp,
  Bath,
  Bike,
  Box,
  Car,
  ChefHat,
  Droplets,
  Dumbbell,
  Heart,
  Home,
  Laptop,
  Lightbulb,
  Lock,
  MapPin,
  Microwave,
  Monitor,
  Package,
  Refrigerator,
  Shield,
  Sofa,
  Square,
  Sun,
  Users,
  Utensils,
  Waves,
  Wifi,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  AMENITIES_LIST,
  getAmenitiesByCategory,
  CATEGORY_LABELS,
  AMENITY_CATEGORIES,
  Amenity,
  AmenityCategoryKey,
} from '../constants/amenities.config';

const amenityIcons: Record<string, LucideIcon> = {
  AlertTriangle,
  ArrowUp,
  Bath,
  Bike,
  Box,
  Car,
  ChefHat,
  Droplets,
  Dumbbell,
  Heart,
  Home,
  Laptop,
  Lightbulb,
  Lock,
  MapPin,
  Microwave,
  Monitor,
  Refrigerator,
  Shield,
  Sofa,
  Sparkles,
  Square,
  Sun,
  Users,
  Utensils,
  Waves,
  Wifi,
  Wind,
  Zap,
};

interface AmenitiesFormProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenityIds: string[]) => void;
  error?: string;
  ariaDescribedBy?: string;
}

const getIconComponent = (iconName: string) => {
  return amenityIcons[iconName] || Package;
};

export const AmenitiesForm: React.FC<AmenitiesFormProps> = ({
  selectedAmenities,
  onAmenitiesChange,
  error,
  ariaDescribedBy,
}) => {
  const amenitiesByCategory = useMemo(() => getAmenitiesByCategory(), []);
  const allAmenities = useMemo(() => AMENITIES_LIST, []);

  const [activeCategory, setActiveCategory] = useState<AmenityCategoryKey>(
    AMENITY_CATEGORIES.ESSENTIALS
  );
  const [searchQuery, setSearchQuery] = useState('');

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const selectedAmenityObjects = useMemo(() => {
    return allAmenities.filter((amenity) => selectedAmenities.includes(amenity.id));
  }, [allAmenities, selectedAmenities]);

  const totalSelectedCount = selectedAmenities.length;

  const filteredAmenitiesByCategory = useMemo(() => {
    const result = {} as Record<string, Amenity[]>;

    Object.entries(amenitiesByCategory).forEach(([categoryKey, amenities]) => {
      const filtered = amenities.filter((amenity) => {
        if (!normalizedQuery) return true;

        const categoryLabel =
          CATEGORY_LABELS[categoryKey as keyof typeof CATEGORY_LABELS] || '';
        const haystack = `${amenity.label} ${amenity.description || ''} ${categoryLabel}`.toLowerCase();

        return haystack.includes(normalizedQuery);
      });

      if (filtered.length > 0) {
        result[categoryKey] = filtered;
      }
    });

    return result;
  }, [amenitiesByCategory, normalizedQuery]);

  const visibleCategoryKeys = useMemo(() => {
    return Object.keys(filteredAmenitiesByCategory) as AmenityCategoryKey[];
  }, [filteredAmenitiesByCategory]);

  const handleToggleAmenity = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      onAmenitiesChange(selectedAmenities.filter((id) => id !== amenityId));
    } else {
      onAmenitiesChange([...selectedAmenities, amenityId]);
    }
  };

  const handleRemoveSelected = (amenityId: string) => {
    onAmenitiesChange(selectedAmenities.filter((id) => id !== amenityId));
  };

  const handleSelectFromSearch = (amenity: Amenity) => {
    handleToggleAmenity(amenity.id);
    setActiveCategory(amenity.category as AmenityCategoryKey);

    requestAnimationFrame(() => {
      categoryRefs.current[amenity.category]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const toggleCategory = (categoryKey: AmenityCategoryKey) => {
    setActiveCategory((prev) => (prev === categoryKey ? ('' as AmenityCategoryKey) : categoryKey));
  };

  const clearSearch = () => setSearchQuery('');
  const clearAllSelected = () => onAmenitiesChange([]);

  return (
    <fieldset className="space-y-4" aria-describedby={ariaDescribedBy}>
      <legend className="sr-only">Amenities</legend>

      {/* Header / Counter */}
      <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Amenities
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Search, select, and manage amenities quickly.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {totalSelectedCount} selected
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search amenities..."
            className="
              w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-11
              text-sm text-slate-900 outline-none transition
              placeholder:text-slate-400
              focus:border-amber-400 focus:ring-2 focus:ring-amber-200
              dark:border-slate-700 dark:bg-slate-900 dark:text-white
              dark:focus:border-amber-500 dark:focus:ring-amber-500/20
            "
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Selected Chips */}
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Tag className="h-3.5 w-3.5" />
            Selected amenities
          </div>

          {selectedAmenityObjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedAmenityObjects.map((amenity) => {
                const IconComponent = getIconComponent(amenity.icon);

                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => handleRemoveSelected(amenity.id)}
                    className="
                      inline-flex items-center gap-2 rounded-full border border-amber-200
                      bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900
                      transition hover:bg-amber-100
                      dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100
                      dark:hover:bg-amber-500/20
                    "
                    title="Remove"
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span className="max-w-[160px] truncate">{amenity.label}</span>
                    <X className="h-3.5 w-3.5" />
                  </button>
                );
              })}

              <button
                type="button"
                onClick={clearAllSelected}
                className="
                  inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2
                  text-sm font-medium text-slate-700 transition hover:bg-slate-50
                  dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800
                "
              >
                Clear all
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No amenities selected yet.
            </p>
          )}
        </div>
      </div>

      {/* Search Results / Categories */}
      {normalizedQuery ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Showing results for <span className="font-semibold">“{searchQuery}”</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {Object.values(filteredAmenitiesByCategory).reduce((acc, items) => acc + items.length, 0)} results
            </p>
          </div>

          {visibleCategoryKeys.length > 0 ? (
            visibleCategoryKeys.map((categoryKey) => {
              const amenities = filteredAmenitiesByCategory[categoryKey];
              const isActive = activeCategory === categoryKey;
              const categoryLabel =
                CATEGORY_LABELS[categoryKey as keyof typeof CATEGORY_LABELS];
              const selectedCount = amenities.filter((a) =>
                selectedAmenities.includes(a.id)
              ).length;

              return (
                <div
                  key={categoryKey}
                  ref={(node) => {
                    categoryRefs.current[categoryKey] = node;
                  }}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(categoryKey)}
                    className={`
                      flex w-full items-center justify-between gap-3 px-4 py-4 text-left
                      transition hover:bg-slate-50 dark:hover:bg-slate-800/50
                      ${isActive ? 'bg-amber-50 dark:bg-amber-500/10' : ''}
                    `}
                    aria-expanded={isActive}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <h3
                        className={`text-base font-semibold ${
                          isActive
                            ? 'text-amber-900 dark:text-amber-100'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {categoryLabel}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {amenities.length} match{amenities.length !== 1 ? 'es' : ''} •{' '}
                        {selectedCount} selected
                      </p>
                    </div>

                    <ChevronDown
                      className={`
                        h-5 w-5 flex-shrink-0 transition-transform duration-300
                        ${isActive ? 'rotate-180 text-amber-600' : 'text-slate-400'}
                      `}
                    />
                  </button>

                  <div className="border-t border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-950/30">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {amenities.map((amenity) => {
                        const isSelected = selectedAmenities.includes(amenity.id);
                        const IconComponent = getIconComponent(amenity.icon);

                        return (
                          <label
                            key={amenity.id}
                            className={`
                              group flex cursor-pointer select-none items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all duration-200
                              ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200 dark:border-amber-500 dark:bg-amber-500/10 dark:ring-amber-500/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                              }
                            `}
                            title={amenity.description}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleAmenity(amenity.id)}
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-amber-600 transition focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700"
                              aria-label={amenity.label}
                            />

                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <IconComponent
                                className={`
                                  h-4 w-4 flex-shrink-0 transition-colors
                                  ${
                                    isSelected
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                                  }
                                `}
                              />

                              <span
                                className={`
                                  min-w-0 flex-1 truncate text-sm font-medium
                                  ${
                                    isSelected
                                      ? 'text-slate-900 dark:text-white'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }
                                `}
                              >
                                {amenity.label}
                              </span>

                              {amenity.isPriority && (
                                <span
                                  className={`
                                    inline-flex flex-shrink-0 items-center rounded-full px-2 py-1 text-xs font-semibold
                                    ${
                                      isSelected
                                        ? 'bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    }
                                  `}
                                >
                                  ★
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No amenities found for “{searchQuery}”.
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Try a shorter word or a different category name.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {Object.entries(amenitiesByCategory).map(([categoryKey, amenities], index) => {
            const isActive = activeCategory === categoryKey;
            const categoryLabel =
              CATEGORY_LABELS[categoryKey as keyof typeof CATEGORY_LABELS];
            const selectedCount = amenities.filter((a) =>
              selectedAmenities.includes(a.id)
            ).length;

            return (
              <div
                key={categoryKey}
                ref={(node) => {
                  categoryRefs.current[categoryKey] = node;
                }}
                className={index > 0 ? 'border-t border-slate-200 dark:border-slate-700' : ''}
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(categoryKey as AmenityCategoryKey)}
                  className={`
                    flex w-full items-center justify-between gap-3 px-4 py-4 text-left
                    transition hover:bg-slate-50 dark:hover:bg-slate-800/50
                    ${isActive ? 'bg-amber-50 dark:bg-amber-500/10' : ''}
                  `}
                  aria-expanded={isActive}
                  aria-controls={`category-content-${categoryKey}`}
                >
                  <div className="flex flex-col items-start gap-1 text-left flex-1">
                    <h3
                      className={`text-base font-semibold transition-colors ${
                        isActive
                          ? 'text-amber-900 dark:text-amber-100'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {categoryLabel}
                    </h3>
                    <p
                      className={`text-xs transition-colors ${
                        isActive
                          ? 'text-amber-700 dark:text-amber-200/70'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {amenities.length} items • {selectedCount} selected
                    </p>
                  </div>

                  <ChevronDown
                    className={`
                      h-5 w-5 flex-shrink-0 transition-all duration-300 ease-out
                      ${isActive ? 'rotate-180 text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}
                    `}
                  />
                </button>

                <div
                  id={`category-content-${categoryKey}`}
                  className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${isActive ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                  `}
                >
                  <div className="bg-slate-50/60 px-4 py-4 dark:bg-slate-950/30">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {amenities.map((amenity) => {
                        const isSelected = selectedAmenities.includes(amenity.id);
                        const IconComponent = getIconComponent(amenity.icon);

                        return (
                          <label
                            key={amenity.id}
                            className={`
                              group flex cursor-pointer select-none items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all duration-200
                              ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200 dark:border-amber-500 dark:bg-amber-500/10 dark:ring-amber-500/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                              }
                            `}
                            title={amenity.description}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleAmenity(amenity.id)}
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-amber-600 transition focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700"
                              aria-label={amenity.label}
                            />

                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <IconComponent
                                className={`
                                  h-4 w-4 flex-shrink-0 transition-colors
                                  ${
                                    isSelected
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                                  }
                                `}
                              />

                              <span
                                className={`
                                  min-w-0 flex-1 truncate text-sm font-medium
                                  ${
                                    isSelected
                                      ? 'text-slate-900 dark:text-white'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }
                                `}
                              >
                                {amenity.label}
                              </span>

                              {amenity.isPriority && (
                                <span
                                  className={`
                                    inline-flex flex-shrink-0 items-center rounded-full px-2 py-1 text-xs font-semibold
                                    ${
                                      isSelected
                                        ? 'bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    }
                                  `}
                                >
                                  ★
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        <strong>Tip:</strong> Search works instantly, even with one letter, and selected amenities stay visible as chips.
      </p>
    </fieldset>
  );
};

export default AmenitiesForm;
