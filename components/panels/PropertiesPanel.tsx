"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, BedDouble, Bath, CarFront, CalendarDays } from "lucide-react";

import type { MarkerItem } from "@/components/Map";
import { formatAUD, fmtBedsBaths } from "@/lib/format";

export type PropertyRecord = {
  id?: string | number;
  address?:
    | string
    | {
        street?: string;
        sal?: string;
        suburb?: string;
        state?: string;
        sa1?: string;
        [key: string]: unknown;
      }
    | null;
  area_name?: string | null;
  suburb?: string | null;
  state?: string | null;
  price?: number | null;
  price_text?: string | null;
  priceText?: string | null;
  price_display?: string | null;
  listing_price?: string | null;
  bedrooms?: number | null;
  beds?: number | null;
  bathrooms?: number | null;
  baths?: number | null;
  garage?: number | null;
  car_spaces?: number | null;
  parking?: number | null;
  listing_date?: string | null;
  date_listed?: string | null;
  listed_at?: string | null;
  listedDate?: string | null;
  category?: string | null;
  property_type?: string | null;
  propertyType?: string | null;
  attributes?: {
    bathrooms?: number | null;
    bedrooms?: number | null;
    garage_spaces?: number | null;
    land_size?: string | number | null;
    building_size?: string | number | null;
    description?: string | null;
    [key: string]: unknown;
  } | null;
  coordinates?: {
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null;
    lon?: number | null;
    lng?: number | null;
  } | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lon?: number | null;
  lng?: number | null;
};

type PropertiesPanelProps = {
  properties?: PropertyRecord[];
  error?: string;
  raw?: unknown;
  onFocusProperty?: (marker: MarkerItem) => void;
  selectedProperty?: PropertyRecord | null;
  onSelectPropertyChange?: (property: PropertyRecord | null) => void;
};

function safeString(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  return null;
}

function formatAddress(property: PropertyRecord): string {
  // If address is already a string, use it
  if (typeof property.address === "string") {
    const trimmed = property.address.trim();
    if (trimmed) return trimmed;
  }

  // If address is an object (nested structure from API), extract parts
  if (property.address && typeof property.address === "object") {
    const parts: string[] = [];
    const addr = property.address as {
      street?: string;
      sal?: string;
      suburb?: string;
      state?: string;
    };

    if (addr.street) parts.push(addr.street);
    if (addr.sal || addr.suburb) parts.push(addr.sal || addr.suburb || "");
    if (addr.state) parts.push(addr.state);

    const formatted = parts.filter(Boolean).join(", ");
    if (formatted) return formatted;
  }

  // Fallback to area_name or suburb
  return property.area_name || property.suburb || "Address unavailable";
}

