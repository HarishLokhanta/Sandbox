# Property API Guide: Handling Nested Objects in React

## The Problem

When fetching property data from the Microburbs API, you may encounter this error:

```
Error: Objects are not valid as a React child (found: object with keys {sa1, sal, state, street}).
```

This happens because **the API returns nested objects** (like `address: { street, sal, state, sa1 }`) and if you try to render them directly in JSX with `{property.address}`, React throws an error.

## API Response Structure

The Microburbs properties API returns data in this format:

```json
{
  "results": [
    {
      "address": {
        "sa1": "11101120615",
        "sal": "Belmont North",
        "state": "NSW",
        "street": "3 Dalton Close"
      },
      "area_level": "address",
      "area_name": "3 Dalton Close, Belmont North, NSW",
      "attributes": {
        "bathrooms": 1.0,
        "bedrooms": 3.0,
        "building_size": "nan",
        "description": "...",
        "garage_spaces": 2.0,
        "land_size": "607.0"
      },
      "coordinates": {
        "latitude": -33.01402088,
        "longitude": 151.67272249
      },
      "listing_date": "2025-10-03",
      "price": 997500.0,
      "property_type": "House"
    }
  ]
}
```

### Key Issues:

1. **`address` is an object**, not a string
2. **`attributes` contains nested data** like bedrooms, bathrooms, garage_spaces
3. **`coordinates` is an object** with latitude/longitude

## Solution: Safe Extraction Functions

### 1. Type Definition

First, define a type that handles both string and object addresses:

```typescript
export type PropertyRecord = {
  id?: string | number;
  address?:
    | string
    | {
        street?: string;
        sal?: string;
        suburb?: string;
        state?: string;
        sa1?: string;
        [key: string]: unknown;
      }
    | null;
  area_name?: string | null;
  suburb?: string | null;
  price?: number | null;
  property_type?: string | null;
  listing_date?: string | null;
  attributes?: {
    bathrooms?: number | null;
    bedrooms?: number | null;
    garage_spaces?: number | null;
    land_size?: string | number | null;
    description?: string | null;
    [key: string]: unknown;
  } | null;
  coordinates?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  // ... other fields
};
```

### 2. Safe Address Formatter

Create a helper function that handles both string and object addresses:

```typescript
function formatAddress(property: PropertyRecord): string {
  // If address is already a string, use it
  if (typeof property.address === "string") {
    const trimmed = property.address.trim();
    if (trimmed) return trimmed;
  }

  // If address is an object (nested structure from API), extract parts
  if (property.address && typeof property.address === "object") {
    const parts: string[] = [];
    const addr = property.address as {
      street?: string;
      sal?: string;
      suburb?: string;
      state?: string;
    };

    if (addr.street) parts.push(addr.street);
    if (addr.sal || addr.suburb) parts.push(addr.sal || addr.suburb || "");
    if (addr.state) parts.push(addr.state);

    const formatted = parts.filter(Boolean).join(", ");
    if (formatted) return formatted;
  }

  // Fallback to area_name or suburb
  return property.area_name || property.suburb || "Address unavailable";
}
```

### 3. Safe Attribute Extractors

Handle nested `attributes` object:

```typescript
function extractBeds(property: PropertyRecord): number | null {
  // Check top-level properties first
  let value = property.bedrooms ?? property.beds;

  // If not found, check nested attributes object
  if ((value === null || value === undefined) && property.attributes) {
    value = property.attributes.bedrooms;
  }

  return typeof value === "number" && isFinite(value) ? value : null;
}

function extractBaths(property: PropertyRecord): number | null {
  let value = property.bathrooms ?? property.baths;

  if ((value === null || value === undefined) && property.attributes) {
    value = property.attributes.bathrooms;
  }

  return typeof value === "number" && isFinite(value) ? value : null;
}

function extractCars(property: PropertyRecord): number | null {
  let value = property.parking ?? property.car_spaces ?? property.garage;

  if ((value === null || value === undefined) && property.attributes) {
    value = property.attributes.garage_spaces;
  }

  return typeof value === "number" && isFinite(value) ? value : null;
}
```

### 4. Safe Coordinate Extractor

