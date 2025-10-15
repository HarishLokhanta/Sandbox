"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { MapPin } from "lucide-react";
import type { Amenity } from "@/lib/amenities";
import type { MarkerItem } from "@/components/Map";

type AmenitiesPanelProps = {
  amenities: Amenity[];
  isLoading?: boolean;
  error?: string | null;
  onViewOnMap?: (marker: MarkerItem) => void;
};

type GroupedAmenities = {
  category: string;
  items: Amenity[];
};

export function AmenitiesPanel({
  amenities = [],
  isLoading,
  error,
  onViewOnMap,
}: AmenitiesPanelProps) {
  const grouped = useMemo<GroupedAmenities[]>(() => {
    const input = Array.isArray(amenities) ? amenities : [];
    const map = new Map<string, Amenity[]>();

    for (const a of input) {
      if (!a) continue;
      const latOk = Number.isFinite((a as any)?.lat);
      const lngOk = Number.isFinite((a as any)?.lng);
      // Keep even if coords are missing; but ensure object shape exists
      const key = (a.category ?? "Other").toString().trim() || "Other";
      const existing = map.get(key) ?? [];
      existing.push(a);
      map.set(key, existing);
    }

    const result = Array.from(map.entries()).map(([category, items]) => {
      const safeItems = (Array.isArray(items) ? items : [])
        .filter((it) => !!it)
        .map((it) => ({
          ...it,
          // ensure displayName is always a string for UI/sort
          displayName: typeof it?.displayName === "string" && it.displayName.trim().length > 0
            ? it.displayName
            : (typeof it?.category === "string" && it.category.trim().length > 0
                ? `${it.category} (${Number(it?.lat ?? 0).toFixed(4)}, ${Number(it?.lng ?? 0).toFixed(4)})`
                : `Place (${Number(it?.lat ?? 0).toFixed(4)}, ${Number(it?.lng ?? 0).toFixed(4)})`),
        }))
        .sort((a, b) => String(a.displayName).localeCompare(String(b.displayName)));

      return { category, items: safeItems };
    });

    result.sort((a, b) => a.category.localeCompare(b.category));
    return result;
  }, [amenities]);

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold text-slate-900">Amenities</CardTitle>
          <p className="text-sm text-slate-500">Loading local highlights...</p>
        </CardHeader>
        <Separator className="mx-6" />
        <CardContent className="pt-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="space-y-1">
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
                    {items.map((amenity, index) => (
                      <div
                        key={`${amenity?.category ?? "Other"}-${amenity?.lat ?? "x"}-${amenity?.lng ?? "y"}-${index}`}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{amenity?.displayName ?? "Unnamed place"}</h4>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                          onClick={() =>
                            onViewOnMap?.({
                              lat: Number(amenity?.lat ?? 0),
                              lng: Number(amenity?.lng ?? 0),
                              label: amenity?.displayName ?? "Amenity",
                              type: "amenity",
                              category: amenity?.category ?? "Other",
                            })
                          }
                        >
                          <MapPin className="mr-1 h-4 w-4" />
                          View on map
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </ScrollArea>
        )}

        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="raw-json">
            <AccordionTrigger>Raw JSON</AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-64 overflow-x-auto rounded-lg bg-slate-900/95 px-4 py-3 text-xs text-slate-100">
                {JSON.stringify(amenities, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
