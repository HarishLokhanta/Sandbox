"use client";

import { useEffect, useState } from "react";

type FetchState = "idle" | "loading" | "success" | "error";

export default function DebugPage() {
  const [suburbInput, setSuburbInput] = useState("Belmont North");
  const [activeSuburb, setActiveSuburb] = useState("Belmont North");
  const [status, setStatus] = useState<FetchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  const requestUrl = `/api/properties?suburb=${encodeURIComponent(activeSuburb)}`;

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setStatus("loading");
      setError(null);
      setData(null);

      try {
        const response = await fetch(requestUrl, { signal: controller.signal });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Request failed with status ${response.status}`);
        }
        const json = await response.json();
        setData(json);
        setStatus("success");
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setError((err as Error).message || "Request failed");
        setStatus("error");
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [requestUrl]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = suburbInput.trim();
    if (next.length === 0) {
      return;
    }
    setActiveSuburb(next);
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Proxy Debug Viewer</h1>
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <label className="flex-1">
            <span className="sr-only">Suburb</span>
            <input
              value={suburbInput}
              onChange={(event) => setSuburbInput(event.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="Suburb"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Fetch
          </button>
        </form>
        <p className="text-sm text-gray-600">
          Request URL:
          <span className="ml-2 font-mono">{requestUrl}</span>
        </p>
      </section>

      <section>
        {status === "loading" && (
          <p className="text-sm text-gray-600">Loading…</p>
        )}
        {status === "error" && error && (
          <pre className="overflow-x-auto rounded bg-red-100 p-3 text-sm text-red-800">
            {error}
          </pre>
        )}
        {status === "success" && (
          <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}
