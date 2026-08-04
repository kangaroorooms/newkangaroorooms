import type { Room } from "../types/api.types";
import type { PropertyFormData } from "./PropertyForm";

export const getEmptyPropertyFormData = (): PropertyFormData => ({
  title: "",
  city: "",
  cityId: "",
  areaId: "",
  location: "",
  landmark: "",
  addressLine: "",
  latitude: null,
  longitude: null,
  pricePerMonth: "",
  roomType: "",
  idealFor: [],
  description: "",
  amenities: [],
  images: [],
  genderPreference: "ANY",
});

export const getRoomFormData = (room: Room): PropertyFormData => ({
  title: room.title ?? "",
  city: room.city ?? "",
  cityId: room.cityId ?? "",
  areaId: room.areaId ?? "",
  location: room.location ?? "",
  landmark: room.landmark ?? "",
  addressLine: room.addressLine ?? "",
  latitude: room.latitude ?? null,
  longitude: room.longitude ?? null,
  pricePerMonth: room.pricePerMonth?.toString() ?? "",
  roomType: (room.roomType as PropertyFormData["roomType"]) ?? "",
  idealFor: Array.isArray(room.idealFor) ? room.idealFor : [],
  description: room.description ?? "",
  amenities: Array.isArray(room.amenities) ? room.amenities : [],
  images: Array.isArray(room.images) ? room.images : [],
  genderPreference: (room.genderPreference as PropertyFormData["genderPreference"]) ?? "ANY",
});
