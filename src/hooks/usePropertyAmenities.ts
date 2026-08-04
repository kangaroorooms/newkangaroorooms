import type { IdealFor } from "../types/api.types";
import type { PropertyFormData } from "../components/PropertyForm";

type Args = {
  formData: PropertyFormData;
  setFormData: (fn: (prev: PropertyFormData) => PropertyFormData) => void;
  clearError: (field: string) => void;
};

export function usePropertyAmenities({
  formData,
  setFormData,
  clearError,
}: Args) {
  const handleAmenitiesChange = (amenities: string[]) => {
    setFormData((prev) => ({
      ...prev,
      amenities,
    }));
  };

  const toggleIdealFor = (option: IdealFor) => {
    setFormData((prev) => {
      const updated = prev.idealFor.includes(option)
        ? prev.idealFor.filter((o) => o !== option)
        : [...prev.idealFor, option];

      if (updated.length > 0) {
        clearError("idealFor");
      }

      return {
        ...prev,
        idealFor: updated,
      };
    });
  };

  return {
    handleAmenitiesChange,
    toggleIdealFor,
  };
}

export default usePropertyAmenities;
