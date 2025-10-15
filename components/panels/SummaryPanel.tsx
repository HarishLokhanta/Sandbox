"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type SummaryPanelProps = {
  summary?: unknown;
  error?: string;
};

type SummaryMetric = {
  key: string;
  label: string;
  value: string;
  score?: number;
  comment?: string;
  detail?: string;
  adjectives?: string[];
};

// Helper to extract "X/100" or "X/10" scores
function scoreFromValueString(value: string): number | undefined {
  const match = value.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return undefined;
  const [_, num, den] = match;
  const n = Number(num);
  const d = Number(den);
  if (!isFinite(n) || !isFinite(d) || d <= 0) return undefined;
  return Math.round((n / d) * 100);
}

function titleCase(input: string): string {
  return input
    .replace(/_/g, " ")
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "number") return isFinite(value) ? value.toString() : "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value.trim() || "N/A";
  return JSON.stringify(value);
}

// Parses summary into card-friendly metrics
function parseSummary(summary: unknown): SummaryMetric[] {
  if (!summary || typeof summary !== "object") return [];

  const metrics: SummaryMetric[] = [];

  if (Array.isArray(summary)) {
    for (const item of summary) {
      if (!item || typeof item !== "object") continue;
      const obj = item as Record<string, unknown>;
      const label = titleCase(String(obj.name ?? obj.label ?? "Metric"));
      const rawValue = obj.value ?? obj.score ?? "";
      const valueText = stringifyValue(rawValue);

      const score =
        typeof obj.score === "number"
          ? Math.round(obj.score)
          : scoreFromValueString(valueText);

      const detail = Array.isArray(obj.summary) && typeof obj.summary[0] === "string"
        ? obj.summary[0]
        : undefined;

      const adjectives =
        Array.isArray(obj.adjectives)
          ? (obj.adjectives.filter((a) => typeof a === "string") as string[])
          : [];

      metrics.push({
        key: label.toLowerCase().replace(/\s+/g, "-"),
        label,
        value: valueText,
        score,
        detail,
        adjectives,
        comment: typeof obj.comment === "string" ? obj.comment : undefined,
      });
    }
    return metrics;
  }

  for (const [key, value] of Object.entries(summary as Record<string, unknown>)) {
    metrics.push({
      key,
      label: titleCase(key),
      value: stringifyValue(value),
    });
  }

  return metrics.sort((a, b) => a.label.localeCompare(b.label));
}

function scoreColor(score?: number): string {
  if (typeof score !== "number" || !isFinite(score)) return "bg-gray-100 text-gray-700";
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-blue-100 text-blue-800";
  if (score >= 40) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export function SummaryPanel({ summary, error }: SummaryPanelProps) {
  const metrics = parseSummary(summary);

  return (
    <Card className="bg-white border border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-xl font-semibold text-slate-900">Summary</CardTitle>
        <p className="text-sm text-slate-500">
          Overview of key suburb indicators.
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {metrics.length === 0 ? (
          <p className="text-sm text-slate-500">No summary data available.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((m) => (
              <div
                key={m.key}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-700">{m.label}</h3>
                  <Badge className={scoreColor(m.score)}>
                    {m.score ? `${m.score}/100` : "No score"}
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-slate-900">{m.value}</p>

                {m.adjectives && m.adjectives.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.adjectives.slice(0, 5).map((adj, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {adj}
                      </Badge>
                    ))}
                  </div>
                )}

                {m.detail && (
                  <p className="mt-2 text-xs text-slate-600 leading-snug">{m.detail}</p>
                )}

                {m.comment && (
                  <p className="mt-1 text-xs text-slate-500 leading-snug">{m.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}