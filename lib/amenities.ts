export type Amenity = {
  lat: number;
  lng: number;
  category: string;
  rawName?: string | null;
  displayName: string;
  displayShort: string;
};

type RawAmenityRecord = {
  lat?: unknown;
  lon?: unknown;
  lng?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  category?: unknown;
  name?: unknown;
  [key: string]: unknown;
};

function parseFloat(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function deriveDisplayName(amenity: { category: string; lat: number; lng: number; rawName?: string | null }): string {
  if (amenity.rawName && typeof amenity.rawName === "string") {
    const trimmed = amenity.rawName.trim();
    if (trimmed) return trimmed;
  }

  const category = amenity.category || "Place";
  return `${category} (${amenity.lat.toFixed(4)}, ${amenity.lng.toFixed(4)})`;
}

function deriveShort(category: string, rawName?: string | null): string {
  if (rawName && typeof rawName === "string") {
    const trimmed = rawName.trim();
    if (trimmed) return trimmed;
  }
  return category || "Place";
}

function normalizeCategory(raw: unknown): string {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed) {
      // Title case
      return trimmed
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    }
  }
  return "Other";
}

export function normalizeAmenities(raw: unknown): Amenity[] {
  if (!raw || typeof raw !== "object") return [];

  let records: RawAmenityRecord[] = [];

  if (Array.isArray(raw)) {
    records = raw;
  } else if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.results)) {
      records = obj.results;
    } else if (Array.isArray(obj.amenities)) {
      records = obj.amenities;
    }
  }

  const seen = new Set<string>();
  const amenities: Amenity[] = [];

  for (const record of records) {
    if (!record || typeof record !== "object") continue;

    // Parse coordinates
    const lat = parseFloat(record.lat ?? record.latitude);
    const lng = parseFloat(record.lon ?? record.lng ?? record.longitude);

    if (lat === null || lng === null) continue;

    const category = normalizeCategory(record.category);
    const rawName = typeof record.name === "string" ? record.name : null;

    // Deduplicate by category + coordinates
    const key = `${category.toLowerCase()}|${lat.toFixed(5)}|${lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const displayName = deriveDisplayName({ category, lat, lng, rawName });
    const displayShort = deriveShort(category, rawName);

    amenities.push({
      lat,
      lng,
      category,
      rawName,
      displayName,
      displayShort,
    });
  }

  return amenities;
}

export async function fetchAmenitiesFromAPI(suburb: string): Promise<Amenity[]> {
  const response = await fetch(
    `https://www.microburbs.com.au/report_generator/api/suburb/amenity?suburb=${encodeURIComponent(suburb)}`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer test",
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch amenities: ${response.status}`);
  }

  const data = await response.json();
  return normalizeAmenities(data);
}
