import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  href?: string;
  onClick?: () => void;
}

export function StatsCard({ title, value, icon: Icon, description, trend, href, onClick }: StatsCardProps) {
  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-1">
          {href && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% geçen aya göre
          </p>
        )}
        {href && (
          <p className="text-xs text-primary mt-2 flex items-center gap-1">
            Detayları Gör <ExternalLink className="h-3 w-3" />
          </p>
        )}
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link 
        href={href}
        data-testid={`link-stats-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Card 
          className="hover-elevate cursor-pointer transition-all" 
          data-testid={`card-stats-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {cardContent}
        </Card>
      </Link>
    );
  }

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
