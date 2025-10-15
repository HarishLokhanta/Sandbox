"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSimilarSuburbs } from "@/lib/api";
import { TableSkeleton } from "../shared/loading-skeleton";
import { ErrorState } from "../shared/error-state";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

interface SimilarTableProps {
  suburb: string;
  onSelectSuburb: (suburb: string) => void;
  onAddToCompare: (suburb: string) => void;
}

export function SimilarTable({
  suburb,
  onSelectSuburb,
  onAddToCompare,
}: SimilarTableProps) {
  const { data, isLoading, isError, isSuccess, refetch } = useSimilarSuburbs(
    suburb
  );

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const similar = data?.results ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Similar Suburbs</CardTitle>
      </CardHeader>
      <CardContent>
        {isSuccess && (
          <span data-test="section-keys" style={{ display: "none" }}>
            {Object.keys(data || {}).join(",")}
          </span>
        )}
        {similar.length > 0 ? (
          <div className="space-y-3">
            {similar.map((sub, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{sub.name}</h4>
                    {sub.state && (
                      <Badge variant="outline" className="text-xs">
                        {sub.state}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {sub.medianPrice !== null &&
                      sub.medianPrice !== undefined && (
                        <div>
                          <span className="font-medium">
                            {formatCurrency(sub.medianPrice)}
                          </span>
                        </div>
                      )}
                    {sub.priceChange !== null &&
                      sub.priceChange !== undefined && (
                        <div className="flex items-center gap-1">
                          {sub.priceChange >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span
                            className={
                              sub.priceChange >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {formatPercent(sub.priceChange)}
                          </span>
                        </div>
                      )}
                    {sub.daysOnMarket !== null &&
                      sub.daysOnMarket !== undefined && (
                        <div>DOM: {sub.daysOnMarket}</div>
                      )}
                    {sub.salesVolume !== null &&
                      sub.salesVolume !== undefined && (
                        <div>Sales: {formatNumber(sub.salesVolume)}</div>
                      )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddToCompare(sub.name)}
                  >
                    Compare
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSelectSuburb(sub.name)}
                  >
                    View
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No similar suburbs found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
