import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  PropertiesResponseSchema,
  AmenitiesResponseSchema,
  MarketResponseSchema,
  SimilarSuburbsResponseSchema,
  RiskResponseSchema,
  PropertyType,
} from "./schemas";
import type {
  Property,
  Amenity,
  MarketData,
  SimilarSuburb,
  RiskData,
} from "./schemas";
import { fetchAmenitiesFromAPI } from "./amenities";
import { fetchSchoolsFromAPI } from "./schools";
import type { Amenity as NormalizedAmenity } from "./amenities";
import type { School } from "./schools";

const CLIENT_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const { signal: userSignal, ...rest } = init ?? {};
  let timedOut = false;

  if (userSignal) {
    if (userSignal.aborted) {
      controller.abort();
    } else {
      userSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, CLIENT_TIMEOUT_MS);

  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      if (timedOut) {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const queryKeys = {
  properties: (suburb: string, propertyType: PropertyType) => [
    "properties",
    suburb,
    propertyType,
  ],
  amenities: (suburb: string) => ["amenities", suburb],
  schools: (suburb: string) => ["schools", suburb],
  market: (suburb: string, propertyType: PropertyType) => [
    "market",
    suburb,
    propertyType,
  ],
  similar: (suburb: string) => ["similar", suburb],
  risk: (suburb: string) => ["risk", suburb],
};

const DEFAULT_JSON_LENGTH = 0;

function getJsonLength(value: unknown) {
  try {
    const serialized = JSON.stringify(value);
    return serialized ? serialized.length : DEFAULT_JSON_LENGTH;
  } catch {
    return DEFAULT_JSON_LENGTH;
  }
}

function isErrorPayload(payload: unknown): payload is { error: string } {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
  );
}

async function parseResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

type PropertiesQueryResult = {
  results: Property[];
  total: number;
  suburb?: string;
};

type AmenitiesQueryResult = {
  results: Amenity[];
  categories: string[];
  suburb?: string;
};

type SimilarQueryResult = {
  results: SimilarSuburb[];
  suburb?: string;
};

async function fetchProperties(
  suburb: string,
  propertyType: PropertyType = "all",
  signal?: AbortSignal
) {
  const params = new URLSearchParams({ suburb, property_type: propertyType });
  const response = await fetchWithTimeout(`/api/properties?${params}`, { signal });
  const body = await parseResponse(response);

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && (body as any).message) ||
      (body && typeof body === "object" && (body as any).error) ||
      `Failed to fetch properties (status ${response.status})`;
    throw new Error(String(message));
  }

  if (isErrorPayload(body)) {
    throw new Error(body.error);
  }

  const parsed = PropertiesResponseSchema.safeParse(body);
  const fallbackParsed = PropertiesResponseSchema.safeParse(
    body && typeof body === "object"
      ? {
          properties: Array.isArray((body as any).properties)
            ? (body as any).properties
            : Array.isArray((body as any).results)
            ? (body as any).results
            : [],
          total:
            typeof (body as any).total === "number" ? (body as any).total : undefined,
          suburb:
            typeof (body as any).suburb === "string" ? (body as any).suburb : undefined,
        }
      : undefined
  );
  const parsedData = parsed.success
    ? parsed.data
    : fallbackParsed.success
    ? fallbackParsed.data
    : undefined;
  const properties = parsedData?.properties ?? [];
  const result: PropertiesQueryResult = {
    results: properties,
    total:
      typeof parsedData?.total === "number"
        ? parsedData.total
        : typeof (body as any)?.total === "number"
        ? (body as any).total
        : properties.length,
    suburb: parsedData?.suburb ?? suburb,
  };

  console.info("[properties] ok", {
    suburb,
    type: propertyType,
    keys: Object.keys(result || {}),
    len: getJsonLength(result),
  });

  return result;
}

async function fetchAmenities(suburb: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ suburb });
  const response = await fetchWithTimeout(`/api/amenities?${params}`, { signal });
  const body = await parseResponse(response);

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && (body as any).message) ||
      (body && typeof body === "object" && (body as any).error) ||
      `Failed to fetch amenities (status ${response.status})`;
    throw new Error(String(message));
  }

  if (isErrorPayload(body)) {
    throw new Error(body.error);
  }

  const parsed = AmenitiesResponseSchema.safeParse(body);
  const fallbackParsed = AmenitiesResponseSchema.safeParse(
    body && typeof body === "object"
      ? {
          amenities: Array.isArray((body as any).amenities)
            ? (body as any).amenities
            : Array.isArray((body as any).results)
            ? (body as any).results
            : [],
          categories: Array.isArray((body as any).categories)
            ? (body as any).categories
            : [],
          suburb:
            typeof (body as any).suburb === "string" ? (body as any).suburb : undefined,
        }
      : undefined
  );
  const parsedData = parsed.success
    ? parsed.data
    : fallbackParsed.success
    ? fallbackParsed.data
    : undefined;
  const amenities = parsedData?.amenities ?? [];
  const categories = parsedData?.categories ?? [];
  const result: AmenitiesQueryResult = {
    results: amenities,
    categories,
    suburb: parsedData?.suburb ?? suburb,
  };

  console.info("[amenities] ok", {
    suburb,
    type: undefined,
    keys: Object.keys(result || {}),
    len: getJsonLength(result),
  });

  return result;
}

