"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAmenities } from "@/lib/api";
import { TableSkeleton } from "../shared/loading-skeleton";
import { ErrorState } from "../shared/error-state";
import { formatDistance } from "@/lib/utils";
import { Search, School, ShoppingBag, Train, Coffee, TreePine, Building } from "lucide-react";

interface AmenityListProps {
  suburb: string;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  school: <School className="h-4 w-4" />,
  education: <School className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  transport: <Train className="h-4 w-4" />,
  cafe: <Coffee className="h-4 w-4" />,
  restaurant: <Coffee className="h-4 w-4" />,
  park: <TreePine className="h-4 w-4" />,
  recreation: <TreePine className="h-4 w-4" />,
  default: <Building className="h-4 w-4" />,
};

export function AmenityList({ suburb }: AmenityListProps) {
  const { data, isLoading, isError, isSuccess, refetch } = useAmenities(suburb);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const filteredAmenities = React.useMemo(() => {
    const source = data?.results ?? [];
    return source.filter((a) => {
      const name = (a.name ?? "").toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || a.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [data?.results, searchTerm, selectedCategory]);

  const categoryCounts = React.useMemo(() => {
    const source = data?.results ?? [];
    return source.reduce((acc, a) => {
      const key = a.category ?? "Other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [data?.results]);

  if (isLoading) return <TableSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const categories = data?.categories ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Local Amenities</CardTitle>
      </CardHeader>
      <CardContent>
        {isSuccess && (
          <span data-test="section-keys" style={{ display: "none" }}>
            {Object.keys(data || {}).join(",")}
          </span>
        )}
        <div className="space-y-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search amenities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All ({(data?.results ?? []).length})
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({categoryCounts[category] || 0})
              </Badge>
            ))}
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredAmenities.length > 0 ? (
              filteredAmenities.map((a, i) => {
                const icon = AMENITY_ICONS[(a.category ?? "").toLowerCase()] || AMENITY_ICONS.default;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-primary">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{a.name}</p>
                        {a.address && (
                          <p className="text-xs text-muted-foreground truncate">{a.address}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.distance != null && (
                        <Badge variant="secondary" className="text-xs">
                          {formatDistance(a.distance)}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {a.type}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No amenities found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}