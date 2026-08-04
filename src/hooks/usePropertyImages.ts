import type { PropertyFormData } from "../components/PropertyForm";

type Args = {
  formData: PropertyFormData;
  setFormData: (fn: (prev: PropertyFormData) => PropertyFormData) => void;
  clearError: (field: string) => void;
};

export function usePropertyImages({
  formData,
  setFormData,
  clearError,
}: Args) {
  const handleImagesChange = (images: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }));
    if (images.length >= 3) {
      clearError("images");
    }
  };

  return {
    handleImagesChange,
  };
}

export default usePropertyImages;
