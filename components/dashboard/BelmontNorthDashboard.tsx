"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useAmenitiesStore } from "@/lib/stores/useAmenitiesStore";

import type { MarkerItem } from "@/components/Map";
import type { AmenityRecord } from "@/components/panels/AmenitiesPanel";
import {
  PropertiesPanel,
  type PropertyRecord,
} from "@/components/panels/PropertiesPanel";
import { SimilarPanel, type SimilarRecord } from "@/components/panels/SimilarPanel";
import { SummaryPanel } from "@/components/panels/SummaryPanel";
import { SchoolsPanel } from "@/components/panels/SchoolsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin } from "lucide-react";
import type { School } from "@/lib/schools";

const Map = dynamic(() => import("../Map"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full rounded-2xl border border-slate-200 bg-gray-50 animate-pulse md:h-96" />
  ),
});

const DEFAULT_CENTER: [number, number] = [-33.014, 151.667];

type Coordinates = { lat: number; lng: number };

type BelmontNorthDashboardProps = {
  center?: [number, number];
  amenityMarkers?: MarkerItem[];
  propertyMarkers?: MarkerItem[];
  amenities: {
    items?: AmenityRecord[];
    error?: string;
    raw?: unknown;
  };
  properties: {
    items?: PropertyRecord[];
    error?: string;
    raw?: unknown;
  };
  similar: {
    items?: SimilarRecord[];
    error?: string;
    raw?: unknown;
  };
  summary: {
    data?: unknown;
    error?: string;
  };
  schools: {
    items?: School[];
    error?: string;
    isLoading?: boolean;
  };
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickFirstFinite(...values: Array<unknown>): number | null {
  for (const value of values) {
    const coerced = toFiniteNumber(value);
    if (coerced !== null) {
      return coerced;
    }
  }
  return null;
}

function getAmenityCoordinates(record: AmenityRecord | undefined | null): Coordinates | null {
  if (!record) {
    return null;
  }

  const coords = record.coordinates as Record<string, unknown> | undefined;
  const lat = pickFirstFinite(
    record.latitude,
    record.lat,
    coords?.latitude,
    coords?.lat
  );
  const lng = pickFirstFinite(
    record.longitude,
    record.lon,
    record.lng,
    coords?.longitude,
    coords?.lon,
    coords?.lng
  );

  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng };
}

function formatPropertyAddress(record: PropertyRecord): string {
  // If address is already a string, use it
  if (typeof record.address === "string") {
    const trimmed = record.address.trim();
    if (trimmed) return trimmed;
  }

  // If address is an object (nested structure from API), extract parts
  if (record.address && typeof record.address === "object") {
    const addr = record.address as Record<string, unknown>;
    const parts: string[] = [];

    if (typeof addr.street === "string") parts.push(addr.street);
    if (typeof addr.sal === "string" || typeof addr.suburb === "string") {
      parts.push((addr.sal || addr.suburb) as string);
    }
    if (typeof addr.state === "string") parts.push(addr.state);

    const formatted = parts.filter(Boolean).join(", ");
    if (formatted) return formatted;
  }

  // Fallback to area_name or suburb
  return record.area_name || record.suburb || "Property";
}

function getPropertyCoordinates(record: PropertyRecord | undefined | null): Coordinates | null {
  if (!record) {
    return null;
  }

  const coords = record.coordinates as Record<string, unknown> | undefined;
  const lat = pickFirstFinite(
    record.latitude,
    record.lat,
    coords?.latitude,
    coords?.lat
  );
  const lng = pickFirstFinite(
    record.longitude,
    record.lon,
    record.lng,
    coords?.longitude,
    coords?.lon,
    coords?.lng
  );

  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng };
}

function coordinateKey(coords: Coordinates): string {
  return `${coords.lat.toFixed(6)}-${coords.lng.toFixed(6)}`;
}

function sanitizeCenter(center: [number, number] | undefined): [number, number] {
  if (!Array.isArray(center) || center.length !== 2) {
    return DEFAULT_CENTER;
  }

  const [lat, lng] = center;
  const coercedLat = toFiniteNumber(lat) ?? DEFAULT_CENTER[0];
  const coercedLng = toFiniteNumber(lng) ?? DEFAULT_CENTER[1];
  return [coercedLat, coercedLng];
}

