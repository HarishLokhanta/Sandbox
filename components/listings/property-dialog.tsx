"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/lib/schemas";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Bed, Bath, Car, Maximize } from "lucide-react";
import Image from "next/image";

interface PropertyDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyDialog({
  property,
  open,
  onOpenChange,
}: PropertyDialogProps) {
  if (!property) return null;

  const displayPrice = property.price
    ? formatCurrency(property.price)
    : property.priceText || "Contact Agent";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property.address}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {property.thumbnail && (
            <div className="relative h-64 w-full overflow-hidden rounded-lg">
              <Image
                src={property.thumbnail}
                alt={property.address || "Property"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{displayPrice}</h2>
            {property.propertyType && (
              <Badge variant="secondary">{property.propertyType}</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                  <p className="font-semibold">{property.bedrooms}</p>
                </div>
              </div>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                  <p className="font-semibold">{property.bathrooms}</p>
                </div>
              </div>
            )}
            {property.parking !== null && property.parking !== undefined && (
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Parking</p>
                  <p className="font-semibold">{property.parking}</p>
                </div>
              </div>
            )}
            {property.landSize !== null && property.landSize !== undefined && (
              <div className="flex items-center gap-2">
                <Maximize className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Land</p>
                  <p className="font-semibold">{formatNumber(property.landSize)}m²</p>
                </div>
              </div>
            )}
          </div>

          {property.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {property.agent && (
              <div>
                <p className="text-sm text-muted-foreground">Agent</p>
                <p className="font-medium">{property.agent}</p>
              </div>
            )}
            {property.agencyName && (
              <div>
                <p className="text-sm text-muted-foreground">Agency</p>
                <p className="font-medium">{property.agencyName}</p>
              </div>
            )}
            {property.listedDate && (
              <div>
                <p className="text-sm text-muted-foreground">Listed</p>
                <p className="font-medium">{property.listedDate}</p>
              </div>
            )}
            {property.daysOnMarket !== null &&
              property.daysOnMarket !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Days on Market</p>
                  <p className="font-medium">{property.daysOnMarket} days</p>
                </div>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
