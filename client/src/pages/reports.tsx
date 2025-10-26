import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PrintButton } from "@/components/print-button";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { type TransactionWithProject, type Project, type Invoice } from "@shared/schema";
import { calculateTaxSummary } from "@shared/taxCalculations";
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type DateFilter = "all" | "this-month" | "this-year" | "custom";

export default function Reports() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("this-year");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Fetch data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<TransactionWithProject[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const isLoading = transactionsLoading || projectsLoading || invoicesLoading;

  // Filter transactions by date
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateFilter) {
      case "this-month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case "this-year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case "custom":
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) {
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      case "all":
      default:
        return transactions;
    }

    if (!startDate && !endDate) return transactions;

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      if (startDate && transactionDate < startDate) return false;
      if (endDate && transactionDate > endDate) return false;
      return true;
    });
  }, [transactions, dateFilter, customStartDate, customEndDate]);

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "Gelir")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === "Gider")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netProfit = totalIncome - totalExpense;

    // Calculate KDV from invoices with proper date filtering
    const totalKDV = invoices
      .filter((inv) => {
        if (dateFilter === "all") return true;
        const invDate = new Date(inv.date);
        const now = new Date();
        
        switch (dateFilter) {
          case "this-month": {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            return invDate >= monthStart && invDate <= monthEnd;
          }
          case "this-year": {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            return invDate >= yearStart && invDate <= yearEnd;
          }
          case "custom": {
            let start = customStartDate ? new Date(customStartDate) : null;
            let end = customEndDate ? new Date(customEndDate) : null;
            if (end) end.setHours(23, 59, 59, 999);
            
            if (start && invDate < start) return false;
            if (end && invDate > end) return false;
            return true;
          }
          default:
            return true;
        }
      })
      .reduce((sum, inv) => sum + parseFloat(inv.taxAmount), 0);

    // Calculate tax summary - prepare transaction arrays with hasKDV flag
    // Note: We don't have hasKDV field on transactions, so assume all have KDV for now
    const incomeArray = filteredTransactions
      .filter((t) => t.type === "Gelir")
      .map((t) => ({ amount: parseFloat(t.amount), hasKDV: true }));
    
    const expenseArray = filteredTransactions
      .filter((t) => t.type === "Gider")
      .map((t) => ({ amount: parseFloat(t.amount), hasKDV: true }));

    const taxSummary = calculateTaxSummary(
      incomeArray.length > 0 ? incomeArray : [{ amount: 0 }],
      expenseArray.length > 0 ? expenseArray : [{ amount: 0 }],
      true
    );

    return {
      totalIncome,
      totalExpense,
      netProfit,
      totalKDV,
      taxSummary,
    };
  }, [filteredTransactions, invoices, dateFilter, customStartDate, customEndDate]);

  // Group by work category (İş Grubu)
  const workGroupData = useMemo(() => {
    const groups: Record<string, number> = {};
    
    filteredTransactions
      .filter((t) => t.type === "Gider")
      .forEach((t) => {
        groups[t.isGrubu] = (groups[t.isGrubu] || 0) + parseFloat(t.amount);
      });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Group by cost category (Rayiç Grubu)
  const costGroupData = useMemo(() => {
    const groups: Record<string, number> = {};
    
    filteredTransactions
      .filter((t) => t.type === "Gider")
      .forEach((t) => {
        groups[t.rayicGrubu] = (groups[t.rayicGrubu] || 0) + parseFloat(t.amount);
      });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Project financial analysis
  const projectFinancials = useMemo(() => {
    const projectMap: Record<string, {
      name: string;
      income: number;
      expense: number;
      profit: number;
    }> = {};

    filteredTransactions.forEach((t) => {
      if (!projectMap[t.projectId]) {
        projectMap[t.projectId] = {
          name: t.projectName,
          income: 0,
          expense: 0,
          profit: 0,
        };
      }

      if (t.type === "Gelir") {
        projectMap[t.projectId].income += parseFloat(t.amount);
      } else {
        projectMap[t.projectId].expense += parseFloat(t.amount);
      }
    });

    return Object.values(projectMap).map((p) => ({
      ...p,
      profit: p.income - p.expense,
    })).sort((a, b) => b.profit - a.profit);
  }, [filteredTransactions]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { monthKey: string; month: string; income: number; expense: number }> = {};

    filteredTransactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: 'short' }).format(date);

      if (!months[monthKey]) {
        months[monthKey] = { monthKey, month: monthName, income: 0, expense: 0 };
      }

      if (t.type === "Gelir") {
        months[monthKey].income += parseFloat(t.amount);
      } else {
        months[monthKey].expense += parseFloat(t.amount);
      }
    });

    // Sort by monthKey (YYYY-MM) for proper chronological order
    return Object.values(months).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raporlar</h1>
          <p className="text-muted-foreground mt-1">Detaylı analiz ve raporlama</p>
        </div>
        <PrintButton />
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Tarih Filtresi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Dönem</Label>
              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                <SelectTrigger data-testid="select-date-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Zamanlar</SelectItem>
                  <SelectItem value="this-month">Bu Ay</SelectItem>
                  <SelectItem value="this-year">Bu Yıl</SelectItem>
                  <SelectItem value="custom">Özel Tarih Aralığı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateFilter === "custom" && (
              <>
                <div className="flex-1">
                  <Label>Başlangıç Tarihi</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="flex-1">
                  <Label>Bitiş Tarihi</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Toplam Gelir"
            value={formatCurrency(financialSummary.totalIncome)}
            icon={TrendingUp}
          />
          <StatsCard
            title="Toplam Gider"
            value={formatCurrency(financialSummary.totalExpense)}
            icon={TrendingDown}
          />
          <StatsCard
            title="Net Kar"
            value={formatCurrency(financialSummary.netProfit)}
            icon={DollarSign}
            description={financialSummary.netProfit >= 0 ? "Karlı" : "Zararda"}
          />
        </div>
      )}

      {/* Tax Summary */}
      {!isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Vergi Özeti
            </CardTitle>
            <CardDescription>
              Toplam gelir ve giderlere göre hesaplanan vergi yükümlülükleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam KDV</p>
                <p className="text-2xl font-bold">{formatCurrency(financialSummary.totalKDV)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kurumlar Vergisi</p>
                <p className="text-2xl font-bold">{formatCurrency(financialSummary.taxSummary.corporateTax)}</p>
                <p className="text-xs text-muted-foreground">%25 oran</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Net Kar (Vergi Sonrası)</p>
                <p className="text-2xl font-bold">{formatCurrency(financialSummary.taxSummary.netProfit)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Vergi Yükü</p>
                <p className="text-2xl font-bold">{formatCurrency(financialSummary.taxSummary.totalTaxBurden)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend Chart */}
      {!isLoading && monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aylık Gelir-Gider Trendi</CardTitle>
            <CardDescription>Zaman içinde gelir ve gider değişimi</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" name="Gelir" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Gider" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Analysis */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work Group Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>İş Grubu Bazında Giderler</CardTitle>
              <CardDescription>Toplam giderlerin iş gruplarına göre dağılımı</CardDescription>
            </CardHeader>
            <CardContent>
              {workGroupData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Veri bulunamadı</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={workGroupData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${((entry.value / financialSummary.totalExpense) * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {workGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cost Group Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Rayiç Grubu Bazında Giderler</CardTitle>
              <CardDescription>Toplam giderlerin maliyet gruplarına göre dağılımı</CardDescription>
            </CardHeader>
            <CardContent>
              {costGroupData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Veri bulunamadı</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={costGroupData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${((entry.value / financialSummary.totalExpense) * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project Financial Analysis */}
      {!isLoading && projectFinancials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Proje Bazlı Finansal Analiz</CardTitle>
            <CardDescription>Her projenin gelir, gider ve kâr durumu</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proje Adı</TableHead>
                  <TableHead className="text-right">Gelir</TableHead>
                  <TableHead className="text-right">Gider</TableHead>
                  <TableHead className="text-right">Kâr/Zarar</TableHead>
                  <TableHead className="text-right">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectFinancials.map((project) => (
                  <TableRow key={project.name}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                      {formatCurrency(project.income)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                      {formatCurrency(project.expense)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(project.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={project.profit >= 0 ? "default" : "destructive"}>
                        {project.profit >= 0 ? "Karlı" : "Zararda"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredTransactions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Seçili dönemde veri bulunamadı</p>
              <p className="text-sm">Farklı bir tarih aralığı seçerek tekrar deneyin</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
