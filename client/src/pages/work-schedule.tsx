import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar } from "lucide-react";

export default function WorkSchedule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">İş Programı</h1>
          <p className="text-muted-foreground mt-1">Proje iş programları ve zaman planlaması</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button data-testid="button-new-schedule">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Program Ekle
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            İş Programı Modülü
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">İş Programı modülü yakında eklenecek</p>
            <p className="text-sm">Gantt chart, zaman çizelgesi ve iş akışı planlama özellikleri</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
