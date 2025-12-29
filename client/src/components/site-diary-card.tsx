import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Cloud, Users, AlertCircle, Edit, Trash2, Sun, CloudRain, Snowflake, Wind, Image, ChevronLeft, ChevronRight, X } from "lucide-react";
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
  photos?: string[];
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  const photos = entry.photos || [];
  
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  
  const nextPhoto = () => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
  };
  
  const prevPhoto = () => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };
  
  return (
    <>
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

          {photos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Image className="h-4 w-4" />
                Fotoğraflar ({photos.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => openLightbox(index)}
                    className="relative w-16 h-16 rounded-md overflow-hidden border border-border hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid={`button-photo-${entry.id}-${index}`}
                  >
                    <img
                      src={photo}
                      alt={`Fotoğraf ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
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

      {/* Photo Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {photos.length > 0 && (
              <img
                src={photos[lightboxIndex]}
                alt={`Fotoğraf ${lightboxIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white"
              onClick={() => setLightboxOpen(false)}
              data-testid="button-close-lightbox"
            >
              <X className="h-6 w-6" />
            </Button>
            
            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 text-white"
                  onClick={prevPhoto}
                  data-testid="button-prev-photo"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 text-white"
                  onClick={nextPhoto}
                  data-testid="button-next-photo"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            
            {/* Photo counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
