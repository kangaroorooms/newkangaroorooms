import type { PropertyFormData } from "../components/PropertyForm";

export function getPropertyValidationErrors(
  formData: PropertyFormData,
): Record<string, string> {
  const newErrors: Record<string, string> = {};

  if (formData.title.trim().length < 5) {
    newErrors.title = "Title must be at least 5 characters.";
  }

  if (!formData.city) {
    newErrors.city = "Please select a city.";
  } else if (!formData.areaId) {
    newErrors.areaId = "Please select an area.";
  }

  if (
    formData.latitude === null ||
    formData.longitude === null ||
    !Number.isFinite(formData.latitude) ||
    !Number.isFinite(formData.longitude)
  ) {
    newErrors.mapLocation = "Please pin the property on the map.";
  }

  if (
    !formData.pricePerMonth ||
    Number(formData.pricePerMonth) <= 0 ||
    !Number.isFinite(Number(formData.pricePerMonth))
  ) {
    newErrors.pricePerMonth = "Enter a valid monthly rent.";
  }

  if (formData.description.trim().length < 20) {
    const remaining = 20 - formData.description.trim().length;
    newErrors.description = `${remaining} more character${
      remaining !== 1 ? "s" : ""
    } required.`;
  }

  if (!formData.roomType) {
    newErrors.roomType = "Please select a room type.";
  }

  if (formData.idealFor.length === 0) {
    newErrors.idealFor = "Select at least one tenant type.";
  }

  if (formData.images.length < 3) {
    newErrors.images = "Upload at least 3 property images.";
  }

  return newErrors;
}

export default getPropertyValidationErrors;
