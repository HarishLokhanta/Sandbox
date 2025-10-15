"use client";

import { KPICard } from "./kpi-card";
import { KPISkeleton } from "../shared/loading-skeleton";
import { ErrorState } from "../shared/error-state";
import { useMarket } from "@/lib/api";
import { PropertyType } from "@/lib/schemas";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, Clock, Home, Target } from "lucide-react";

interface HeroKPIsProps {
  suburb: string;
  propertyType: PropertyType;
}

export function HeroKPIs({ suburb, propertyType }: HeroKPIsProps) {
  const { data, isLoading, isError, isSuccess, refetch } = useMarket(
    suburb,
    propertyType
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPISkeleton />
        <KPISkeleton />
        <KPISkeleton />
        <KPISkeleton />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const stats = data?.stats;
  const sectionKeys = isSuccess ? Object.keys(data || {}) : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {isSuccess && (
        <span data-test="section-keys" style={{ display: "none" }}>
          {sectionKeys.join(",")}
        </span>
      )}
      <KPICard
        title="Median Price"
        value={formatCurrency(stats?.medianPrice)}
        change={stats?.medianPriceChange12m || undefined}
        subtitle="12-month change"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <KPICard
        title="Days on Market"
        value={stats?.daysOnMarket ?? "N/A"}
        subtitle="Average listing time"
        icon={<Clock className="h-4 w-4" />}
      />
      <KPICard
        title="Weekly Listings"
        value={formatNumber(stats?.weeklyListings || stats?.listingsCount)}
        subtitle="New properties"
        icon={<Home className="h-4 w-4" />}
      />
      <KPICard
        title="Clearance Rate"
        value={
          stats?.clearanceRate !== null && stats?.clearanceRate !== undefined
            ? `${stats.clearanceRate.toFixed(0)}%`
            : stats?.auctionClearanceRate !== null &&
              stats?.auctionClearanceRate !== undefined
            ? `${stats.auctionClearanceRate.toFixed(0)}%`
            : "N/A"
        }
        subtitle="Auction success"
        icon={<Target className="h-4 w-4" />}
      />
    </div>
  );
}
