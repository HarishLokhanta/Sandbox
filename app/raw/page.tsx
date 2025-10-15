import { headers } from "next/headers";

const BASE_URL = "https://www.microburbs.com.au/report_generator/api";
const REQUEST_HEADERS = {
  Authorization: "Bearer test",
  "Content-Type": "application/json",
} as const;

type FetchResult = {
  meta: {
    url: string;
    status: number;
  };
  data?: unknown;
  error?: string;
};

function normalizeSuburb(raw?: string | string[]): string {
  if (!raw) {
    return "Belmont North";
  }

  const value = Array.isArray(raw) ? raw[0] : raw;
  try {
    const decoded = decodeURIComponent(value);
    const spaced = decoded.replace(/\+/g, " ").trim();
    return spaced.length > 0 ? spaced : "Belmont North";
  } catch {
    const spaced = value.replace(/\+/g, " ").trim();
    return spaced.length > 0 ? spaced : "Belmont North";
  }
}

function sanitizeJsonText(loose: string): string {
  let sanitized = loose;

  // Replace invalid tokens outside of strings with null
  sanitized = sanitized.replace(
    /(^|[^\w"])(NaN|Infinity|-Infinity|undefined)(?=$|[\s,\]}])/g,
    (_match, prefix: string) => `${prefix}null`
  );

  // Remove trailing commas before closing brackets/braces
  sanitized = sanitized.replace(/,\s*(?=[}\]])/g, "");

  return sanitized;
}

async function fetchSafe(path: string, suburb: string, propertyType?: string): Promise<FetchResult> {
  const params = new URLSearchParams();
  params.set("suburb", suburb);
  if (propertyType) {
    params.set("property_type", propertyType);
  }

  const query = params.toString();
  const url = `${BASE_URL}${path}${query ? `${path.includes("?") ? "&" : "?"}${query}` : ""}`;

  const res = await fetch(url, {
    headers: REQUEST_HEADERS,
    cache: "no-store",
  });
  const raw = await res.text();

  const meta = {
    url,
    status: res.status,
  };

  if (!res.ok) {
    return {
      meta,
      error: raw || "Upstream error",
    };
  }

  const sanitized = sanitizeJsonText(raw);

  try {
    const data = sanitized ? JSON.parse(sanitized) : null;
    return {
      meta,
      data,
    };
  } catch (error) {
    return {
      meta,
      error: `Parse error: ${(error as Error).message}`,
    };
  }
}

const ENDPOINTS: Array<{
  key: string;
  label: string;
  path: string;
  propertyType?: string;
}> = [
  { key: "info", label: "Info", path: "/suburb/info" },
  { key: "market", label: "Market", path: "/suburb/market", propertyType: "all" },
  { key: "properties", label: "Properties", path: "/suburb/properties" },
  { key: "amenity", label: "Amenity", path: "/suburb/amenity" },
  { key: "similar", label: "Similar", path: "/suburb/similar" },
  { key: "risk", label: "Risk", path: "/suburb/risk" },
  { key: "summary", label: "Summary", path: "/suburb/summary" },
];

export default async function RawPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  headers(); // Ensure this runs on the server
  const suburb = normalizeSuburb(searchParams?.suburb);

  const results = await Promise.all(
    ENDPOINTS.map(async (endpoint) => ({
      ...endpoint,
      result: await fetchSafe(endpoint.path, suburb, endpoint.propertyType),
    }))
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Raw API Viewer</h1>
        <form className="flex gap-2" method="get">
          <label className="flex-1">
            <span className="sr-only">Suburb</span>
            <input
              className="w-full rounded border px-3 py-2"
              name="suburb"
              type="text"
              defaultValue={suburb}
              placeholder="Suburb"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Load
          </button>
        </form>
      </div>

      <div className="space-y-10">
        {results.map(({ label, result, key }) => (
          <section key={key} className="space-y-2">
            <div>
              <h2 className="text-xl font-medium">{label}</h2>
              <p className="text-sm text-gray-600">
                <span className="font-mono text-xs">{result.meta.url}</span> — status {result.meta.status}
              </p>
            </div>
            {result.error ? (
              <pre className="overflow-x-auto rounded bg-red-100 p-3 text-sm text-red-800">
                {result.error}
              </pre>
            ) : (
              <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-sm">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
