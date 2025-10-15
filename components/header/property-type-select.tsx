"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyType } from "@/lib/schemas";
import { capitalize } from "@/lib/utils";

interface PropertyTypeSelectProps {
  value: PropertyType;
  onChange: (value: PropertyType) => void;
}

const PROPERTY_TYPES: PropertyType[] = [
  "all",
  "house",
  "unit",
  "townhouse",
  "land",
];

export function PropertyTypeSelect({
  value,
  onChange,
}: PropertyTypeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Property Type" />
      </SelectTrigger>
      <SelectContent>
        {PROPERTY_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {type === "all" ? "All Types" : capitalize(type)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
