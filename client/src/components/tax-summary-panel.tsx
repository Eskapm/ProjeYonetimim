import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Calculator, FileText } from "lucide-react";

interface TaxSummaryProps {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  kdvCollected: number;
  kdvPaid: number;
  kdvPayable: number;
  incomeTax: number;
  corporateTax: number;
  effectiveRate: number;
  isCompany?: boolean;
}

export function TaxSummaryPanel({
  totalIncome,
  totalExpense,
  profit,
  kdvCollected,
  kdvPaid,
  kdvPayable,
  incomeTax,
  corporateTax,
  effectiveRate,
  isCompany = true,
}: TaxSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const totalTaxBurden = kdvPayable + (isCompany ? corporateTax : incomeTax);
  const netProfit = profit - totalTaxBurden;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gelir-Gider Özeti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Gelir-Gider Özeti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-muted-foreground">Toplam Gelir</span>
            </div>
            <span className="font-mono font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
              {formatCurrency(totalIncome)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-muted-foreground">Toplam Gider</span>
            </div>
            <span className="font-mono font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
              {formatCurrency(totalExpense)}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-semibold">Brüt Kar</span>
            <span
              className={`font-mono font-bold text-lg whitespace-nowrap ${
                profit >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(profit)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KDV Hesabı */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            KDV Hesabı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tahsil Edilen KDV (%20)</span>
            <span className="font-mono font-semibold whitespace-nowrap">{formatCurrency(kdvCollected)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Ödenen KDV</span>
            <span className="font-mono font-semibold whitespace-nowrap">{formatCurrency(kdvPaid)}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-semibold">Ödenecek KDV</span>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  kdvPayable >= 0
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                }
              >
                {kdvPayable >= 0 ? 'Borç' : 'Alacak'}
              </Badge>
              <span className="font-mono font-bold text-lg text-primary whitespace-nowrap">
                {formatCurrency(Math.abs(kdvPayable))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gelir/Kurumlar Vergisi */}
      <Card>
        <CardHeader>
          <CardTitle>{isCompany ? 'Kurumlar Vergisi' : 'Gelir Vergisi'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Vergilendirilebilir Kar</span>
            <span className="font-mono font-semibold whitespace-nowrap">{formatCurrency(profit)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Vergi Oranı {isCompany ? '(Sabit %25)' : '(Dilimli)'}
            </span>
            <span className="font-mono font-semibold">
              {isCompany ? '%25' : formatPercent(effectiveRate)}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-semibold">Hesaplanan Vergi</span>
            <span className="font-mono font-bold text-lg text-primary whitespace-nowrap">
              {formatCurrency(isCompany ? corporateTax : incomeTax)}
            </span>
          </div>

          {!isCompany && effectiveRate > 0 && (
            <p className="text-xs text-muted-foreground">
              Efektif vergi oranı: {formatPercent(effectiveRate)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Toplam Vergi Yükü */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Toplam Vergi ve Net Kar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Toplam Vergi Yükü</span>
            <span className="font-mono font-semibold text-destructive whitespace-nowrap">
              {formatCurrency(totalTaxBurden)}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">Net Kar (Vergiler Sonrası)</span>
            <span
              className={`font-mono font-bold text-2xl whitespace-nowrap ${
                netProfit >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(netProfit)}
            </span>
          </div>

          {profit > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              Toplam vergi/kar oranı: {formatPercent((totalTaxBurden / profit) * 100)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
