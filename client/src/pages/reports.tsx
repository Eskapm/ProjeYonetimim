import { PrintButton } from "@/components/print-button";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raporlar</h1>
          <p className="text-muted-foreground mt-1">Detaylı analiz ve raporlama</p>
        </div>
        <PrintButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Toplam Gelir"
          value="₺2,450,000"
          icon={TrendingUp}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Toplam Gider"
          value="₺1,850,000"
          icon={TrendingDown}
          trend={{ value: 8.2, isPositive: false }}
        />
        <StatsCard
          title="Net Kar"
          value="₺600,000"
          icon={DollarSign}
          description="Bu ay"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover-elevate cursor-pointer" data-testid="card-financial-report">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Mali Raporlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gelir-gider analizi, kâr-zarar tablosu, nakit akışı raporları
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="card-project-report">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Proje Raporları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Proje ilerleme, maliyet analizi, zaman çizelgesi raporları
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="card-tax-report">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Vergi Raporları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              KDV, gelir vergisi, kurumlar vergisi detaylı raporları
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="card-performance-report">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5" />
              Performans Raporları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Taşeron, müşteri ve proje performans analizleri
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="card-category-report">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Kategori Raporları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              İş grupları ve rayiç grupları bazında detaylı analizler
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="card-custom-report">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Özel Raporlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Kullanıcı tanımlı filtreler ile özelleştirilmiş raporlar
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Rapor modülü yakında eklenecek</p>
            <p className="text-sm">Gelişmiş filtreleme, grafik ve Excel export özellikleri ile</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
