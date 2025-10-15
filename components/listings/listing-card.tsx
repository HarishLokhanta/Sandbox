import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import { Bed, Bath, Car, MapPin } from "lucide-react";
import Image from "next/image";

interface ListingCardProps {
  property: Property;
  onClick: () => void;
}

export function ListingCard({ property, onClick }: ListingCardProps) {
  const displayPrice = property.price
    ? formatCurrency(property.price)
    : property.priceText || "Contact Agent";

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl"
      onClick={onClick}
    >
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {property.thumbnail ? (
          <Image
            src={property.thumbnail}
            alt={property.address || "Property"}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <MapPin className="h-12 w-12" />
          </div>
        )}
        {property.propertyType && (
          <Badge className="absolute right-2 top-2">
            {property.propertyType}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-semibold text-lg">{displayPrice}</h3>
          {property.daysOnMarket !== null &&
            property.daysOnMarket !== undefined && (
              <Badge variant="outline" className="text-xs">
                {property.daysOnMarket}d
              </Badge>
            )}
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {property.address}
        </p>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {property.bedrooms !== null && property.bedrooms !== undefined && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms !== null && property.bathrooms !== undefined && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.parking !== null && property.parking !== undefined && (
            <div className="flex items-center gap-1">
              <Car className="h-4 w-4" />
              <span>{property.parking}</span>
            </div>
          )}
        </div>

        {property.agent && (
          <p className="mt-2 text-xs text-muted-foreground">{property.agent}</p>
        )}
      </CardContent>
    </Card>
  );
}
