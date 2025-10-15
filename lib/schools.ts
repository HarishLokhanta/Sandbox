export type School = {
  lat: number;
  lng: number;
  name: string;
  level?: string | null;
  sector?: string | null;
  rating?: number | null;
  naplan_rank?: string | null;
  attendance_rate?: number | null;
  school_level_type?: string | null;
  school_sector_type?: string | null;
  raw?: any;
};

type RawSchoolRecord = {
  lat?: unknown;
  lon?: unknown;
  lng?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  name?: unknown;
  school_level_type?: unknown;
  level?: unknown;
  school_sector_type?: unknown;
  sector?: unknown;
  naplan?: unknown;
  rating?: unknown;
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

function safeString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  return null;
}

function deriveSchoolName(lat: number, lng: number, rawName?: unknown): string {
  const name = safeString(rawName);
  if (name) return name;
  return `School (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

export function normalizeSchools(raw: unknown): School[] {
  if (!raw || typeof raw !== "object") return [];

  let records: RawSchoolRecord[] = [];

  if (Array.isArray(raw)) {
    records = raw;
  } else if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.results)) {
      records = obj.results;
    } else if (Array.isArray(obj.schools)) {
      records = obj.schools;
    }
  }

  const seen = new Set<string>();
  const schools: School[] = [];

  for (const record of records) {
    if (!record || typeof record !== "object") continue;

    // Parse coordinates
    const lat = parseFloat(record.lat ?? record.latitude);
    const lng = parseFloat(record.lon ?? record.lng ?? record.longitude);

    if (lat === null || lng === null) continue;

    // Deduplicate by coordinates
    const key = `${lat.toFixed(5)}|${lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const name = deriveSchoolName(lat, lng, record.name);
    const level = safeString(record.school_level_type ?? record.level);
    const sector = safeString(record.school_sector_type ?? record.sector);
    const rating = parseFloat(record.naplan ?? record.rating);

    schools.push({
      lat,
      lng,
      name,
      level,
      sector,
      rating,
      raw: record,
    });
  }

  // Sort by name, then by level
  schools.sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;
    const levelA = a.level || "";
    const levelB = b.level || "";
    return levelA.localeCompare(levelB);
  });

  return schools;
}

export async function fetchSchoolsFromAPI(suburb: string): Promise<School[]> {
  const response = await fetch(
    `https://www.microburbs.com.au/report_generator/api/suburb/schools?suburb=${encodeURIComponent(suburb)}`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer test",
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch schools: ${response.status}`);
  }

  const data = await response.json();
  return normalizeSchools(data);
}

// Fetch schools with coordinates joined from amenities (for client-side use)
export async function fetchSchoolsWithCoordinates(suburb: string): Promise<School[]> {
  // For client-side, use the internal API
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams({ suburb });
    const response = await fetch(`/api/schools?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `Failed to fetch schools: ${response.status}`);
    }

    const data = await response.json();
    const results = data?.results ?? [];

    // Map to School type
    return results.map((item: any) => ({
      lat: item.lat,
      lng: item.lng,
      name: item.name || "Unnamed School",
      level: item.school_level_type || null,
      sector: item.school_sector_type || null,
      rating: null,
      naplan_rank: item.naplan_rank || null,
      attendance_rate: item.attendance_rate || null,
      school_level_type: item.school_level_type || null,
      school_sector_type: item.school_sector_type || null,
      raw: item,
    }));
  }

  // For server-side, fetch directly from upstream and join manually
  const headers = {
    Authorization: "Bearer test",
    "Content-Type": "application/json",
  };

  const [schoolsRes, amenityRes] = await Promise.all([
    fetch(
      `https://www.microburbs.com.au/report_generator/api/suburb/schools?suburb=${encodeURIComponent(suburb)}`,
      { headers, cache: "no-store" }
    ),
    fetch(
      `https://www.microburbs.com.au/report_generator/api/suburb/amenity?suburb=${encodeURIComponent(suburb)}`,
      { headers, cache: "no-store" }
    ),
  ]);

  if (!schoolsRes.ok) {
    throw new Error(`Failed to fetch schools: ${schoolsRes.status}`);
  }
  if (!amenityRes.ok) {
    throw new Error(`Failed to fetch amenities: ${amenityRes.status}`);
  }

  const schoolsData = await schoolsRes.json();
  const amenityData = await amenityRes.json();

  const schoolAmenities = (amenityData?.results ?? []).filter(
    (a: Record<string, unknown>) =>
      (a?.category ?? "").toString().toLowerCase() === "school"
  );

  const norm = (s: string) => (s || "").toLowerCase().trim();

  const results = (schoolsData?.results ?? []).map((s: Record<string, unknown>) => {
    const name = s?.name?.toString() ?? "";
    const match = schoolAmenities.find((a: Record<string, unknown>) => {
      const an = a?.name?.toString() ?? "";
      return (
        norm(an) === norm(name) ||
        norm(an).includes(norm(name)) ||
        norm(name).includes(norm(an))
      );
    });

    return {
      id: s?.id ?? null,
      name,
      area_level: s?.area_level ?? "suburb",
      area_name: s?.area_name ?? suburb,
      school_level_type: s?.school_level_type ?? null,
      school_sector_type: s?.school_sector_type ?? null,
      naplan_rank: s?.naplan_rank ?? null,
      attendance_rate: s?.attendance_rate ?? null,
      boys: s?.boys ?? null,
      girls: s?.girls ?? null,
      socioeconomic_rank: s?.socioeconomic_rank ?? null,
      lat: Number(match?.lat ?? NaN),
      lng: Number(match?.lon ?? match?.lng ?? NaN),
      hasCoords:
        Number.isFinite(Number(match?.lat)) &&
        Number.isFinite(Number(match?.lon ?? match?.lng)),
    };
  });

  // Only return those we can place on the map
  const withCoords = results.filter((r: Record<string, unknown>) => r.hasCoords);

  // Map to School type
  return withCoords.map((item: any) => ({
    lat: item.lat,
    lng: item.lng,
    name: item.name || "Unnamed School",
    level: item.school_level_type || null,
    sector: item.school_sector_type || null,
    rating: null,
    naplan_rank: item.naplan_rank || null,
    attendance_rate: item.attendance_rate || null,
    school_level_type: item.school_level_type || null,
    school_sector_type: item.school_sector_type || null,
    raw: item,
  }));
}
