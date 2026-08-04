import React from "react";
import { Check, Home, IndianRupee, MapPin, Sparkles, Users } from "lucide-react";
import ImageUpload from "./ImageUpload";
import MapLocationPicker from "./MapLocationPicker/MapLocationPicker";
import AmenitiesForm from "./AmenitiesForm";
import SearchableSelectInput from "./SearchableSelectInput";
import { FormGrid } from "./ui/FormGrid";
import {
  ROOM_TYPES,
  IDEAL_FOR,
  GENDER_PREFERENCE_OPTIONS,
  GENDER_PREFERENCE_LABELS,
} from "../constants/filterOptions";
import type { IdealFor, RoomType, GenderPreference } from "../types/api.types";

export type PropertyFormData = {
  title: string;
  city: string;
  cityId: string;
  areaId: string;
  location: string;
  landmark: string;
  addressLine: string;
  latitude: number | null;
  longitude: number | null;
  pricePerMonth: string;
  roomType: RoomType | "";
  idealFor: IdealFor[];
  description: string;
  amenities: string[];
  images: string[];
  genderPreference: GenderPreference;
};

export type CityOption = {
  id: string;
  name: string;
  cityId?: string;
};

export type AreaOption = {
  id?: string;
  name: string;
};

export interface PropertyFormProps {
  formData: PropertyFormData;
  errors: Record<string, string>;
  allCities: CityOption[];
  locationsByCity: Record<string, AreaOption[]>;
  locationsLoading: Record<string, boolean>;
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onFieldChange: (
    field: keyof PropertyFormData,
    value:
      | string
      | number
      | null
      | RoomType
      | ""
      | GenderPreference,
  ) => void;
  onSelectCity: (cityId: string) => void;
  onSelectArea: (areaId: string, areaName: string) => void;
  onMapChange: (latitude: number | null, longitude: number | null) => void;
  onImagesChange: (images: string[]) => void;
  onAmenitiesChange: (amenities: string[]) => void;
  onToggleIdealFor: (option: IdealFor) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  footerInfo?: React.ReactNode;
  areaEmptyText?: string;
  autoFocusRef?: React.MutableRefObject<HTMLInputElement | null>;
}

const inputClass =
  "w-full h-12 rounded-2xl border border-[rgba(212,175,55,0.16)] bg-white/95 px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[rgba(212,175,55,0.4)] focus:ring-4 focus:ring-[rgba(212,175,55,0.12)] dark:border-[rgba(212,175,55,0.18)] dark:bg-[#15110b] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[rgba(212,175,55,0.45)] dark:focus:ring-[rgba(212,175,55,0.12)]";

const textareaClass =
  "w-full min-h-[140px] rounded-2xl border border-[rgba(212,175,55,0.16)] bg-white/95 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[rgba(212,175,55,0.4)] focus:ring-4 focus:ring-[rgba(212,175,55,0.12)] dark:border-[rgba(212,175,55,0.18)] dark:bg-[#15110b] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[rgba(212,175,55,0.45)] dark:focus:ring-[rgba(212,175,55,0.12)]";

const labelClass =
  "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200";

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[rgba(212,175,55,0.16)] bg-white/80 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl dark:border-[rgba(212,175,55,0.14)] dark:bg-[#120f0a]/80 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.12)] text-[rgba(212,175,55,0.95)] dark:bg-[rgba(212,175,55,0.1)] dark:text-[rgba(212,175,55,0.9)]">
            {icon}
          </div>
        )}
        <div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h4>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function ErrorText({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <p
      id={id}
      className="mt-2 text-xs font-medium text-red-600 dark:text-red-400"
    >
      {children}
    </p>
  );
}

function PropertyImagesSection({
  images,
  onImagesChange,
  error,
  fieldRefs,
}: {
  images: string[];
  onImagesChange: (images: string[]) => void;
  error?: string;
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
}) {
  return (
    <SectionCard
      title="Photos"
      subtitle="Add at least 3 clear images to improve trust and visibility."
      icon={<Home className="h-5 w-5" />}
    >
      <div
        ref={(el) => {
          fieldRefs.current.images = el;
        }}
      >
        <ImageUpload images={images} onImagesChange={onImagesChange} />
        {error && <ErrorText id="images-error">{error}</ErrorText>}
      </div>
    </SectionCard>
  );
}