```typescript
function extractCoordinates(property: PropertyRecord): { lat: number; lng: number } | null {
  const sources = [
    property,
    property.coordinates ?? undefined,
  ].filter(Boolean) as Array<Record<string, unknown>>;

  for (const source of sources) {
    const lat = source.latitude ?? source.lat;
    const lng = source.longitude ?? source.lon ?? source.lng;

    if (typeof lat === "number" && typeof lng === "number" && isFinite(lat) && isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}
```

## Complete React Component Example

Here's a safe component that fetches and displays property data:

```typescript
"use client";

import { useEffect, useState } from "react";

type PropertyRecord = {
  // ... full type definition from above
};

export function PropertiesDisplay() {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch("/api/properties");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract properties from response
        let propertyList: PropertyRecord[] = [];
        if (Array.isArray(data)) {
          propertyList = data;
        } else if (data.results && Array.isArray(data.results)) {
          propertyList = data.results;
        } else if (data.properties && Array.isArray(data.properties)) {
          propertyList = data.properties;
        }

        setProperties(propertyList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  if (loading) return <div>Loading properties...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (properties.length === 0) return <div>No properties found.</div>;

  return (
    <div className="properties-grid">
      {properties.map((property, index) => {
        // Safe extraction using helper functions
        const address = formatAddress(property);
        const beds = extractBeds(property);
        const baths = extractBaths(property);
        const cars = extractCars(property);
        const coords = extractCoordinates(property);

        return (
          <div key={property.id ?? index} className="property-card">
            <h3>{address}</h3>

            {/* Safe price rendering */}
            <p className="price">
              {typeof property.price === "number"
                ? `$${property.price.toLocaleString()}`
                : "Contact agent"}
            </p>

            {/* Safe attributes rendering */}
            <div className="attributes">
              <span>🛏️ {beds ?? "-"} beds</span>
              <span>🚿 {baths ?? "-"} baths</span>
              <span>🚗 {cars ?? "-"} cars</span>
            </div>

            {/* Safe property type */}
            {property.property_type && (
              <span className="badge">{property.property_type}</span>
            )}

            {/* Safe coordinates rendering */}
            {coords && (
              <button onClick={() => console.log("Show on map", coords)}>
                View on map
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

## Rendering on Map

To display properties as markers on a Leaflet map:

```typescript
function buildPropertyMarkers(properties: PropertyRecord[]): MarkerItem[] {
  const markers: MarkerItem[] = [];

  for (const property of properties) {
    const coords = extractCoordinates(property);

    // Skip properties without valid coordinates
    if (!coords) {
      console.warn("Property missing coordinates:", property);
      continue;
    }

    markers.push({
      lat: coords.lat,
      lng: coords.lng,
      label: formatAddress(property),
      type: "property",
    });
  }

  return markers;
}

// Usage in component
const propertyMarkers = buildPropertyMarkers(properties);

<Map
  center={[-33.014, 151.667]}
  propertyMarkers={propertyMarkers}
  amenityMarkers={amenityMarkers}
/>
```

## Common Mistakes to Avoid

### ❌ DON'T render objects directly:

```typescript
// This will throw "Objects are not valid as a React child" error
<div>{property.address}</div>
<div>{property.coordinates}</div>
<div>{property.attributes}</div>
```

### ✅ DO extract and format values first:

```typescript
// Safe rendering
<div>{formatAddress(property)}</div>
<div>{coords ? `${coords.lat}, ${coords.lng}` : "No location"}</div>
<div>{extractBeds(property) ?? "-"} beds</div>
```

### ❌ DON'T assume flat structure:

```typescript
// May be undefined if data is nested
const beds = property.bedrooms;
```

### ✅ DO check multiple locations:

```typescript
// Check both top-level and nested attributes
const beds = property.bedrooms ?? property.attributes?.bedrooms ?? null;
```

## Summary

1. **Always extract values** from nested objects before rendering
2. **Use helper functions** to handle both string and object formats
3. **Provide fallbacks** for missing data
4. **Validate coordinates** before adding to map
5. **Test with actual API responses** to catch edge cases

The key principle: **Never render raw objects in JSX**. Always extract primitive values (strings, numbers, booleans) first.
