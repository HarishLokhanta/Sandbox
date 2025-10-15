"use client";

import { Home } from "lucide-react";
import { SuburbSearch } from "./suburb-search";
import { PropertyTypeSelect } from "./property-type-select";
import { ThemeToggle } from "./theme-toggle";
import { PropertyType } from "@/lib/schemas";

interface HeaderProps {
  suburb: string;
  propertyType: PropertyType;
  onSuburbChange: (suburb: string) => void;
  onPropertyTypeChange: (type: PropertyType) => void;
}

export function Header({
  suburb,
  propertyType,
  onSuburbChange,
  onPropertyTypeChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Home className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">Microburbs Sandbox</span>
        </div>

        <div className="flex flex-1 items-center gap-2 md:gap-4">
          <SuburbSearch
            value={suburb}
            onChange={onSuburbChange}
            className="flex-1 max-w-sm"
          />
          <PropertyTypeSelect
            value={propertyType}
            onChange={onPropertyTypeChange}
          />
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
