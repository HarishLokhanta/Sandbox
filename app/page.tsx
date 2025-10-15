import { BelmontNorthDashboard } from "@/components/dashboard/BelmontNorthDashboard";
import type { MarkerItem } from "@/components/Map";
import type { AmenityRecord } from "@/components/panels/AmenitiesPanel";
import type { PropertyRecord } from "@/components/panels/PropertiesPanel";
import type { SimilarRecord } from "@/components/panels/SimilarPanel";

const DEFAULT_CENTER: [number, number] = [-33.014, 151.667];

type ProxyResult = {
  data?: unknown;
  raw?: unknown;
  error?: string;
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://127.0.0.1:3000";
}

async function fetchProxy(baseUrl: string, path: string): Promise<ProxyResult> {
  try {
    const response = await fetch(new URL(path, baseUrl), {
      cache: "no-store",
    });

    const json = await response.json();

    if (!response.ok) {
      const message = typeof json?.error === "string" ? json.error : `Request failed (${response.status})`;
      return { error: message, raw: json };
    }

    return { data: json, raw: json };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function extractAmenities(payload: unknown): AmenityRecord[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload as AmenityRecord[];
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.amenities)) {
      return record.amenities as AmenityRecord[];
    }
    if (Array.isArray(record.results)) {
      return record.results as AmenityRecord[];
    }
  }

  return [];
}

function extractProperties(payload: unknown): PropertyRecord[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload as PropertyRecord[];
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.properties)) {
      return record.properties as PropertyRecord[];
    }
    if (Array.isArray(record.listings)) {
      return record.listings as PropertyRecord[];
    }
    if (Array.isArray(record.results)) {
      return record.results as PropertyRecord[];
    }
  }

  return [];
}

function extractSimilar(payload: unknown): SimilarRecord[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload as SimilarRecord[];
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.similar)) {
      return record.similar as SimilarRecord[];
    }
    if (Array.isArray(record.similar_suburbs)) {
      return record.similar_suburbs as SimilarRecord[];
    }
    if (Array.isArray(record.results)) {
      return record.results as SimilarRecord[];
    }
  }

  return [];
}

function toCoordinates(source: Record<string, unknown> | undefined): { lat: number; lng: number } | null {
  if (!source) {
    return null;
  }

  const lat = source.latitude ?? source.lat;
  const lng = source.longitude ?? source.lon ?? source.lng;

  if (typeof lat === "number" && typeof lng === "number" && isFinite(lat) && isFinite(lng)) {
    return { lat, lng };
  }

  return null;
}

function buildAmenityMarkers(amenities: AmenityRecord[]): MarkerItem[] {
  const markers: MarkerItem[] = [];

  for (const amenity of amenities) {
    const coords = toCoordinates(
      ({
        latitude: amenity.latitude ?? undefined,
        longitude: amenity.longitude ?? amenity.lon ?? amenity.lng ?? undefined,
        lat: amenity.lat ?? undefined,
        lon: amenity.lon ?? undefined,
        lng: amenity.lng ?? undefined,
      } as unknown) as Record<string, unknown>
    );

    if (!coords && amenity.coordinates && typeof amenity.coordinates === "object") {
      const nested = amenity.coordinates as Record<string, unknown>;
      const nestedCoords = toCoordinates(nested);
      if (nestedCoords) {
        markers.push({
          lat: nestedCoords.lat,
          lng: nestedCoords.lng,
          label: amenity.name || amenity.type || "Amenity",
          type: "amenity",
          category: amenity.category || amenity.type || undefined,
        });
        continue;
      }
    }

    if (!coords) {
      continue;
    }

    markers.push({
      lat: coords.lat,
      lng: coords.lng,
      label: amenity.name || amenity.type || "Amenity",
      type: "amenity",
      category: amenity.category || amenity.type || undefined,
    });
  }

  return markers;
}

function formatPropertyAddress(property: PropertyRecord): string {
  // If address is already a string, use it
  if (typeof property.address === "string") {
    const trimmed = property.address.trim();
    if (trimmed) return trimmed;
  }

  // If address is an object (nested structure from API), extract parts
  if (property.address && typeof property.address === "object") {
    const addr = property.address as Record<string, unknown>;
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
  return property.area_name || property.suburb || "Listing";
}

function buildPropertyMarkers(properties: PropertyRecord[]): MarkerItem[] {
  const markers: MarkerItem[] = [];

  for (const property of properties) {
    const baseCoords = toCoordinates(
      ({
        latitude: property.latitude ?? undefined,
        longitude: property.longitude ?? property.lon ?? property.lng ?? undefined,
        lat: property.lat ?? undefined,
        lon: property.lon ?? undefined,
        lng: property.lng ?? undefined,
      } as unknown) as Record<string, unknown>
    );

    let coords = baseCoords;

    if (!coords && property.coordinates && typeof property.coordinates === "object") {
      coords = toCoordinates(property.coordinates as Record<string, unknown>);
    }

    if (!coords) {
      continue;
    }

    markers.push({
      lat: coords.lat,
      lng: coords.lng,
      label: formatPropertyAddress(property),
      type: "property",
    });
  }

  return markers;
}

export default async function Page() {
  const baseUrl = getBaseUrl();

  const [amenitiesRes, propertiesRes, similarRes, summaryRes] = await Promise.all([
    fetchProxy(baseUrl, "/api/amenities"),
    fetchProxy(baseUrl, "/api/properties"),
    fetchProxy(baseUrl, "/api/similar"),
    fetchProxy(baseUrl, "/api/summary"),
  ]);

  const amenitiesList = extractAmenities(amenitiesRes.data);
  const propertyList = extractProperties(propertiesRes.data);
  const similarList = extractSimilar(similarRes.data);

  const amenityMarkers = buildAmenityMarkers(amenitiesList);
  const propertyMarkers = buildPropertyMarkers(propertyList);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 space-y-2">
          <p className="text-xs uppercase tracking-[0.35rem] text-blue-700">Sandbox</p>
          <h1 className="text-4xl font-bold text-slate-900">
            Belmont North — Real estate &amp; amenities (Sandbox)
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Server-rendered dashboard using shadcn/ui and Leaflet. All data is proxied through Next.js
            API routes to avoid CORS and sanitized for safe parsing.
          </p>
        </header>

        <BelmontNorthDashboard
          center={DEFAULT_CENTER}
          amenityMarkers={amenityMarkers}
          propertyMarkers={propertyMarkers}
          amenities={{ items: amenitiesList, error: amenitiesRes.error, raw: amenitiesRes.raw }}
          properties={{ items: propertyList, error: propertiesRes.error, raw: propertiesRes.raw }}
          similar={{ items: similarList, error: similarRes.error, raw: similarRes.raw }}
          summary={{ data: summaryRes.data, error: summaryRes.error }}
        />
      </div>
    </main>
  );
}
