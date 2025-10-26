import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calculator } from "lucide-react";

export default function Budget() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bütçe ve Keşif</h1>
          <p className="text-muted-foreground mt-1">Proje bütçeleri, keşif ve maliyet analizleri</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button data-testid="button-new-budget">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Bütçe Ekle
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Bütçe ve Keşif Modülü
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calculator className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Bütçe ve Keşif modülü yakında eklenecek</p>
            <p className="text-sm">Detaylı maliyet analizi, keşif raporu ve bütçe karşılaştırma özellikleri</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
