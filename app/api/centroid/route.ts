import { NextResponse } from "next/server";

import { fetchMicroburbsJson, normalizeSuburb } from "../_lib/helpers";

const BASE_URL = "https://www.microburbs.com.au/report_generator/api";
const DEFAULT_SUBURB = "Belmont North";

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

type AmenityRecord = {
  lat?: number;
  lon?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  coordinates?: {
    lat?: number;
    lon?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
  } | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requested = searchParams.get("suburb") ?? "";
  const suburb = normalizeSuburb(requested) || DEFAULT_SUBURB;

  const upstreamUrl = `${BASE_URL}/suburb/amenity?suburb=${encodeURIComponent(suburb)}`;
  const result = await fetchMicroburbsJson<{ results?: AmenityRecord[] }>(upstreamUrl);

  if (!result.ok) {
    const message = result.error || `Failed to fetch centroid for ${suburb}`;
    return NextResponse.json(
      { error: `Upstream ${result.status}: ${message}` },
      { status: 502 }
    );
  }

  const amenities = Array.isArray(result.data?.results) ? result.data.results : [];

  const points = amenities
    .map((amenity) => {
      if (!amenity || typeof amenity !== "object") {
        return null;
      }

      const coords = (amenity as AmenityRecord).coordinates ?? null;
      const lat = toFiniteNumber(
        (amenity as AmenityRecord).lat ??
          (amenity as AmenityRecord).latitude ??
          coords?.lat ??
          coords?.latitude
      );
      const lng = toFiniteNumber(
        (amenity as AmenityRecord).lon ??
          (amenity as AmenityRecord).lng ??
          (amenity as AmenityRecord).longitude ??
          coords?.lon ??
          coords?.lng ??
          coords?.longitude
      );

      if (lat === null || lng === null) {
        return null;
      }

      return { lat, lng };
    })
    .filter((point): point is { lat: number; lng: number } => Boolean(point));

  if (points.length === 0) {
    return NextResponse.json({ suburb, lat: null, lng: null });
  }

  const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;

  return NextResponse.json({ suburb, lat, lng });
}
