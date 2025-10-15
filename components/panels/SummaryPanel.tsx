"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
};

function titleCase(input: string): string {
  return input
    .replace(/_/g, " ")
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  if (typeof value === "number") {
    if (!isFinite(value)) {
      return "N/A";
    }
    if (Math.abs(value) >= 1000) {
      return value.toLocaleString("en-AU");
    }
    return value.toString();
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "string") {
    return value.trim().length > 0 ? value : "N/A";
  }
  return JSON.stringify(value);
}

function parseSummary(summary: unknown): SummaryMetric[] {
  if (!summary || typeof summary !== "object") {
    return [];
  }

  const records: SummaryMetric[] = [];

  if (Array.isArray(summary)) {
    for (const item of summary) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const name =
        (item as Record<string, unknown>).name ||
        (item as Record<string, unknown>).label ||
        "Metric";
      const label = titleCase(String(name));
      const score = (item as Record<string, unknown>).score;
      const valueProp = (item as Record<string, unknown>).value;
      const comment =
        (item as Record<string, unknown>).comment ||
        (item as Record<string, unknown>).description;

      records.push({
        key: label.toLowerCase().replace(/\s+/g, "-"),
        label,
        value: stringifyValue(valueProp ?? score ?? item),
        score: typeof score === "number" ? score : undefined,
        comment: typeof comment === "string" ? comment : undefined,
      });
    }
    return records;
  }

  const entries = Object.entries(summary as Record<string, unknown>);

  for (const [key, value] of entries) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const innerValue = (value as Record<string, unknown>).value ?? (value as Record<string, unknown>).score ?? value;
      const score = (value as Record<string, unknown>).score;
      const comment = (value as Record<string, unknown>).comment || (value as Record<string, unknown>).description;

      records.push({
        key,
        label: titleCase(key),
        value: stringifyValue(innerValue),
        score: typeof score === "number" ? score : undefined,
        comment: typeof comment === "string" ? comment : undefined,
      });
      continue;
    }

    records.push({
      key,
      label: titleCase(key),
      value: stringifyValue(value),
    });
  }

  return records.sort((a, b) => a.label.localeCompare(b.label));
}

function scoreBadge(score?: number): string {
  if (typeof score !== "number" || !isFinite(score)) {
    return "bg-slate-100 text-slate-600";
  }

  if (score >= 80) {
    return "bg-green-100 text-green-700";
  }
  if (score >= 60) {
    return "bg-blue-100 text-blue-700";
  }
  if (score >= 40) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-red-100 text-red-700";
}

export function SummaryPanel({ summary, error }: SummaryPanelProps) {
  const metrics = parseSummary(summary);

  return (
    <Card className="bg-white">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-slate-900">Summary</CardTitle>
        <p className="text-sm text-slate-500">Key sandbox indicators at a glance.</p>
      </CardHeader>
      <Separator className="mx-6" />
      <CardContent className="pt-4">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {metrics.length === 0 ? (
          <p className="text-sm text-slate-500">No summary metrics provided by the sandbox feed.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.key}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                  <Badge variant="outline" className={scoreBadge(metric.score)}>
                    {typeof metric.score === "number" && isFinite(metric.score)
                      ? `${Math.round(metric.score)} score`
                      : "No score"}
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-slate-900">{metric.value}</p>
                {metric.comment && <p className="text-xs text-slate-500">{metric.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="raw-json">
            <AccordionTrigger>Raw JSON</AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-64 overflow-x-auto rounded-lg bg-slate-900/95 px-4 py-3 text-xs text-slate-100">
                {JSON.stringify(summary ?? {}, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
