/**
 * Direct client for Microburbs Sandbox API
 * Hits the origin API directly with required headers
 */

type HeadersInitish = Record<string, string>;

const BASE = "https://www.microburbs.com.au/report_generator/api";
const HDRS: HeadersInitish = {
  Authorization: "Bearer test",
  "Content-Type": "application/json",
};

async function getJSON<T>(pathWithQuery: string): Promise<T> {
  const res = await fetch(`${BASE}${pathWithQuery}`, {
    method: "GET",
    headers: HDRS,
    cache: "no-store",
  });
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    /* leave as text */
  }
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : text || `HTTP ${res.status}`
    );
  }
  return data as T;
}

export async function getProperties(suburbPlus: string, propertyType?: string) {
  const q = new URLSearchParams({ suburb: suburbPlus });
  if (propertyType) q.set("property_type", propertyType);
  return getJSON<any>(`/suburb/properties?${q.toString()}`);
}

export async function getAmenities(suburbPlus: string) {
  const q = new URLSearchParams({ suburb: suburbPlus });
  return getJSON<any>(`/suburb/amenity?${q.toString()}`);
}

export async function getMarket(suburbPlus: string, propertyType?: string) {
  const q = new URLSearchParams({ suburb: suburbPlus });
  if (propertyType) q.set("property_type", propertyType);
  return getJSON<any>(`/suburb/market?${q.toString()}`);
}

export async function getSimilar(suburbPlus: string) {
  const q = new URLSearchParams({ suburb: suburbPlus });
  return getJSON<any>(`/suburb/similar?${q.toString()}`);
}

export async function getInfo(suburbPlus: string) {
  const q = new URLSearchParams({ suburb: suburbPlus });
  return getJSON<any>(`/suburb/info?${q.toString()}`);
}

export async function getRisk(suburbPlus: string) {
  const q = new URLSearchParams({ suburb: suburbPlus });
  return getJSON<any>(`/suburb/risk?${q.toString()}`);
}