async function fetchMarket(
  suburb: string,
  propertyType: PropertyType = "all",
  signal?: AbortSignal
) {
  const params = new URLSearchParams({ suburb, property_type: propertyType });
  const response = await fetchWithTimeout(`/api/market?${params}`, { signal });
  const body = await parseResponse(response);

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && (body as any).message) ||
      (body && typeof body === "object" && (body as any).error) ||
      `Failed to fetch market data (status ${response.status})`;
    throw new Error(String(message));
  }

  if (isErrorPayload(body)) {
    throw new Error(body.error);
  }

  const parsed = MarketResponseSchema.safeParse(body);
  const marketData: MarketData = parsed.success ? parsed.data : ({} as MarketData);

  console.info("[market] ok", {
    suburb,
    type: propertyType,
    keys: Object.keys(marketData || {}),
    len: getJsonLength(marketData),
  });

  return marketData;
}

async function fetchSimilarSuburbs(suburb: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ suburb });
  const response = await fetchWithTimeout(`/api/similar?${params}`, { signal });
  const body = await parseResponse(response);

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && (body as any).message) ||
      (body && typeof body === "object" && (body as any).error) ||
      `Failed to fetch similar suburbs (status ${response.status})`;
    throw new Error(String(message));
  }

  if (isErrorPayload(body)) {
    throw new Error(body.error);
  }

  const parsed = SimilarSuburbsResponseSchema.safeParse(body);
  const fallbackParsed = SimilarSuburbsResponseSchema.safeParse(
    body && typeof body === "object"
      ? {
          similar: Array.isArray((body as any).similar)
            ? (body as any).similar
            : Array.isArray((body as any).results)
            ? (body as any).results)
            : [],
          suburb:
            typeof (body as any).suburb === "string" ? (body as any).suburb : undefined,
        }
      : undefined
  );
  const parsedData = parsed.success
    ? parsed.data
    : fallbackParsed.success
    ? fallbackParsed.data
    : undefined;
  const similar = parsedData?.similar ?? [];
  const result: SimilarQueryResult = {
    results: similar,
    suburb: parsedData?.suburb ?? suburb,
  };

  console.info("[similar] ok", {
    suburb,
    type: undefined,
    keys: Object.keys(result || {}),
    len: getJsonLength(result),
  });

  return result;
}

async function fetchRisk(suburb: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ suburb });
  const response = await fetchWithTimeout(`/api/risk?${params}`, { signal });
  const body = await parseResponse(response);

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && (body as any).message) ||
      (body && typeof body === "object" && (body as any).error) ||
      `Failed to fetch risk data (status ${response.status})`;
    throw new Error(String(message));
  }

  if (isErrorPayload(body)) {
    throw new Error(body.error);
  }

  const parsed = RiskResponseSchema.safeParse(body);
  const riskData: RiskData = parsed.success ? parsed.data : ({} as RiskData);

  console.info("[risk] ok", {
    suburb,
    type: undefined,
    keys: Object.keys(riskData || {}),
    len: getJsonLength(riskData),
  });

  return riskData;
}

export function useProperties(
  suburb: string,
  propertyType: PropertyType = "all",
  options?: Omit<
    UseQueryOptions<PropertiesQueryResult, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.properties(suburb, propertyType),
    queryFn: ({ signal }) => fetchProperties(suburb, propertyType, signal),
    enabled: !!suburb,
    ...options,
  });
}

export function useAmenities(
  suburb: string,
  options?: Omit<
    UseQueryOptions<AmenitiesQueryResult, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.amenities(suburb),
    queryFn: ({ signal }) => fetchAmenities(suburb, signal),
    enabled: !!suburb,
    ...options,
  });
}

export function useMarket(
  suburb: string,
  propertyType: PropertyType = "all",
  options?: Omit<UseQueryOptions<MarketData, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.market(suburb, propertyType),
    queryFn: ({ signal }) => fetchMarket(suburb, propertyType, signal),
    enabled: !!suburb,
    ...options,
  });
}

export function useSimilarSuburbs(
  suburb: string,
  options?: Omit<
    UseQueryOptions<SimilarQueryResult, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.similar(suburb),
    queryFn: ({ signal }) => fetchSimilarSuburbs(suburb, signal),
    enabled: !!suburb,
    ...options,
  });
}

export function useRisk(
  suburb: string,
  options?: Omit<UseQueryOptions<RiskData, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.risk(suburb),
    queryFn: ({ signal }) => fetchRisk(suburb, signal),
    enabled: !!suburb,
    ...options,
  });
}

export function useAmenitiesNormalized(
  suburb: string,
  options?: Omit<UseQueryOptions<NormalizedAmenity[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...queryKeys.amenities(suburb), "normalized"],
    queryFn: () => fetchAmenitiesFromAPI(suburb),
    enabled: !!suburb,
    ...options,
  });
}

export function useSchools(
  suburb: string,
  options?: Omit<UseQueryOptions<School[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.schools(suburb),
    queryFn: () => fetchSchoolsFromAPI(suburb),
    enabled: !!suburb,
    ...options,
  });
}
