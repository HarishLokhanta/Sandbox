"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { MapPin, GraduationCap } from "lucide-react";
import type { School } from "@/lib/schools";
import type { MarkerItem } from "@/components/Map";

type SchoolsPanelProps = {
  schools: School[];
  isLoading?: boolean;
  error?: string | null;
  onViewOnMap?: (marker: MarkerItem) => void;
};

export function SchoolsPanel({
  schools,
  isLoading,
  error,
  onViewOnMap,
}: SchoolsPanelProps) {
  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold text-slate-900">
            <GraduationCap className="mr-2 inline h-5 w-5" />
            Schools Nearby
          </CardTitle>
          <p className="text-sm text-slate-500">Loading schools...</p>
        </CardHeader>
        <Separator className="mx-6" />
        <CardContent className="pt-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-slate-900">
          <GraduationCap className="mr-2 inline h-5 w-5" />
          Schools Nearby
        </CardTitle>
        <p className="text-sm text-slate-500">
          Educational institutions in and around this area.
        </p>
      </CardHeader>
      <Separator className="mx-6" />
      <CardContent className="pt-4">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {schools.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
            <GraduationCap className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">No schools found for this area.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[28rem] pr-2">
            <div className="space-y-3">
              {schools.map((school, index) => (
                <div
                  key={`${school.lat}-${school.lng}-${index}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-yellow-300 hover:shadow-md"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{school.name}</h4>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      {school.sector && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                          {school.sector}
                        </Badge>
                      )}
                      {school.level && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">
                          {school.level}
                        </Badge>
                      )}
                      {school.rating !== null && school.rating !== undefined && (
                        <span className="text-slate-500">
                          Rating: {(school.rating * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 border-yellow-600 text-yellow-700 hover:bg-yellow-600 hover:text-white"
                    onClick={() =>
                      onViewOnMap?.({
                        lat: school.lat,
                        lng: school.lng,
                        label: school.name,
                        type: "school",
                      })
                    }
                  >
                    <MapPin className="mr-1 h-4 w-4" />
                    View on map
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="raw-json">
            <AccordionTrigger>Raw JSON</AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-64 overflow-x-auto rounded-lg bg-slate-900/95 px-4 py-3 text-xs text-slate-100">
                {JSON.stringify(schools, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
