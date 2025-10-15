import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  subtitle,
  icon,
  trend,
  className,
}: KPICardProps) {
  // Auto-detect trend from change if not explicitly provided
  const displayTrend =
    trend ||
    (change !== undefined
      ? change > 0
        ? "up"
        : change < 0
        ? "down"
        : "neutral"
      : undefined);

  const TrendIcon =
    displayTrend === "up"
      ? ArrowUp
      : displayTrend === "down"
      ? ArrowDown
      : Minus;

  const trendColor =
    displayTrend === "up"
      ? "text-green-600 dark:text-green-400"
      : displayTrend === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          {title}
          {icon && <span className="text-primary opacity-70">{icon}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(change !== undefined || subtitle) && (
          <div className="flex items-center gap-2 mt-1">
            {change !== undefined && displayTrend && (
              <div className={cn("flex items-center text-xs font-medium", trendColor)}>
                <TrendIcon className="h-3 w-3 mr-1" />
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
