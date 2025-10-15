"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRisk } from "@/lib/api";
import { TableSkeleton } from "../shared/loading-skeleton";
import { ErrorState } from "../shared/error-state";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";
import { AlertTriangle, Shield, Info } from "lucide-react";

interface RiskPanelProps {
  suburb: string;
}

const getRiskColor = (level?: string) => {
  switch (level) {
    case "low":
      return "success";
    case "medium":
      return "warning";
    case "high":
    case "very-high":
      return "destructive";
    default:
      return "secondary";
  }
};

const getRiskIcon = (level?: string) => {
  switch (level) {
    case "low":
      return <Shield className="h-4 w-4" />;
    case "medium":
      return <Info className="h-4 w-4" />;
    case "high":
    case "very-high":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

export function RiskPanel({ suburb }: RiskPanelProps) {
  const { data, isLoading, isError, isSuccess, refetch } = useRisk(suburb);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const overallScore = data?.overallScore ?? 50;
  const chartData = [
    {
      name: "Risk Score",
      value: overallScore,
      fill: overallScore < 33 ? "#22c55e" : overallScore < 66 ? "#eab308" : "#ef4444",
    },
  ];

  const allRisks = [
    ...(data?.risks ?? []),
    ...(data?.flood ? [{ ...data.flood, type: "Flood" }] : []),
    ...(data?.bushfire ? [{ ...data.bushfire, type: "Bushfire" }] : []),
    ...(data?.crime ? [{ ...data.crime, type: "Crime" }] : []),
    ...(data?.climate ? [{ ...data.climate, type: "Climate" }] : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {isSuccess && (
          <span data-test="section-keys" style={{ display: "none" }}>
            {Object.keys(data || {}).join(",")}
          </span>
        )}
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  fill={chartData[0].fill}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-3xl font-bold"
                >
                  {overallScore.toFixed(0)}
                </text>
                <text
                  x="50%"
                  y="60%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-sm"
                >
                  Risk Score
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Overall risk assessment (0-100 scale)
            </p>
          </div>

          {allRisks.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Risk Factors</h4>
              {allRisks.map((risk, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      {getRiskIcon(risk.level)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{risk.type}</p>
                        {risk.level && (
                          <Badge
                            variant={getRiskColor(risk.level) as any}
                            className="text-xs"
                          >
                            {risk.level}
                          </Badge>
                        )}
                      </div>
                      {risk.description && (
                        <p className="text-sm text-muted-foreground">
                          {risk.description}
                        </p>
                      )}
                      {risk.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {risk.details}
                        </p>
                      )}
                    </div>
                  </div>
                  {risk.score !== null && risk.score !== undefined && (
                    <div className="ml-3 text-right">
                      <p className="text-lg font-bold">{risk.score}</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No risk data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
