export type School = {
  lat: number;
  lng: number;
  name: string;
  level?: string | null;
  sector?: string | null;
  rating?: number | null;
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
