"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListingCard } from "./listing-card";
import { PropertyDialog } from "./property-dialog";
import { ListingCardSkeleton } from "../shared/loading-skeleton";
import { ErrorState } from "../shared/error-state";
import { useProperties } from "@/lib/api";
import { PropertyType, Property } from "@/lib/schemas";
import { ArrowUpDown } from "lucide-react";

interface ListingsGridProps {
  suburb: string;
  propertyType: PropertyType;
}

type SortOption = "newest" | "price-asc" | "price-desc";

export function ListingsGrid({ suburb, propertyType }: ListingsGridProps) {
  const { data, isLoading, isError, isSuccess, refetch } = useProperties(
    suburb,
    propertyType
  );
  const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(
    null
  );
  const [sortBy, setSortBy] = React.useState<SortOption>("newest");

  const sortedProperties = React.useMemo(() => {
    const base = data?.results ?? [];
    const sorted = [...base];

    switch (sortBy) {
      case "price-asc":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-desc":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "newest":
      default:
        return sorted.sort(
          (a, b) => (a.daysOnMarket || 999) - (b.daysOnMarket || 999)
        );
    }
  }, [data?.results, sortBy]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>For Sale Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ListingCardSkeleton />
            <ListingCardSkeleton />
            <ListingCardSkeleton />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>For Sale Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            title="Failed to load properties"
            onRetry={() => refetch()}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              For Sale Properties
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({data?.total || data?.results?.length || sortedProperties.length})
              </span>
            </CardTitle>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isSuccess && (
            <span data-test="section-keys" style={{ display: "none" }}>
              {Object.keys(data || {}).join(",")}
            </span>
          )}
          {sortedProperties.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProperties.map((property, index) => (
                <ListingCard
                  key={property.id || index}
                  property={property}
                  onClick={() => setSelectedProperty(property)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No properties found for this suburb and type.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Try changing the property type or searching a different suburb.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PropertyDialog
        property={selectedProperty}
        open={!!selectedProperty}
        onOpenChange={(open) => !open && setSelectedProperty(null)}
      />
    </>
  );
}