function PropertyBasicSection({
  formData,
  errors,
  allCities,
  locationsByCity,
  locationsLoading,
  fieldRefs,
  onFieldChange,
  onSelectCity,
  onSelectArea,
  areaEmptyText,
  autoFocusRef,
}: {
  formData: PropertyFormData;
  errors: Record<string, string>;
  allCities: CityOption[];
  locationsByCity: Record<string, AreaOption[]>;
  locationsLoading: Record<string, boolean>;
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onFieldChange: (
    field: keyof PropertyFormData,
    value:
      | string
      | number
      | null
      | RoomType
      | ""
      | GenderPreference,
  ) => void;
  onSelectCity: (cityId: string) => void;
  onSelectArea: (areaId: string, areaName: string) => void;
  areaEmptyText?: string;
  autoFocusRef?: React.RefObject<HTMLInputElement>;
}) {
  const cityOptions = allCities.map((city) => ({
    value: city.id,
    label: city.name,
  }));

  const areaOptions = (locationsByCity[formData.city] || []).map((area) => ({
    value: area.id || area.name,
    label: area.name,
  }));

  const areaPlaceholder = formData.city
    ? locationsLoading[formData.city]
      ? "Loading areas..."
      : "Search area..."
    : "Select city first";

  return (
    <SectionCard
      title="Basic Details"
      subtitle="Give your listing a clear title and accurate location details."
      icon={<MapPin className="h-5 w-5" />}
    >
      <FormGrid columns={{ md: 2 }} gap="default">
        <div>
          <label htmlFor="title" className={labelClass}>
            Property Title *
          </label>
          <div className="relative">
            <input
              ref={(el) => {
                fieldRefs.current.title = el;
                if (autoFocusRef && el) {
                  (autoFocusRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                }
              }}
              id="title"
              value={formData.title}
              maxLength={100}
              onChange={(e) => onFieldChange("title", e.target.value)}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
              className={`${inputClass} ${
                errors.title
                  ? "!border-red-400 !ring-4 !ring-red-100 dark:!border-red-500/70 dark:!ring-red-500/10"
                  : ""
              }`}
              placeholder="e.g. Fully Furnished PG near College"
            />
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                formData.title.length >= 100
                  ? "text-red-500"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {formData.title.length}/100
            </span>
          </div>
          {errors.title && <ErrorText id="title-error">{errors.title}</ErrorText>}
        </div>

        <div
          ref={(el) => {
            if (el) {
              fieldRefs.current.city = el;
            }
          }}
          tabIndex={-1}
        >
          <label htmlFor="city" className={labelClass}>
            City *
          </label>
          <SearchableSelectInput
            id="city"
            value={formData.city}
            onChange={(value) => onSelectCity(value)}
            options={cityOptions}
            placeholder="Search city..."
            emptyText="No cities found"
            inputClassName={`${inputClass} ${
              errors.city
                ? "!border-red-400 !ring-4 !ring-red-100 dark:!border-red-500/70 dark:!ring-red-500/10"
                : ""
            }`}
          />
          {errors.city && <ErrorText id="city-error">{errors.city}</ErrorText>}
        </div>

        <div
          ref={(el) => {
            if (el) {
              fieldRefs.current.areaId = el;
            }
          }}
          tabIndex={-1}
        >
          <label htmlFor="area" className={labelClass}>
            Area *
          </label>
          <SearchableSelectInput
            id="area"
            value={formData.areaId}
            onChange={(value) => {
              const selectedArea =
                locationsByCity[formData.city]?.find(
                  (area) => (area.id || area.name) === value,
                );
              onSelectArea(value, selectedArea?.name || "");
            }}
            options={areaOptions}
            placeholder={areaPlaceholder}
            emptyText={
              areaEmptyText ||
              (formData.location && !formData.areaId
                ? `Legacy area: ${formData.location}`
                : "No active areas found")
            }
            inputClassName={`${inputClass} ${
              errors.areaId
                ? "!border-red-400 !ring-4 !ring-red-100 dark:!border-red-500/70 dark:!ring-red-500/10"
                : ""
            }`}
          />
          {errors.areaId && <ErrorText id="area-error">{errors.areaId}</ErrorText>}
        </div>

        <div>
          <label htmlFor="landmark" className={labelClass}>
            Landmark
          </label>
          <input
            id="landmark"
            value={formData.landmark}
            onChange={(e) => onFieldChange("landmark", e.target.value)}
            className={inputClass}
            placeholder="e.g. Near Allen Samyak"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="addressLine" className={labelClass}>
            Address
          </label>
          <input
            id="addressLine"
            value={formData.addressLine}
            onChange={(e) => onFieldChange("addressLine", e.target.value)}
            className={inputClass}
            placeholder="House number, street, building name"
          />
        </div>
      </FormGrid>
    </SectionCard>
  );
}

function PropertyMapSection({
  formData,
  error,
  onMapChange,
  fieldRefs,
}: {
  formData: PropertyFormData;
  error?: string;
  onMapChange: (latitude: number | null, longitude: number | null) => void;
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
}) {
  return (
    <SectionCard
      title="Map Location"
      subtitle="Pin the exact location so renters can find it easily."
      icon={<MapPin className="h-5 w-5" />}
    >
      <div
        ref={(el) => {
          fieldRefs.current.mapLocation = el;
        }}
        tabIndex={-1}
      >
        <MapLocationPicker
          latitude={formData.latitude}
          longitude={formData.longitude}
          onChange={onMapChange}
          defaultCity={formData.city || "bangalore"}
          showLabel={true}
        />
        {error && <ErrorText id="map-error">{error}</ErrorText>}
      </div>
    </SectionCard>
  );
}

function PropertyPricingSection({
  formData,
  errors,
  fieldRefs,
  onFieldChange,
}: {
  formData: PropertyFormData;
  errors: Record<string, string>;
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onFieldChange: (
    field: keyof PropertyFormData,
    value:
      | string
      | number
      | null
      | RoomType
      | ""
      | GenderPreference,
  ) => void;
}) {
  return (
    <SectionCard
      title="Pricing & Property Type"
      subtitle="Set the rent and choose the room configuration."
      icon={<IndianRupee className="h-5 w-5" />}
    >
      <FormGrid columns={{ md: 2 }} gap="default">
        <div>
          <label htmlFor="price" className={labelClass}>
            Monthly Rent (₹) *
          </label>
          <input
            ref={(el) => {
              fieldRefs.current.pricePerMonth = el;
            }}
            id="price"
            type="number"
            min="1"
            inputMode="numeric"
            value={formData.pricePerMonth}
            onChange={(e) => onFieldChange("pricePerMonth", e.target.value)}
            aria-invalid={!!errors.pricePerMonth}
            aria-describedby={
              errors.pricePerMonth ? "price-error" : undefined
            }
            className={`${inputClass} ${
              errors.pricePerMonth
                ? "!border-red-400 !ring-4 !ring-red-100 dark:!border-red-500/70 dark:!ring-red-500/10"
                : ""
            }`}
            placeholder="e.g. 8500"
          />
          {errors.pricePerMonth && (
            <ErrorText id="price-error">{errors.pricePerMonth}</ErrorText>
          )}
        </div>

        <div>
          <label htmlFor="roomType" className={labelClass}>
            Room Type *
          </label>
          <select
            ref={(el) => {
              fieldRefs.current.roomType = el;
            }}
            id="roomType"
            value={formData.roomType}
            onChange={(e) => onFieldChange("roomType", e.target.value as RoomType | "")}
            aria-invalid={!!errors.roomType}
            aria-describedby={errors.roomType ? "roomType-error" : undefined}
            className={`${inputClass} ${
              errors.roomType
                ? "!border-red-400 !ring-4 !ring-red-100 dark:!border-red-500/70 dark:!ring-red-500/10"
                : ""
            }`}
          >
            <option value="">Select Room Type</option>
            {ROOM_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.roomType && (
            <ErrorText id="roomType-error">{errors.roomType}</ErrorText>
          )}
        </div>
      </FormGrid>
    </SectionCard>
  );
}

function PropertyGenderSection({
  formData,
  fieldRefs,
  onFieldChange,
}: {
  formData: PropertyFormData;
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onFieldChange: (
    field: keyof PropertyFormData,
    value:
      | string
      | number
      | null
      | RoomType
      | ""
      | GenderPreference,
  ) => void;
}) {
  return (
    <SectionCard
      title="Who can rent?"
      subtitle="Specify if this property is available for anyone, boys only, or girls only."
      icon={<Users className="h-5 w-5" />}
    >
      <fieldset
        ref={(el) => {
          fieldRefs.current.genderPreference = el;
        }}
      >
        <legend className="sr-only">Gender Preference</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {GENDER_PREFERENCE_OPTIONS.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                formData.genderPreference === option
                  ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200 dark:border-amber-500 dark:bg-amber-500/10 dark:ring-amber-500/20"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/60"
              }`}
            >
              <input
                type="radio"
                name="genderPreference"
                value={option}
                checked={formData.genderPreference === option}
                onChange={() => onFieldChange("genderPreference", option)}
                className="h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {GENDER_PREFERENCE_LABELS[option]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </SectionCard>
  );
}

function PropertyIdealForSection({
  formData,
  errors,
  fieldRefs,
  onToggleIdealFor,
}: {
  formData: PropertyFormData;
  errors: Record<string, string>;
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onToggleIdealFor: (option: IdealFor) => void;
}) {
  return (
    <SectionCard
      title="Ideal For"
      subtitle="Choose who this property suits best."
      icon={<Check className="h-5 w-5" />}
    >
      <fieldset
        ref={(el) => {
          fieldRefs.current.idealFor = el;
        }}
        aria-invalid={!!errors.idealFor}
        aria-describedby={errors.idealFor ? "idealFor-error" : undefined}
      >
        <FormGrid columns={{ sm: 2, md: 3 }} gap="compact">
          {IDEAL_FOR.map((option) => {
            const active = formData.idealFor.includes(option);
            return (
              <label
                key={option}
                className={`group flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all ${
                  active
                    ? "border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.10)] text-slate-900 dark:bg-[rgba(212,175,55,0.08)] dark:text-white"
                    : "border-[rgba(212,175,55,0.14)] bg-white/70 hover:bg-[rgba(212,175,55,0.05)] dark:bg-[#15110b]"
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                    active
                      ? "border-[rgba(212,175,55,0.9)] bg-[rgba(212,175,55,0.9)] text-black"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                </div>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onToggleIdealFor(option)}
                  className="sr-only"
                />
                <span>{option}</span>
              </label>
            );
          })}
        </FormGrid>
        {errors.idealFor && (
          <ErrorText id="idealFor-error">{errors.idealFor}</ErrorText>
        )}
      </fieldset>
    </SectionCard>
  );
}