export function BelmontNorthDashboard(props: BelmontNorthDashboardProps) {
  const {
    center: providedCenter = DEFAULT_CENTER,
    amenities,
    properties,
    similar,
    summary,
    schools,
  } = props;

  const { setAmenities, amenities: storeAmenities } = useAmenitiesStore();

  const amenityItems = useMemo<AmenityRecord[]>(
    () => (Array.isArray(amenities?.items) ? amenities.items : []),
    [amenities?.items]
  );

  // Populate the store with amenities
  useEffect(() => {
    if (amenityItems.length > 0) {
      setAmenities(amenityItems);
    }
  }, [amenityItems, setAmenities]);
  const propertyItems = useMemo<PropertyRecord[]>(
    () => (Array.isArray(properties?.items) ? properties.items : []),
    [properties?.items]
  );
  const similarItems = useMemo<SimilarRecord[]>(
    () => (Array.isArray(similar?.items) ? similar.items : []),
    [similar?.items]
  );
  const schoolItems = useMemo<School[]>(
    () => (Array.isArray(schools?.items) ? schools.items : []),
    [schools?.items]
  );

  const safeCenter = sanitizeCenter(providedCenter);

  const amenityMarkers = useMemo<MarkerItem[]>(() => {
    const markers: MarkerItem[] = [];
    // Use store amenities if available for IDs, otherwise use amenityItems
    const sourceAmenities = storeAmenities.length > 0 ? storeAmenities : amenityItems;

    for (const amenity of sourceAmenities) {
      const coords = getAmenityCoordinates(amenity);
      if (!coords) {
        continue;
      }

      const displayName =
        typeof amenity?.displayName === "string" && amenity.displayName.trim().length > 0
          ? amenity.displayName.trim()
          : typeof amenity?.rawName === "string" && amenity.rawName.trim().length > 0
          ? amenity.rawName.trim()
          : typeof amenity?.name === "string" && amenity.name.trim().length > 0
          ? amenity.name.trim()
          : "";

      const categoryLabel =
        typeof amenity?.category === "string" && amenity.category.trim().length > 0
          ? amenity.category.trim()
          : typeof amenity?.type === "string" && amenity.type.trim().length > 0
          ? amenity.type.trim()
          : undefined;

      const fallbackLabel = categoryLabel
        ? `${categoryLabel} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
        : `Amenity (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;

      markers.push({
        lat: coords.lat,
        lng: coords.lng,
        label: displayName || fallbackLabel,
        type: "amenity" as const,
        category: categoryLabel,
        id: (amenity as any).id, // Include the ID from the store
      });
    }

    return markers;
  }, [storeAmenities, amenityItems]);

  const { propertyMarkers, propertyLookup } = useMemo(() => {
    const lookup: Record<string, PropertyRecord> = {};
    const markers: MarkerItem[] = [];

    for (const property of propertyItems) {
      const coords = getPropertyCoordinates(property);
      if (!coords) continue;

      const key = coordinateKey(coords);
      if (!lookup[key]) {
        lookup[key] = property;
      }

      markers.push({
        lat: coords.lat,
        lng: coords.lng,
        label: formatPropertyAddress(property),
        type: "property",
      });
    }

    return { propertyMarkers: markers, propertyLookup: lookup };
  }, [propertyItems]);

  const schoolMarkers = useMemo<MarkerItem[]>(() => {
    return schoolItems
      .filter((school) => {
        return (
          typeof school.lat === "number" &&
          Number.isFinite(school.lat) &&
          typeof school.lng === "number" &&
          Number.isFinite(school.lng)
        );
      })
      .map((school) => ({
        lat: school.lat,
        lng: school.lng,
        label: school.name,
        type: "school" as const,
      }));
  }, [schoolItems]);

  const [activeMarker, setActiveMarker] = useState<MarkerItem | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyRecord | null>(null);

  const amenityCount = amenityItems.length;
  const propertyCount = propertyItems.length;
  const schoolCount = schoolItems.length;
  const summaryData = summary?.data;
  const summaryError = summary?.error;
  const medianPrice = findMedianFromSummary(summaryData ?? null);

  const handleFocusMarker = (marker: MarkerItem | null) => {
    if (!marker) {
      setActiveMarker(null);
      return;
    }

    const lat = toFiniteNumber(marker.lat);
    const lng = toFiniteNumber(marker.lng);

    if (lat === null || lng === null) {
      return;
    }

    setActiveMarker({
      ...marker,
      lat,
      lng,
    });
  };

  const handleFocusProperty = (marker: MarkerItem) => {
    handleFocusMarker(marker);
    const lat = toFiniteNumber(marker.lat);
    const lng = toFiniteNumber(marker.lng);
    if (lat !== null && lng !== null) {
      const key = coordinateKey({ lat, lng });
      const match = propertyLookup[key];
      if (match) {
        setSelectedProperty(match);
      }
    }
  };

  const handleMarkerClick = (marker: MarkerItem) => {
    handleFocusMarker(marker);
    if (marker.type === "property") {
      const lat = toFiniteNumber(marker.lat);
      const lng = toFiniteNumber(marker.lng);
      if (lat !== null && lng !== null) {
        const key = coordinateKey({ lat, lng });
        const match = propertyLookup[key];
        if (match) {
          setSelectedProperty(match);
        }
      }
    }
  };

  useEffect(() => {
    if (!selectedProperty) {
      return;
    }

    const coords = getPropertyCoordinates(selectedProperty);
    if (!coords) {
      return;
    }

    setActiveMarker({
      lat: coords.lat,
      lng: coords.lng,
      label: formatPropertyAddress(selectedProperty),
      type: "property",
    });
  }, [selectedProperty]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div>
          <Map
            center={safeCenter}
            amenityMarkers={amenityMarkers}
            propertyMarkers={propertyMarkers}
            schoolMarkers={schoolMarkers}
            activeMarker={activeMarker}
            onMarkerClick={handleMarkerClick}
          />
        </div>
        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900">Belmont North Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                <span>Mapped amenities</span>
                <Badge className="bg-blue-600 text-white">{amenityCount}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>Active listings</span>
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  {propertyCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>Schools nearby</span>
                <Badge variant="outline" className="border-yellow-200 text-yellow-700">
                  {schoolCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>Median price (summary)</span>
                <Badge variant="outline" className="border-slate-300 text-slate-800">
                  {medianPrice ? `$${medianPrice.toLocaleString("en-AU")}` : "N/A"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900">Data freshness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-500">
              <p>Sandbox responses are fetched live via server-side proxy routes.</p>
              <p className="leading-relaxed">
                Microburbs sandbox token supports a small set of NSW suburbs. Values may be
                redacted or rounded for demo purposes.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <Tabs defaultValue="amenities" className="space-y-6">
          <TabsList>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="properties">For Sale</TabsTrigger>
            <TabsTrigger value="schools">Schools Nearby</TabsTrigger>
            <TabsTrigger value="similar">Similar</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="amenities">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">Amenities</CardTitle>
                <p className="text-sm text-slate-500">
                  To view amenities, click the black dots on the map.
                </p>
              </CardHeader>
              <Separator className="mx-6" />
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-slate-900">Interactive Map Markers</h3>
                    <p className="text-sm text-slate-600">
                      All amenities are displayed as black markers on the map above. Click any marker
                      to view details about that location including its name and category.
                    </p>
                    <p className="text-xs text-slate-500">
                      {amenityCount} amenity location{amenityCount === 1 ? '' : 's'} available on the map
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties">
            <PropertiesPanel
              properties={propertyItems}
              error={properties?.error}
              onFocusProperty={handleFocusProperty}
              selectedProperty={selectedProperty}
              onSelectPropertyChange={setSelectedProperty}
            />
          </TabsContent>

          <TabsContent value="schools">
            <SchoolsPanel
              schools={schoolItems}
              isLoading={schools?.isLoading}
              error={schools?.error}
              onViewOnMap={handleFocusMarker}
            />
          </TabsContent>

          <TabsContent value="similar">
            <SimilarPanel records={similarItems} error={similar?.error} />
          </TabsContent>

          <TabsContent value="summary">
            <SummaryPanel summary={summaryData} error={summaryError} />
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      <p className="text-xs text-slate-500">
        Sandbox data (Bearer test) — limited to demo areas. Built with shadcn/ui and Leaflet for Belmont
        North only.
      </p>
    </div>
  );
}

function findMedianFromSummary(summary: unknown): number | null {
  if (!summary || typeof summary !== "object") {
    return null;
  }

  if (Array.isArray(summary)) {
    for (const item of summary) {
      if (item && typeof item === "object") {
        const value = (item as Record<string, unknown>).median ?? (item as Record<string, unknown>).value;
        const coerced = toFiniteNumber(value);
        if (coerced !== null) {
          return coerced;
        }
      }
    }
    return null;
  }

  for (const [key, value] of Object.entries(summary as Record<string, unknown>)) {
    if (key.toLowerCase().includes("median")) {
      const coerced = toFiniteNumber(value);
      if (coerced !== null) {
        return coerced;
      }
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nestedValue = (value as Record<string, unknown>).value;
      const coerced = toFiniteNumber(nestedValue);
      if (coerced !== null && key.toLowerCase().includes("median")) {
        return coerced;
      }
    }
  }

  return null;
}

/*
Test plan:
- Load the page with no data or missing fields → verified no crashes and UI renders fallbacks.
- Load amenities with invalid lat/lon values → only markers with finite coordinates render.
- Toggle network offline and back → panels surface errors but map mounts without throwing.
- Verify different data permutations (amenities only, properties only, both, neither) render without runtime errors.
*/
