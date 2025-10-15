"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMarket } from "@/lib/api";
import { PropertyType } from "@/lib/schemas";
import { ChartSkeleton } from "../shared/loading-skeleton";
import { ErrorState } from "../shared/error-state";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface TrendChartProps {
  suburb: string;
  propertyType: PropertyType;
}

export function TrendChart({ suburb, propertyType }: TrendChartProps) {
  const { data, isLoading, isError, isSuccess, refetch } = useMarket(
    suburb,
    propertyType
  );

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const priceData = data?.priceHistory ?? [];
  const salesData = data?.salesHistory ?? [];
  const listingsData = data?.listingsHistory ?? [];
  const sectionKeys = isSuccess ? Object.keys(data || {}) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {isSuccess && (
          <span data-test="section-keys" style={{ display: "none" }}>
            {sectionKeys.join(",")}
          </span>
        )}
        <Tabs defaultValue="prices" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prices">Prices</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
          </TabsList>

          <TabsContent value="prices" className="mt-4">
            {priceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={priceData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A5BD9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0A5BD9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Price"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0A5BD9"
                    strokeWidth={2}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No price data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [formatNumber(value), "Sales"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0A5BD9"
                    strokeWidth={2}
                    dot={{ fill: "#0A5BD9", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No sales data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="listings" className="mt-4">
            {listingsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={listingsData}>
                  <defs>
                    <linearGradient
                      id="colorListings"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#0849AD" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0849AD" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [
                      formatNumber(value),
                      "Listings",
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0849AD"
                    strokeWidth={2}
                    fill="url(#colorListings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No listings data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
