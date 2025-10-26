import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Ruler, Eye, Edit } from "lucide-react";
import { Link } from "wouter";

interface ProjectCardProps {
  id: string;
  name: string;
  location?: string;
  area?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  costPerSqm?: string;
  onView?: () => void;
  onEdit?: () => void;
}

const statusColors: Record<string, string> = {
  "Planlama": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Devam Ediyor": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Tamamlandı": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  "Askıda": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export function ProjectCard({
  id,
  name,
  location,
  area,
  startDate,
  endDate,
  status,
  costPerSqm,
  onView,
  onEdit,
}: ProjectCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-project-${id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge className={statusColors[status] || ""}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
        )}
        {area && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ruler className="h-4 w-4" />
            <span>{area} m²</span>
          </div>
        )}
        {(startDate || endDate) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{startDate} - {endDate}</span>
          </div>
        )}
        {costPerSqm && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">m²/TL Maliyet</div>
            <div className="text-xl font-bold font-mono text-primary">{costPerSqm}</div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Link href={`/projeler/${id}`} className="flex-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            data-testid={`button-view-project-${id}`}
          >
            <Eye className="h-4 w-4 mr-2" />
            Görüntüle
          </Button>
        </Link>
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1"
          onClick={onEdit}
          data-testid={`button-edit-project-${id}`}
        >
          <Edit className="h-4 w-4 mr-2" />
          Düzenle
        </Button>
      </CardFooter>
    </Card>
  );
}
