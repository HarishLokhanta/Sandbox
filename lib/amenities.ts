export type Amenity = Record<string, unknown> & {
  lat: number;
  lng: number;
  lon?: number;
  category: string;
  name?: string | null;
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

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function ensureDisplayName({
  rawName,
  category,
  lat,
  lng,
}: {
  rawName: string | null;
  category: string;
  lat: number;
  lng: number;
}): string {
  if (rawName && rawName.trim().length > 0) {
    return rawName.trim();
  }

  const categoryLabel = category && category.trim().length > 0 ? category.trim() : "";
  if (categoryLabel) {
    return categoryLabel;
  }

  return `Amenity (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

function ensureDisplayShort(
  displayName: string,
  category: string,
  rawName: string | null
): string {
  if (rawName && rawName.trim().length > 0) {
    return rawName.trim();
  }
  if (category && category.trim().length > 0) {
    return category.trim();
  }
  return displayName;
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

  const amenities: Amenity[] = [];

  for (const record of records) {
    if (!record || typeof record !== "object") continue;

    const lat = toFiniteNumber(record.lat ?? record.latitude);
    const lng = toFiniteNumber(record.lng ?? record.lon ?? record.longitude);

    if (lat === null || lng === null) {
      continue;
    }

    const rawName = typeof record.name === "string" ? record.name : null;
    const categoryValue = typeof record.category === "string" ? record.category : "";
    const displayName = ensureDisplayName({ rawName, category: categoryValue, lat, lng });
    const displayShort = ensureDisplayShort(displayName, categoryValue, rawName);

    const normalized: Amenity = {
      ...(record as Record<string, unknown>),
      lat,
      lon: lng,
      lng,
      category: categoryValue,
      rawName,
      displayName,
      displayShort,
    };

    if (typeof normalized.name === "string") {
      normalized.name = normalized.name.trim();
    } else if (rawName !== null) {
      normalized.name = rawName;
    }

    amenities.push(normalized);
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
