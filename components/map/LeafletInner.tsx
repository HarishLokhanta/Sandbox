"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [-33.014, 151.667];
const DEFAULT_ZOOM = 13;

const AMENITY_COLOR = "#0f172a"; // Black for amenities
const PROPERTY_COLOR = "#15803d"; // Green for properties  
const SCHOOL_COLOR = "#ca8a04"; // Yellow for schools

const markerIconCache = new Map<string, L.DivIcon>();

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

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

function coerceFinite(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function sanitizeMarker(marker: MarkerItem | null | undefined): MarkerItem | null {
  if (!marker) return null;
  const lat = coerceFinite(marker.lat);
  const lng = coerceFinite(marker.lng);
  if (lat === null || lng === null) return null;
  return { ...marker, lat, lng };
}

function getMarkerColor(marker: MarkerItem): string {
  if (marker.type === "property") return PROPERTY_COLOR;
  if (marker.type === "school") return SCHOOL_COLOR;
  return AMENITY_COLOR;
}

function getDivIcon(marker: MarkerItem): L.DivIcon {
  const color = getMarkerColor(marker);
  const cacheKey = `${marker.type ?? "generic"}-${color}`;
  const cached = markerIconCache.get(cacheKey);
  if (cached) return cached;
  const icon = L.divIcon({
    className: "marker-dot",
    html: `<span style="display:inline-block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #ffffff;box-shadow:0 0 0 2px rgba(15,23,42,0.2);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
  markerIconCache.set(cacheKey, icon);
  return icon;
}

function MapFocus({ marker }: { marker?: MarkerItem | null }) {
  const map = useMap();
  useEffect(() => {
    const sanitized = sanitizeMarker(marker);
    if (!sanitized) return;
    map.flyTo([sanitized.lat as number, sanitized.lng as number], Math.max(map.getZoom(), 15), {
      animate: true,
      duration: 0.8,
    });
  }, [marker, map]);
  return null;
}

export default function LeafletInner(props: MapProps) {
  const {
    center: providedCenter = DEFAULT_CENTER,
    amenityMarkers: providedAmenities = [],
    propertyMarkers: providedProperties = [],
    schoolMarkers: providedSchools = [],
    onMarkerClick,
    activeMarker = null,
  } = props ?? {};

  const center: [number, number] = useMemo(() => {
    if (!Array.isArray(providedCenter) || providedCenter.length !== 2) {
      return DEFAULT_CENTER;
    }
    return providedCenter.map((value, index) => {
      const coerced = coerceFinite(value);
      return coerced === null ? DEFAULT_CENTER[index] : coerced;
    }) as [number, number];
  }, [providedCenter]);

  const amenityMarkers = useMemo(() => {
    return ((providedAmenities ?? []) as MarkerItem[])
      .map((marker) => sanitizeMarker({ ...marker, type: marker.type ?? "amenity" }))
      .filter((marker): marker is MarkerItem & { lat: number; lng: number } => Boolean(marker));
  }, [providedAmenities]);

  const propertyMarkers = useMemo(() => {
    return ((providedProperties ?? []) as MarkerItem[])
      .map((marker) => sanitizeMarker({ ...marker, type: marker.type ?? "property" }))
      .filter((marker): marker is MarkerItem & { lat: number; lng: number } => Boolean(marker));
  }, [providedProperties]);

  const schoolMarkers = useMemo(() => {
    return ((providedSchools ?? []) as MarkerItem[])
      .map((marker) => sanitizeMarker({ ...marker, type: marker.type ?? "school" }))
      .filter((marker): marker is MarkerItem & { lat: number; lng: number } => Boolean(marker));
  }, [providedSchools]);

  const active = sanitizeMarker(activeMarker ?? undefined);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        className="h-80 w-full rounded-2xl md:h-96"
        scrollWheelZoom={false}
      >
        <MapFocus marker={active} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {propertyMarkers.map((marker, index) => (
          <Marker
            key={`property-${index}-${marker.lat}-${marker.lng}`}
            position={[marker.lat, marker.lng]}
            icon={getDivIcon(marker)}
            eventHandlers={{ click: () => onMarkerClick?.(marker) }}
          >
            {marker.label && <Popup>{marker.label}</Popup>}
          </Marker>
        ))}

        {amenityMarkers.map((marker, index) => (
          <Marker
            key={`amenity-${index}-${marker.lat}-${marker.lng}`}
            position={[marker.lat, marker.lng]}
            icon={getDivIcon(marker)}
            eventHandlers={{ click: () => onMarkerClick?.(marker) }}
          >
            {marker.label && <Popup>{marker.label}</Popup>}
          </Marker>
        ))}

        {schoolMarkers.map((marker, index) => (
          <Marker
            key={`school-${index}-${marker.lat}-${marker.lng}`}
            position={[marker.lat, marker.lng]}
            icon={getDivIcon(marker)}
            eventHandlers={{ click: () => onMarkerClick?.(marker) }}
          >
            {marker.label && <Popup>{marker.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
