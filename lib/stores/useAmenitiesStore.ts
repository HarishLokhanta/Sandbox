import { create } from "zustand";
import type { Amenity } from "@/lib/amenities";

export type AmenityWithId = Amenity & {
  id: string;
};

type AmenitiesStore = {
  amenities: AmenityWithId[];
  selectedAmenityId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAmenities: (amenities: Amenity[]) => void;
  selectAmenity: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSelection: () => void;
};

// Helper to generate unique ID for amenity
function generateAmenityId(amenity: Amenity, index: number): string {
  return `${amenity.lat}-${amenity.lng}-${amenity.category}-${index}`;
}

export const useAmenitiesStore = create<AmenitiesStore>((set) => ({
  amenities: [],
  selectedAmenityId: null,
  isLoading: false,
  error: null,

  setAmenities: (amenities: Amenity[]) =>
    set({
      amenities: amenities.map((amenity, index) => ({
        ...amenity,
        id: generateAmenityId(amenity, index),
      })),
    }),

  selectAmenity: (id: string | null) =>
    set({ selectedAmenityId: id }),

  setLoading: (isLoading: boolean) =>
    set({ isLoading }),

  setError: (error: string | null) =>
    set({ error }),

  clearSelection: () =>
    set({ selectedAmenityId: null }),
}));
