import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Cloud, Users, AlertCircle, Edit, Trash2, Sun, CloudRain, Snowflake, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SiteDiaryEntry {
  id: string;
  date: string;
  projectName?: string;
  weather?: string;
  workDone: string;
  materialsUsed?: string;
  totalWorkers?: number;
  issues?: string;
  notes?: string;
}

interface SiteDiaryCardProps {
  entry: SiteDiaryEntry;
  onEdit?: () => void;
  onDelete?: () => void;
}

const weatherIcons: Record<string, LucideIcon> = {
  "Güneşli": Sun,
  "Bulutlu": Cloud,
  "Yağmurlu": CloudRain,
  "Karlı": Snowflake,
  "Rüzgarlı": Wind,
};

export function SiteDiaryCard({ entry, onEdit, onDelete }: SiteDiaryCardProps) {
  const WeatherIcon = entry.weather ? weatherIcons[entry.weather] || Cloud : Cloud;
  
  return (
    <Card className="hover-elevate" data-testid={`card-diary-${entry.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {entry.date}
            </CardTitle>
            {entry.projectName && (
              <p className="text-sm text-muted-foreground mt-1">{entry.projectName}</p>
            )}
          </div>
          {entry.weather && (
            <Badge variant="secondary" className="gap-1">
              <WeatherIcon className="h-3 w-3" />
              {entry.weather}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Yapılan İşler</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.workDone}</p>
        </div>

        {entry.materialsUsed && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Kullanılan Malzemeler</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {entry.materialsUsed}
            </p>
          </div>
        )}

        {entry.totalWorkers !== undefined && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Toplam işçi: <strong>{entry.totalWorkers}</strong>
            </span>
          </div>
        )}

        {entry.issues && (
          <div className="border-l-4 border-destructive pl-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <h4 className="text-sm font-semibold text-destructive">Sorunlar</h4>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.issues}</p>
          </div>
        )}

        {entry.notes && (
          <div className="border-l-2 border-muted pl-3">
            <h4 className="text-sm font-semibold mb-1">Notlar</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onEdit}
          data-testid={`button-edit-diary-${entry.id}`}
        >
          <Edit className="h-4 w-4 mr-2" />
          Düzenle
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={onDelete}
          data-testid={`button-delete-diary-${entry.id}`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Sil
        </Button>
      </CardFooter>
    </Card>
  );
}
