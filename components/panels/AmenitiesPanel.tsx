"use client";

import { useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MapPin } from "lucide-react";
import type { Amenity } from "@/lib/amenities";
import type { MarkerItem } from "@/components/Map";
import { useAmenitiesStore } from "@/lib/stores/useAmenitiesStore";

export type AmenityRecord = Amenity;

type AmenitiesPanelProps = {
  amenities?: Amenity[];
  isLoading?: boolean;
  error?: string | null;
  onViewOnMap?: (marker: MarkerItem) => void;
};

type GroupedAmenities = {
  category: string;
  items: Amenity[];
};

export function AmenitiesPanel({
  amenities: _providedAmenities,
  isLoading,
  error,
  onViewOnMap,
}: AmenitiesPanelProps) {
  const { amenities: storeAmenities, selectedAmenityId, selectAmenity } = useAmenitiesStore();
  const amenityRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Use store amenities if available, otherwise fall back to provided amenities
  const amenities = storeAmenities.length > 0 ? storeAmenities : _providedAmenities ?? [];

  const grouped = useMemo<GroupedAmenities[]>(() => {
    const input = Array.isArray(amenities) ? amenities : [];
    const map = new Map<string, Amenity[]>();

    const toCategory = (a: Amenity): string => {
      const c = typeof a?.category === "string" ? a.category.trim() : "";
      return c || "Other";
    };

    const toDisplayName = (a: Amenity): string => {
      if (typeof a?.displayName === "string" && a.displayName.trim()) return a.displayName.trim();
      if (typeof a?.rawName === "string" && a.rawName.trim()) return a.rawName.trim();
      if (typeof a?.category === "string" && a.category.trim()) return a.category.trim();

      const lat = Number(a?.lat);
      const lng = Number(a?.lng);
      const latText = Number.isFinite(lat) ? lat.toFixed(4) : "?";
      const lngText = Number.isFinite(lng) ? lng.toFixed(4) : "?";
      return `Amenity (${latText}, ${lngText})`;
    };

    for (const a of input) {
      if (!a) continue;
      const category = toCategory(a);
      const existing = map.get(category) ?? [];
      existing.push({ ...a, displayName: toDisplayName(a) });
      map.set(category, existing);
    }

    const result = Array.from(map.entries()).map(([category, items]) => ({
      category,
      items: items
        .filter(Boolean)
        .sort((a, b) => toDisplayName(a).localeCompare(toDisplayName(b))),
    }));

    result.sort((a, b) => a.category.localeCompare(b.category));
    return result;
  }, [amenities]);

  // Scroll to selected amenity when it changes
  useEffect(() => {
    if (selectedAmenityId) {
      const element = amenityRefs.current.get(selectedAmenityId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedAmenityId]);

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Amenities</CardTitle>
          <p className="text-sm text-slate-500">Loading local highlights...</p>
        </CardHeader>
        <Separator className="mx-6" />
        <CardContent className="pt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-900">Amenities</CardTitle>
        <p className="text-sm text-slate-500">Local highlights grouped by category.</p>
      </CardHeader>
      <Separator className="mx-6" />
      <CardContent className="pt-4">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {grouped.length === 0 ? (
          <p className="text-sm text-slate-500">No amenities found. Try a different filter.</p>
        ) : (
          <ScrollArea className="max-h-[26rem] pr-2">
            <div className="space-y-4">
              {grouped.map(({ category, items }) => (
                <section key={category} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white text-slate-900">
                        {category}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {items.length} spot{items.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {items.map((amenity, index) => {
                      const amenityId = (amenity as any).id;
                      const isSelected = selectedAmenityId === amenityId;

                      return (
                        <div
                          key={amenityId ?? `${category}-${index}`}
                          ref={(el) => {
                            if (el && amenityId) {
                              amenityRefs.current.set(amenityId, el);
                            }
                          }}
                          className={`flex items-start justify-between gap-3 rounded-lg border p-3 shadow-sm transition-all cursor-pointer ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                          }`}
                          onClick={() => {
                            if (amenityId) {
                              selectAmenity(amenityId);
                            }
                            onViewOnMap?.({
                              lat: Number(amenity.lat ?? 0),
                              lng: Number(amenity.lng ?? 0),
                              label: amenity.displayName ?? category,
                              type: "amenity",
                              category: category,
                              id: amenityId,
                            });
                          }}
                        >
                          <div className="flex-1">
                            <h4 className={`text-sm font-semibold ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                              {amenity.displayName ?? "Unnamed place"}
                            </h4>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {Number(amenity.lat ?? 0).toFixed(4)}, {Number(amenity.lng ?? 0).toFixed(4)}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-8 shrink-0 ${
                              isSelected
                                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                                : "border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (amenityId) {
                                selectAmenity(amenityId);
                              }
                              onViewOnMap?.({
                                lat: Number(amenity.lat ?? 0),
                                lng: Number(amenity.lng ?? 0),
                                label: amenity.displayName ?? category,
                                type: "amenity",
                                category: category,
                                id: amenityId,
                              });
                            }}
                          >
                            <MapPin className="mr-1 h-4 w-4" />
                            View
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}