function extractCoordinates(property: PropertyRecord): { lat: number; lng: number } | null {
  const sources = [
    property,
    property.coordinates ?? undefined,
  ].filter(Boolean) as Array<Record<string, unknown>>;

  for (const source of sources) {
    const lat = source.latitude ?? source.lat;
    const lng = source.longitude ?? source.lon ?? source.lng;

    if (typeof lat === "number" && typeof lng === "number" && isFinite(lat) && isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

function formatListingDate(property: PropertyRecord): string {
  const raw =
    property.listing_date ||
    property.date_listed ||
    property.listed_at ||
    property.listedDate ||
    null;

  if (!raw) {
    return "Listing date unavailable";
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(property: PropertyRecord): string {
  if (typeof property.price === "number") {
    const formatted = formatAUD(property.price);
    return formatted === "N/A" ? property.priceText || property.price_text || property.price_display || property.listing_price || "Contact agent" : formatted;
  }

  return (
    property.priceText ||
    property.price_text ||
    property.price_display ||
    property.listing_price ||
    "Contact agent"
  );
}

function extractBeds(property: PropertyRecord): number | null {
  // Check top-level properties first
  let value = property.bedrooms ?? property.beds;

  // If not found, check nested attributes object
  if ((value === null || value === undefined) && property.attributes) {
    value = property.attributes.bedrooms;
  }

  return typeof value === "number" && isFinite(value) ? value : null;
}

function extractBaths(property: PropertyRecord): number | null {
  // Check top-level properties first
  let value = property.bathrooms ?? property.baths;

  // If not found, check nested attributes object
  if ((value === null || value === undefined) && property.attributes) {
    value = property.attributes.bathrooms;
  }

  return typeof value === "number" && isFinite(value) ? value : null;
}

function extractCars(property: PropertyRecord): number | null {
  // Check top-level properties first
  let value = property.parking ?? property.car_spaces ?? property.garage;

  // If not found, check nested attributes object
  if ((value === null || value === undefined) && property.attributes) {
    value = property.attributes.garage_spaces;
  }

  return typeof value === "number" && isFinite(value) ? value : null;
}

export function PropertiesPanel({
  properties = [],
  error,
  raw,
  onFocusProperty,
  selectedProperty,
  onSelectPropertyChange,
}: PropertiesPanelProps) {
  const [internalSelected, setInternalSelected] = useState<PropertyRecord | null>(null);

  const selected = typeof selectedProperty === "undefined" ? internalSelected : selectedProperty;
  const sheetOpen = Boolean(selected);

  const list = useMemo(() => properties.filter(Boolean), [properties]);

  return (
    <>
      <Card className="bg-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold text-slate-900">For Sale Properties</CardTitle>
          <p className="text-sm text-slate-500">Current listings across Belmont North.</p>
        </CardHeader>
        <Separator className="mx-6" />
        <CardContent className="pt-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {list.length === 0 ? (
            <p className="text-sm text-slate-500">No active listings returned by the sandbox feed.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((property, index) => {
                const coordinates = extractCoordinates(property);
                const price = formatPrice(property);
                const address = formatAddress(property);
                const summary = fmtBedsBaths(
                  extractBeds(property) ?? undefined,
                  extractBaths(property) ?? undefined,
                  extractCars(property) ?? undefined
                );
                const badgeLabel = property.propertyType || property.property_type || property.category;

                return (
                  <Card
                    key={`${property.id ?? index}`}
                    className="cursor-pointer border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                    onClick={() => {
                      if (onSelectPropertyChange) {
                        onSelectPropertyChange(property);
                      } else {
                        setInternalSelected(property);
                      }
                    }}
                  >
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{price}</h3>
                        {badgeLabel && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {badgeLabel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{address}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-4 w-4 text-slate-400" />
                          {extractBeds(property) ?? "-"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-4 w-4 text-slate-400" />
                          {extractBaths(property) ?? "-"}
                        </span>
                        <span className="flex items-center gap-1">
                          <CarFront className="h-4 w-4 text-slate-400" />
                          {extractCars(property) ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{formatListingDate(property)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{summary}</span>
                      {coordinates ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-blue-600 hover:bg-blue-50"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onFocusProperty?.({
                                    lat: coordinates.lat,
                                    lng: coordinates.lng,
                                    label: address,
                                    type: "property",
                                  });
                                }}
                              >
                                <MapPin className="mr-1 h-4 w-4" />
                                Locate
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Highlight this listing on the map</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge variant="outline" className="text-xs text-slate-500">
                          No coordinates
                        </Badge>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (onSelectPropertyChange) {
              onSelectPropertyChange(null);
            } else {
              setInternalSelected(null);
            }
          }
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="text-2xl font-semibold text-slate-900">
              {selected ? formatPrice(selected) : "Property details"}
            </SheetTitle>
            {selected && (
              <SheetDescription>{formatAddress(selected)}</SheetDescription>
            )}
          </SheetHeader>

          {selected && (
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div className="flex flex-wrap gap-3 text-slate-700">
                <Badge variant="secondary">{fmtBedsBaths(
                  extractBeds(selected) ?? undefined,
                  extractBaths(selected) ?? undefined,
                  extractCars(selected) ?? undefined
                )}</Badge>
                {selected.propertyType || selected.property_type ? (
                  <Badge variant="outline" className="text-blue-700">
                    {selected.propertyType || selected.property_type}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-1">
                <p className="font-medium text-slate-900">Listing date</p>
                <p>{formatListingDate(selected)}</p>
              </div>
            </div>
          )}

          {selected && (
            <SheetFooter className="mt-6">
              <div className="flex items-center gap-2">
                {extractCoordinates(selected) ? (
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      const coordinates = extractCoordinates(selected);
                      if (!coordinates) return;
                      onFocusProperty?.({
                        lat: coordinates.lat,
                        lng: coordinates.lng,
                        label: formatAddress(selected),
                        type: "property",
                      });
                    }}
                  >
                    <MapPin className="mr-2 h-4 w-4" /> Locate on map
                  </Button>
                ) : null}
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
