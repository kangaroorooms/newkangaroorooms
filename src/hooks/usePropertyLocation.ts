import { useEffect } from "react";
import type { PropertyFormData } from "../components/PropertyForm";
import type { AppDispatch } from "../store/store";
import { loadAllCities, loadLocations } from "../store/slices/metadata.slice";

type Args = {
  dispatch: AppDispatch;
  allCities: { id: string; name: string; cityId?: string }[];
  locationsByCity: Record<string, { id?: string; name: string }[]>;
  locationsLoading: Record<string, boolean>;
  formData: PropertyFormData;
  setFormData: (fn: (prev: PropertyFormData) => PropertyFormData) => void;
  clearError: (field: string) => void;
  autoMapLegacyLocation?: boolean;
  isOpen?: boolean;
};

export function usePropertyLocation({
  dispatch,
  allCities,
  locationsByCity,
  locationsLoading,
  formData,
  setFormData,
  clearError,
  autoMapLegacyLocation = false,
  isOpen = false,
}: Args) {
  useEffect(() => {
    if (allCities.length === 0) {
      dispatch(loadAllCities());
    }
  }, [dispatch, allCities.length]);

  useEffect(() => {
    if (formData.city) {
      dispatch(loadLocations(formData.city));
    }
  }, [dispatch, formData.city]);

  useEffect(() => {
    if (!autoMapLegacyLocation || !isOpen) return;
    if (formData.areaId || !formData.city || !formData.location) return;

    const match = locationsByCity[formData.city]?.find(
      (area) => area.name.toLowerCase() === formData.location.toLowerCase(),
    );

    if (match?.id) {
      setFormData((prev) => ({
        ...prev,
        areaId: match.id || "",
        location: match.name,
      }));
    }
  }, [formData.areaId, formData.city, formData.location, isOpen, locationsByCity, autoMapLegacyLocation, setFormData]);

  const handleSelectCity = (cityId: string) => {
    const selectedCity = allCities.find((city) => city.id === cityId);
    setFormData((prev) => ({
      ...prev,
      city: cityId,
      cityId: selectedCity?.cityId || "",
      areaId: "",
      location: "",
    }));
    clearError("city");
    clearError("areaId");
    clearError("mapLocation");
  };

  const handleSelectArea = (areaId: string, areaName: string) => {
    setFormData((prev) => ({
      ...prev,
      areaId,
      location: areaName,
    }));
    clearError("areaId");
  };

  return {
    handleSelectCity,
    handleSelectArea,
    locationsLoading,
  };
}

export default usePropertyLocation;
