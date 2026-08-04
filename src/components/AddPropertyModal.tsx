import React, { useRef, useState, useId } from "react";
import { X, Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createRoom } from "../store/slices/rooms.slice";
import { getCurrentUser } from "../store/slices/auth.slice";
import { fetchOwnerRooms } from "../store/slices/owner.slice";
import { PropertyForm, PropertyFormData } from "./PropertyForm";
import { getEmptyPropertyFormData } from "./propertyFormUtils";
import FullscreenLoader from "./ui/Loader";
import getPropertyValidationErrors from "../utils/propertyValidation";
import { useModalLifecycle } from "../hooks/useModalLifecycle";
import { usePropertyLocation } from "../hooks/usePropertyLocation";
import { usePropertyImages } from "../hooks/usePropertyImages";
import { usePropertyAmenities } from "../hooks/usePropertyAmenities";
import {
  RoomType,
  type CreateRoomInput,
} from "../types/api.types";

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailVerificationRequired?: (retry: () => void) => void;
}

export function AddPropertyModal({
  isOpen,
  onClose,
  onEmailVerificationRequired,
}: AddPropertyModalProps) {
  const dispatch = useAppDispatch();
  const isCreating = useAppSelector((state) => state.rooms.loading.create);
  const { allCities, locationsByCity, locationsLoading } = useAppSelector(
    (state) => state.metadata,
  );

  const modalTitleId = useId();
  const modalDescriptionId = useId();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const [formData, setFormData] = useState<PropertyFormData>(
    getEmptyPropertyFormData(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSafeClose = () => {
    if (isCreating) return;
    setFormData(getEmptyPropertyFormData());
    setErrors({});
    onClose();
  };

  useModalLifecycle({
    modalRef,
    isOpen,
    isBusy: isCreating,
    onSafeClose: handleSafeClose,
  });

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const { handleSelectCity, handleSelectArea } = usePropertyLocation({
    dispatch,
    allCities,
    locationsByCity,
    locationsLoading,
    formData,
    setFormData,
    clearError,
  });

  const { handleImagesChange } = usePropertyImages({
    formData,
    setFormData,
    clearError,
  });

  const { handleAmenitiesChange, toggleIdealFor } = usePropertyAmenities({
    formData,
    setFormData,
    clearError,
  });

  if (!isOpen) return null;

  const handleFieldChange = (
    field: keyof PropertyFormData,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      clearError(field);
    }
  };

  const handleMapChange = (latitude: number | null, longitude: number | null) => {
    setFormData((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
    clearError("mapLocation");
  };

  const validate = () => {
    const newErrors = getPropertyValidationErrors(formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = fieldRefs.current[firstErrorKey];

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLElement).focus?.();
      } else if (errorSummaryRef.current) {
        errorSummaryRef.current.focus();
      }

      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (!validate()) return;

    const apiData: CreateRoomInput = {
      ...formData,
      pricePerMonth: Number(formData.pricePerMonth),
      roomType: formData.roomType as RoomType,
      latitude: formData.latitude ?? undefined,
      longitude: formData.longitude ?? undefined,
    };

    const action = await dispatch(createRoom(apiData));

    if (createRoom.fulfilled.match(action)) {
      dispatch(getCurrentUser());
      await dispatch(fetchOwnerRooms());
      setFormData(getEmptyPropertyFormData());
      setErrors({});
      onClose();
      return;
    }

    if (createRoom.rejected.match(action)) {
      const payload = action.payload as any;
      if (
        payload?.code === "EMAIL_VERIFICATION_REQUIRED" &&
        onEmailVerificationRequired
      ) {
        onEmailVerificationRequired(() => {
          dispatch(createRoom(apiData));
        });
      }
    }
  };



  return (
    <>
      {isCreating && (
        <FullscreenLoader message="Submitting your property listing..." />
      )}

      <div className="fixed inset-0 z-[60] p-0 sm:p-4">
        <div
          className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          onClick={handleSafeClose}
          aria-hidden="true"
        />

        <div className="relative flex h-full items-end justify-center sm:items-center">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            aria-describedby={modalDescriptionId}
            className="relative z-10 flex h-[100dvh] w-full flex-col overflow-visible rounded-t-3xl bg-slate-50 shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[94vh] sm:max-w-5xl sm:rounded-3xl"
          >
            <div
              className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 sm:px-6"
              style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    New Listing
                  </div>
                  <h2
                    id={modalTitleId}
                    className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
                  >
                    Add New Property
                  </h2>
                  <p
                    id={modalDescriptionId}
                    className="mt-1 text-sm text-slate-500 dark:text-slate-400"
                  >
                    Create a clean, complete listing that renters can trust.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSafeClose}
                  disabled={isCreating}
                  aria-label="Close add property modal"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:ring-amber-500/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-visible px-4 py-4 sm:px-6 sm:py-6">
              <div className="mx-auto max-w-4xl">
                <PropertyForm
                  formData={formData}
                  errors={errors}
                  allCities={allCities}
                  locationsByCity={locationsByCity}
                  locationsLoading={locationsLoading}
                  fieldRefs={fieldRefs}
                  onFieldChange={handleFieldChange}
                  onSelectCity={handleSelectCity}
                  onSelectArea={handleSelectArea}
                  onMapChange={handleMapChange}
                  onImagesChange={handleImagesChange}
                  onAmenitiesChange={handleAmenitiesChange}
                  onToggleIdealFor={toggleIdealFor}
                  onSubmit={handleSubmit}
                  onCancel={handleSafeClose}
                  isSubmitting={isCreating}
                  submitLabel="Create Listing"
                  cancelLabel="Cancel"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
