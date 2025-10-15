import { z } from "zod";

// Property Type Enum
export const PropertyTypeSchema = z.enum([
  "all",
  "house",
  "unit",
  "townhouse",
  "land",
]);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

// Query Schemas
export const SuburbQuerySchema = z.object({
  suburb: z.string().min(1),
  property_type: PropertyTypeSchema.optional().default("all"),
});

// Property Schema
export const PropertySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  address: z.string().optional().default("Address not available"),
  price: z.number().nullable().optional(),
  priceText: z.string().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  parking: z.number().nullable().optional(),
  propertyType: z.string().optional(),
  landSize: z.number().nullable().optional(),
  thumbnail: z.string().url().nullable().optional(),
  images: z.array(z.string()).optional().default([]),
  description: z.string().optional(),
  agent: z.string().optional(),
  agencyName: z.string().optional(),
  listedDate: z.string().optional(),
  daysOnMarket: z.number().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type Property = z.infer<typeof PropertySchema>;

export const PropertiesResponseSchema = z.object({
  properties: z.array(PropertySchema).optional().default([]),
  total: z.number().optional().default(0),
  suburb: z.string().optional(),
});

// Amenity Schema
export const AmenitySchema = z.object({
  name: z.string(),
  type: z.string(),
  category: z.string().optional(),
  distance: z.number().nullable().optional(),
  address: z.string().optional(),
  rating: z.number().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type Amenity = z.infer<typeof AmenitySchema>;

export const AmenitiesResponseSchema = z.object({
  amenities: z.array(AmenitySchema).optional().default([]),
  suburb: z.string().optional(),
  categories: z.array(z.string()).optional().default([]),
});

// Market Data Schema
export const MarketDataPointSchema = z.object({
  date: z.string(),
  value: z.number().nullable(),
  month: z.string().optional(),
  year: z.number().optional(),
});

export const MarketStatsSchema = z.object({
  medianPrice: z.number().nullable().optional(),
  medianPriceChange: z.number().nullable().optional(),
  medianPriceChange12m: z.number().nullable().optional(),
  daysOnMarket: z.number().nullable().optional(),
  salesVolume: z.number().nullable().optional(),
  listingsCount: z.number().nullable().optional(),
  weeklyListings: z.number().nullable().optional(),
  clearanceRate: z.number().nullable().optional(),
  rentalYield: z.number().nullable().optional(),
  auctionClearanceRate: z.number().nullable().optional(),
});

export const MarketResponseSchema = z.object({
  suburb: z.string().optional(),
  propertyType: z.string().optional(),
  stats: MarketStatsSchema.optional(),
  priceHistory: z.array(MarketDataPointSchema).optional().default([]),
  salesHistory: z.array(MarketDataPointSchema).optional().default([]),
  listingsHistory: z.array(MarketDataPointSchema).optional().default([]),
  supplyDemand: z
    .object({
      supply: z.number().nullable().optional(),
      demand: z.number().nullable().optional(),
      ratio: z.number().nullable().optional(),
    })
    .optional(),
});

export type MarketData = z.infer<typeof MarketResponseSchema>;
export type MarketStats = z.infer<typeof MarketStatsSchema>;

// Similar Suburb Schema
export const SimilarSuburbSchema = z.object({
  name: z.string(),
  state: z.string().optional(),
  medianPrice: z.number().nullable().optional(),
  priceChange: z.number().nullable().optional(),
  distance: z.number().nullable().optional(),
  similarity: z.number().nullable().optional(),
  daysOnMarket: z.number().nullable().optional(),
  salesVolume: z.number().nullable().optional(),
  population: z.number().nullable().optional(),
});

export type SimilarSuburb = z.infer<typeof SimilarSuburbSchema>;

export const SimilarSuburbsResponseSchema = z.object({
  suburb: z.string().optional(),
  similar: z.array(SimilarSuburbSchema).optional().default([]),
});

// Risk Schema
export const RiskFactorSchema = z.object({
  type: z.string(),
  level: z.enum(["low", "medium", "high", "very-high"]).optional(),
  score: z.number().min(0).max(100).nullable().optional(),
  description: z.string().optional(),
  details: z.string().optional(),
});

export type RiskFactor = z.infer<typeof RiskFactorSchema>;

export const RiskResponseSchema = z.object({
  suburb: z.string().optional(),
  overallScore: z.number().min(0).max(100).nullable().optional(),
  risks: z.array(RiskFactorSchema).optional().default([]),
  flood: RiskFactorSchema.optional(),
  bushfire: RiskFactorSchema.optional(),
  crime: RiskFactorSchema.optional(),
  climate: RiskFactorSchema.optional(),
});

export type RiskData = z.infer<typeof RiskResponseSchema>;

// API Error Schema
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
});
