"use client";

import dynamic from "next/dynamic";

export type MarkerItem = {
  lat: number | null | undefined;
  lng: number | null | undefined;
  label?: string;
  type?: "amenity" | "property" | "school";
  category?: string;
};

type MapProps = {
  center?: [number, number];
  amenityMarkers?: MarkerItem[];
  propertyMarkers?: MarkerItem[];
  schoolMarkers?: MarkerItem[];
  onMarkerClick?: (marker: MarkerItem) => void;
  activeMarker?: MarkerItem | null;
};

const LeafletInner = dynamic(() => import("./map/LeafletInner"), {
  ssr: false,
  loading: () => (
    <div className="h-80 md:h-96 rounded-2xl border border-slate-200 bg-gray-50 animate-pulse" />
  ),
});

export default function Map(props: MapProps) {
  return <LeafletInner {...props} />;
}
