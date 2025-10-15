const DEFAULT_TIMEOUT_MS = 8000;

const MICROBURBS_HEADERS = {
  Authorization: "Bearer test",
  "Content-Type": "application/json",
} as const;

export type MicroburbsResult<T = unknown> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; raw?: string };

export function normalizeSuburb(input: string): string {
  const trimmed = (input ?? "").trim();
  if (!trimmed) {
    return "";
  }

  const decoded = safeDecodeURIComponent(trimmed);
  return decoded.replace(/\+/g, " ").trim();
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function sanitizeJsonText(loose: string): string {
  if (!loose) {
    return loose;
  }

  const tokens: Array<{ match: (text: string, index: number) => number; replacement: string }> = [
    {
      match: (text, index) => matchKeyword(text, index, "-Infinity"),
      replacement: "null",
    },
    {
      match: (text, index) => matchKeyword(text, index, "Infinity"),
      replacement: "null",
    },
    {
      match: (text, index) => matchKeyword(text, index, "NaN"),
      replacement: "null",
    },
    {
      match: (text, index) => matchKeyword(text, index, "undefined"),
      replacement: "null",
    },
  ];

  let result = "";
  let i = 0;
  let inString = false;
  let escaping = false;

  while (i < loose.length) {
    const char = loose[i];

    if (inString) {
      result += char;
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === "\"") {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (char === "\"") {
      inString = true;
      result += char;
      i += 1;
      continue;
    }

    let replaced = false;
    for (const token of tokens) {
      const length = token.match(loose, i);
      if (length > 0) {
        result += token.replacement;
        i += length;
        replaced = true;
        break;
      }
    }

    if (replaced) {
      continue;
    }

    result += char;
    i += 1;
  }

  return removeTrailingCommas(result);
}

function matchKeyword(text: string, index: number, keyword: string): number {
  const lower = keyword.toLowerCase();
  const segment = text.slice(index, index + keyword.length).toLowerCase();
  if (segment !== lower) {
    return 0;
  }

  const before = index === 0 ? "" : text[index - 1];
  const after = index + keyword.length >= text.length ? "" : text[index + keyword.length];

  if (isIdentifierChar(before) || isIdentifierChar(after)) {
    return 0;
  }

  return keyword.length;
}

function isIdentifierChar(char: string): boolean {
  if (!char) {
    return false;
  }
  return /[A-Za-z0-9_$]/.test(char);
}

function removeTrailingCommas(text: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  let escaping = false;

  while (i < text.length) {
    const char = text[i];

    if (inString) {
      result += char;
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === "\"") {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (char === "\"") {
      inString = true;
      result += char;
      i += 1;
      continue;
    }

    if (char === ",") {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) {
        j += 1;
      }
      if (j < text.length && (text[j] === "}" || text[j] === "]")) {
        i += 1;
        continue;
      }
    }

    result += char;
    i += 1;
  }

  return result;
}

export async function fetchMicroburbsJson<T = unknown>(
  upstreamUrl: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<MicroburbsResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
      headers: MICROBURBS_HEADERS,
      signal: controller.signal,
    });

    const raw = await response.text();

    if (!response.ok) {
      const errorMessage = raw?.trim()
        ? raw.trim()
        : `Upstream error ${response.status}`;
      return {
        ok: false,
        status: response.status,
        error: errorMessage,
        raw,
      };
    }

    const sanitized = sanitizeJsonText(raw ?? "");
    const trimmed = sanitized.trim();

    if (!trimmed) {
      return {
        ok: true,
        status: response.status,
        data: null as T,
      };
    }

    try {
      const data = JSON.parse(trimmed) as T;
      return {
        ok: true,
        status: response.status,
        data,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to parse sanitized JSON";
      return {
        ok: false,
        status: response.status,
        error: message,
        raw: sanitized,
      };
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? `Request timed out after ${timeoutMs}ms`
          : error.message
        : "Unknown error";
    return {
      ok: false,
      status: 502,
      error: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export { DEFAULT_TIMEOUT_MS, MICROBURBS_HEADERS };
