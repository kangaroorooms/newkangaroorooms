import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useId,
} from "react";
import { X, ShieldCheck, PencilLine, Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateRoom } from "../store/slices/rooms.slice";
import { showToast } from "../store/slices/ui.slice";
import { PropertyForm, PropertyFormData } from "./PropertyForm";
import { getRoomFormData } from "./propertyFormUtils";
import FullscreenLoader from "./ui/Loader";
import getPropertyValidationErrors from "../utils/propertyValidation";
import { useModalLifecycle } from "../hooks/useModalLifecycle";
import { usePropertyLocation } from "../hooks/usePropertyLocation";
import { usePropertyImages } from "../hooks/usePropertyImages";
import { usePropertyAmenities } from "../hooks/usePropertyAmenities";
import {
  Room,
  type UpdateRoomInput,
  type CreateRoomInput,
} from "../types/api.types";

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  isAdmin?: boolean;
  onEditComplete?: () => void;
  forcePendingResubmission?: boolean;
}

export function EditPropertyModal({
  isOpen,
  onClose,
  room,
  isAdmin = false,
  onEditComplete,
  forcePendingResubmission = false,
}: EditPropertyModalProps) {
  const dispatch = useAppDispatch();
  const { allCities, locationsByCity, locationsLoading } = useAppSelector(
    (state) => state.metadata,
  );
  const isUpdating = useAppSelector((state) => state.rooms.loading.update);

  const modalTitleId = useId();
  const modalDescriptionId = useId();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLInputElement | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const [formData, setFormData] = useState<PropertyFormData>(
    getRoomFormData(room),
  );
  const [initialData, setInitialData] = useState<PropertyFormData>(
    getRoomFormData(room),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSafeClose = () => {
    if (isUpdating) return;
    const data = getRoomFormData(room);
    setFormData(data);
    setInitialData(data);
    setErrors({});
    onClose();
  };

  useModalLifecycle({
    modalRef,
    isOpen,
    isBusy: isUpdating,
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
    autoMapLegacyLocation: true,
    isOpen,
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

  const getChangedFields = () => {
    const changed: Partial<PropertyFormData> = {};

    (Object.keys(formData) as Array<keyof PropertyFormData>).forEach(
      (key) => {
        const current = formData[key];
        const initial = initialData[key];

        if (JSON.stringify(current) !== JSON.stringify(initial)) {
          Object.assign(changed, { [key]: current });
        }
      },
    );

    return changed;
  };

  const validate = useCallback(
    (focusOnError = true) => {
      const newErrors = getPropertyValidationErrors(formData);
      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        if (!focusOnError) return false;

        const firstKey = Object.keys(newErrors)[0];
        const el = fieldRefs.current[firstKey];

        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          (el as HTMLElement).focus?.();
        } else if (errorSummaryRef.current) {
          errorSummaryRef.current.focus();
        }

        return false;
      }

      return true;
    },
    [formData],
  );

  useEffect(() => {
    if (!isOpen) return;

    const data = getRoomFormData(room);
    setFormData(data);
    setInitialData(data);
    setErrors({});

    const timeout = setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timeout);
    };
  }, [isOpen, room]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdating) return;
    if (!validate()) return;

    const changedData = getChangedFields();

    if (Object.keys(changedData).length === 0) {
      dispatch(
        showToast({
          message: "No changes made",
          type: "info",
        }),
      );
      return;
    }

    const { pricePerMonth, ...otherChangedData } = changedData;
    const sanitizedChanges = { ...otherChangedData } as Record<string, unknown>;

    if (sanitizedChanges.roomType === "") {
      delete sanitizedChanges.roomType;
    }

    const payload: UpdateRoomInput = {
      ...sanitizedChanges,
      ...(pricePerMonth !== undefined && {
        pricePerMonth: Number(pricePerMonth),
      }),
      ...(forcePendingResubmission && {
        reviewStatus: "pending" as const,
        isActive: false,
      }),
    } as UpdateRoomInput;

    const action = await dispatch(
      updateRoom({
        id: room.id,
        data: payload,
      }),
    );

    if (updateRoom.fulfilled.match(action)) {
      handleSafeClose();
      onEditComplete?.();
    }
  };

  return (
    <>
      {isUpdating && (
        <FullscreenLoader message="Saving your property changes..." />
      )}

      <div className="fixed inset-0 z-[60] p-0 sm:p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
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
            className="relative z-50 flex h-[100dvh] w-full flex-col overflow-hidden rounded-t-[2rem] border border-[rgba(212,175,55,0.14)] bg-[#f8f6f1] shadow-2xl dark:bg-[#0d0b06] sm:h-auto sm:max-h-[94vh] sm:max-w-5xl sm:rounded-[2rem]"
          >
            <div
              className="sticky top-0 z-20 border-b border-[rgba(212,175,55,0.12)] bg-white/80 px-4 py-4 backdrop-blur-xl dark:bg-[#0d0b06]/90 sm:px-6"
              style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.18)] bg-[rgba(212,175,55,0.10)] px-3 py-1 text-xs font-medium text-[rgba(212,175,55,0.95)]">
                      <PencilLine className="h-3.5 w-3.5" />
                      Edit Listing
                    </div>
                    {isAdmin && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        ADMIN
                      </div>
                    )}
                  </div>
                  <h2
                    id={modalTitleId}
                    className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
                  >
                    Edit Property
                  </h2>
                  <p
                    id={modalDescriptionId}
                    className="mt-1 text-sm text-slate-500 dark:text-slate-400"
                  >
                    {isAdmin
                      ? "Update this listing with full admin control."
                      : "Update your listing details and keep it renter-ready."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSafeClose}
                  disabled={isUpdating}
                  aria-label="Close edit property modal"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.12)] bg-white/70 text-slate-600 transition hover:bg-white dark:bg-[#15110b] dark:text-slate-300 dark:hover:bg-[#1c1710] disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              <div className="mx-auto w-full max-w-4xl">
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
                  isSubmitting={isUpdating}
                  submitLabel={
                    isAdmin ? "Save Changes" : "Save Changes"
                  }
                  cancelLabel="Cancel"
                  autoFocusRef={firstFocusableRef}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
