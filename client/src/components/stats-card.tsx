import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export function StatsCard({ title, value, icon: Icon, description, trend, onClick }: StatsCardProps) {
  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium truncate min-w-0">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold font-mono truncate">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% geçen aya göre
          </p>
        )}
      </CardContent>
    </>
  );

  if (onClick) {
    return (
      <Card 
        className="hover-elevate cursor-pointer transition-all" 
        onClick={onClick}
        data-testid={`card-stats-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {cardContent}
      </Card>
    );
  }

  return (
    <Card data-testid={`card-stats-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {cardContent}
    </Card>
  );
}
