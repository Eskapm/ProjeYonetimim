import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Calendar, Cloud, Users, AlertCircle, Edit, Trash2, Sun, CloudRain, Snowflake, Wind, Image, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
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
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const photos = entry.photos || [];
  
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoomLevel(1);
    setLightboxOpen(true);
  };
  
  const nextPhoto = () => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
    setZoomLevel(1);
  };
  
  const prevPhoto = () => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setZoomLevel(1);
  };
  
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 5));
  };
  
  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };
  
  const resetZoom = () => {
    setZoomLevel(1);
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none" aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>Fotoğraf Görüntüleme</DialogTitle>
          </VisuallyHidden>
          <div className="relative flex items-center justify-center min-h-[70vh] w-full">
            {/* Close button - prominent */}
            <button
              className="absolute top-4 right-4 z-50 bg-white/20 rounded-full p-2 text-white"
              onClick={() => setLightboxOpen(false)}
              data-testid="button-close-lightbox"
            >
              <X className="h-8 w-8" />
            </button>
            
            {/* Left navigation arrow */}
            {photos.length > 1 && (
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-white/20 rounded-r-lg p-3 text-white"
                onClick={prevPhoto}
                data-testid="button-prev-photo"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
            )}
            
            {/* Image container with zoom */}
            <div className="overflow-auto max-w-full max-h-[80vh] flex items-center justify-center px-16">
              {photos.length > 0 && (
                <img
                  src={photos[lightboxIndex]}
                  alt={`Fotoğraf ${lightboxIndex + 1}`}
                  className="object-contain transition-transform duration-200 max-h-[75vh]"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              )}
            </div>
            
            {/* Right navigation arrow */}
            {photos.length > 1 && (
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-white/20 rounded-l-lg p-3 text-white"
                onClick={nextPhoto}
                data-testid="button-next-photo"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            )}
            
            {/* Zoom controls - bottom center */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 rounded-full px-4 py-2">
              <button
                className="text-white disabled:opacity-50"
                onClick={zoomOut}
                disabled={zoomLevel <= 0.5}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-6 w-6" />
              </button>
              <span className="text-white text-sm min-w-[3.5rem] text-center font-medium">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                className="text-white disabled:opacity-50"
                onClick={zoomIn}
                disabled={zoomLevel >= 5}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-6 w-6" />
              </button>
              <button
                className="text-white ml-2"
                onClick={resetZoom}
                data-testid="button-zoom-reset"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
            
            {/* Photo counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-4 py-2 rounded-full font-medium">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