function PropertyDescriptionSection({
  formData,
  errors,
  fieldRefs,
  onFieldChange,
}: {
  formData: PropertyFormData;
  errors: Record<string, string>;
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onFieldChange: (
    field: keyof PropertyFormData,
    value:
      | string
      | number
      | null
      | RoomType
      | ""
      | GenderPreference,
  ) => void;
}) {
  return (
    <SectionCard
      title="Description"
      subtitle="Tell renters what makes this property worth choosing."
      icon={<Sparkles className="h-5 w-5" />}
    >
      <div>
        <label htmlFor="description" className={labelClass}>
          Property Description *
        </label>
        <textarea
          ref={(el) => {
            fieldRefs.current.description = el;
          }}
          id="description"
          rows={5}
          maxLength={500}
          value={formData.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "description-error" : "description-help"
          }
          className={`${textareaClass} ${
            errors.description
              ? "!border-red-400 !ring-4 !ring-red-100 dark:!border-red-500/70 dark:!ring-red-500/10"
              : ""
          }`}
          placeholder="Describe the room, furnishing, nearby places, rules, and what makes it stand out..."
        />
        <div className="mt-2 flex items-center justify-between">
          {errors.description ? (
            <ErrorText id="description-error">{errors.description}</ErrorText>
          ) : (
            <p id="description-help" className="text-xs text-slate-500 dark:text-slate-400">
              Minimum 20 characters
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formData.description.length}/500
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function PropertyAmenitiesSection({
  amenities,
  error,
  fieldRefs,
  onAmenitiesChange,
}: {
  amenities: string[];
  error?: string;
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onAmenitiesChange: (amenities: string[]) => void;
}) {
  return (
    <SectionCard
      title="Amenities"
      subtitle="Highlight the facilities available at this property."
      icon={<Home className="h-5 w-5" />}
    >
      <div
        ref={(el) => {
          fieldRefs.current.amenities = el;
        }}
      >
        <AmenitiesForm
          selectedAmenities={amenities}
          onAmenitiesChange={onAmenitiesChange}
          error={error}
          ariaDescribedBy={error ? "amenities-error" : undefined}
        />
      </div>
    </SectionCard>
  );
}

function PropertyFormFooter({
  onCancel,
  submitLabel,
  cancelLabel,
  footerInfo,
  isSubmitting,
}: {
  onCancel: () => void;
  submitLabel: string;
  cancelLabel: string;
  footerInfo?: React.ReactNode;
  isSubmitting?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-[rgba(212,175,55,0.12)] bg-white/85 px-4 py-4 backdrop-blur-xl dark:bg-[#0d0b06]/90 sm:-mx-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">{footerInfo}</div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.18)] bg-white/70 px-5 text-sm font-medium text-slate-700 transition hover:bg-white dark:bg-[#15110b] dark:text-slate-300 dark:hover:bg-[#1c1710] sm:w-auto"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[rgba(212,175,55,0.92)] px-5 text-sm font-semibold text-[#0d0b06] shadow-[0_10px_30px_rgba(212,175,55,0.22)] transition hover:scale-[1.01] hover:bg-[rgba(212,175,55,1)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
            ) : null}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PropertyForm({
  formData,
  errors,
  allCities,
  locationsByCity,
  locationsLoading,
  fieldRefs,
  onFieldChange,
  onSelectCity,
  onSelectArea,
  onMapChange,
  onImagesChange,
  onAmenitiesChange,
  onToggleIdealFor,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel,
  cancelLabel = "Cancel",
  footerInfo,
  areaEmptyText,
  autoFocusRef,
}: PropertyFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {Object.keys(errors).length > 0 && (
        <div
          ref={(el) => {
            if (el) {
              fieldRefs.current.errorSummary = el;
            }
          }}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-red-300 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/20"
        >
          <p className="font-semibold text-red-700 dark:text-red-400">
            Please fix the following issues:
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-600 dark:text-red-300">
            {Object.values(errors).map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <PropertyImagesSection
        images={formData.images}
        onImagesChange={onImagesChange}
        error={errors.images}
        fieldRefs={fieldRefs}
      />

      <PropertyBasicSection
        formData={formData}
        errors={errors}
        allCities={allCities}
        locationsByCity={locationsByCity}
        locationsLoading={locationsLoading}
        fieldRefs={fieldRefs}
        onFieldChange={onFieldChange}
        onSelectCity={onSelectCity}
        onSelectArea={onSelectArea}
        areaEmptyText={areaEmptyText}
        autoFocusRef={autoFocusRef}
      />

      <PropertyMapSection
        formData={formData}
        error={errors.mapLocation}
        onMapChange={onMapChange}
        fieldRefs={fieldRefs}
      />

      <PropertyPricingSection
        formData={formData}
        errors={errors}
        fieldRefs={fieldRefs}
        onFieldChange={onFieldChange}
      />

      <PropertyGenderSection
        formData={formData}
        fieldRefs={fieldRefs}
        onFieldChange={onFieldChange}
      />

      <PropertyIdealForSection
        formData={formData}
        errors={errors}
        fieldRefs={fieldRefs}
        onToggleIdealFor={onToggleIdealFor}
      />

      <PropertyDescriptionSection
        formData={formData}
        errors={errors}
        fieldRefs={fieldRefs}
        onFieldChange={onFieldChange}
      />

      <PropertyAmenitiesSection
        amenities={formData.amenities}
        error={errors.amenities}
        fieldRefs={fieldRefs}
        onAmenitiesChange={onAmenitiesChange}
      />

      <PropertyFormFooter
        onCancel={onCancel}
        submitLabel={submitLabel}
        cancelLabel={cancelLabel}
        footerInfo={footerInfo}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
