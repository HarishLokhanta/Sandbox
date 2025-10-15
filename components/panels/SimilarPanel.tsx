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
import { TrendingUp, TrendingDown } from "lucide-react";

import { formatAUD } from "@/lib/format";

export type SimilarRecord = {
  area_name?: string | null;
  suburb?: string | null;
  name?: string | null;
  state?: string | null;
  summary?: string | null;
  short_summary?: string | null;
  similarity?: number | null;
  similarity_score?: number | null;
  median_price?: number | null;
  medianPrice?: number | null;
  price?: number | null;
  price_change?: number | null;
  priceChange?: number | null;
};

type SimilarPanelProps = {
  records?: SimilarRecord[];
  error?: string;
  raw?: unknown;
  onJumpToSuburb?: (name: string) => void | Promise<void>;
};

function getName(record: SimilarRecord): string {
  return record.name || record.area_name || record.suburb || "Unnamed suburb";
}

function getSummary(record: SimilarRecord): string | null {
  const summary = record.summary ?? record.short_summary;
  if (typeof summary !== "string") {
    return null;
  }

  const trimmed = summary.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getSimilarity(record: SimilarRecord): number | null {
  const value = record.similarity ?? record.similarity_score;
  if (typeof value !== "number" || !isFinite(value)) {
    return null;
  }

  const percentage = value > 1 ? value : value * 100;
  return Number.isFinite(percentage) ? percentage : null;
}

function getMedian(record: SimilarRecord): number | null {
  const value = record.medianPrice ?? record.median_price ?? record.price;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

function getChange(record: SimilarRecord): { icon: "up" | "down"; label: string } | null {
  const value = record.priceChange ?? record.price_change;
  if (typeof value !== "number" || !isFinite(value)) {
    return null;
  }

  const icon = value >= 0 ? "up" : "down";
  const label = `${value >= 0 ? "+" : ""}${value.toFixed(1)}% 12m`;
  return { icon, label };
}

export function SimilarPanel({ records = [], error, raw, onJumpToSuburb }: SimilarPanelProps) {
  return (
    <Card className="bg-white">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-slate-900">Similar Suburbs</CardTitle>
        <p className="text-sm text-slate-500">Neighbourhoods that mirror Belmont North&apos;s profile.</p>
      </CardHeader>
      <Separator className="mx-6" />
      <CardContent className="pt-4">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {records.length === 0 ? (
          <p className="text-sm text-slate-500">No similar suburbs returned by the sandbox feed.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {records.map((record, index) => {
              const name = getName(record);
              const change = getChange(record);
              const similarity = getSimilarity(record);
              const medianValue = getMedian(record);
              const summary = getSummary(record);
              const medianDisplay = typeof medianValue === "number" ? formatAUD(medianValue) : null;
              const hasChange = Boolean(change);

              const handleActivate = () => {
                void onJumpToSuburb?.(name);
              };

              return (
                <div
                  key={`${name}-${index}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Focus map on ${name}`}
                  onClick={handleActivate}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleActivate();
                    }
                  }}
                  className="flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white hover:border-slate-300 hover:bg-slate-100"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{name}</p>
                      {record.state && (
                        <p className="text-xs uppercase tracking-wide text-slate-500">{record.state}</p>
                      )}
                    </div>
                    {typeof similarity === "number" && (
                      <Badge variant="outline" className="bg-white text-slate-900">
                        {`${Math.round(similarity)}% match`}
                      </Badge>
                    )}
                  </div>

                  {(medianDisplay || hasChange) && (
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      {medianDisplay && (
                        <span className="font-medium text-blue-700">{medianDisplay}</span>
                      )}
                      {hasChange && change && (
                        <span
                          className={`flex items-center gap-1 text-xs font-medium ${
                            change.icon === "up" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {change.icon === "up" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {change.label}
                        </span>
                      )}
                    </div>
                  )}

                  {summary && <p className="text-sm text-slate-500">{summary}</p>}
                </div>
              );
            })}
          </div>
        )}

        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="raw-json">
            <AccordionTrigger>Raw JSON</AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-64 overflow-x-auto rounded-lg bg-slate-900/95 px-4 py-3 text-xs text-slate-100">
                {JSON.stringify(raw ?? records, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
