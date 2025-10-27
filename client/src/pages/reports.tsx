import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, Receipt, ClipboardList, FolderKanban, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { type TransactionWithProject, type Project, type Invoice, type Task, type ProgressPayment } from "@shared/schema";
import { calculateTaxSummary } from "@shared/taxCalculations";
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type DateFilter = "all" | "this-month" | "this-year" | "custom";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("financial");
  const [dateFilter, setDateFilter] = useState<DateFilter>("this-year");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  // Advanced multi-level filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<string>("all");
  const [selectedCostGroup, setSelectedCostGroup] = useState<string>("all");

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

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: progressPayments = [], isLoading: paymentsLoading } = useQuery<ProgressPayment[]>({
    queryKey: ["/api/progress-payments"],
  });

  const isLoading = transactionsLoading || projectsLoading || invoicesLoading || tasksLoading || paymentsLoading;

  // Filter transactions by date and advanced filters (project, work group, cost group)
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
        break;
    }

    return transactions.filter((t) => {
      // Date filter
      const transactionDate = new Date(t.date);
      if (startDate && transactionDate < startDate) return false;
      if (endDate && transactionDate > endDate) return false;
      
      // Project filter
      if (selectedProjectId !== "all" && t.projectId !== selectedProjectId) return false;
      
      // Work Group filter (İş Grubu)
      if (selectedWorkGroup !== "all" && t.isGrubu !== selectedWorkGroup) return false;
      
      // Cost Group filter (Rayiç Grubu)
      if (selectedCostGroup !== "all" && t.rayicGrubu !== selectedCostGroup) return false;
      
      return true;
    });
  }, [transactions, dateFilter, customStartDate, customEndDate, selectedProjectId, selectedWorkGroup, selectedCostGroup]);

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

  // Task statistics for operational reports
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "Tamamlandı").length;
    const inProgress = tasks.filter(t => t.status === "Devam Ediyor").length;
    const waiting = tasks.filter(t => t.status === "Bekliyor").length;
    const cancelled = tasks.filter(t => t.status === "İptal").length;

    return {
      total,
      completed,
      inProgress,
      waiting,
      cancelled,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [tasks]);

  // Task by status for chart
  const tasksByStatus = useMemo(() => {
    return [
      { name: "Tamamlandı", value: taskStats.completed, color: "#10b981" },
      { name: "Devam Ediyor", value: taskStats.inProgress, color: "#3b82f6" },
      { name: "Bekliyor", value: taskStats.waiting, color: "#f59e0b" },
      { name: "İptal", value: taskStats.cancelled, color: "#ef4444" },
    ].filter(item => item.value > 0);
  }, [taskStats]);

  // Project completion analysis
  const projectCompletion = useMemo(() => {
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const projectTasks: Record<string, { 
      name: string; 
      total: number; 
      completed: number; 
      completion: number;
      status: string;
    }> = {};

    tasks.forEach(task => {
      const project = projectMap.get(task.projectId);
      if (!project) return;

      if (!projectTasks[task.projectId]) {
        projectTasks[task.projectId] = {
          name: project.name,
          total: 0,
          completed: 0,
          completion: 0,
          status: project.status,
        };
      }

      projectTasks[task.projectId].total += 1;
      if (task.status === "Tamamlandı") {
        projectTasks[task.projectId].completed += 1;
      }
    });

    return Object.values(projectTasks).map(p => ({
      ...p,
      completion: p.total > 0 ? (p.completed / p.total) * 100 : 0,
    })).sort((a, b) => b.completion - a.completion);
  }, [projects, tasks]);

  // Project status distribution
  const projectStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    projects.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [projects]);

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
      <PrintHeader documentTitle="RAPORLAR" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raporlar</h1>
          <p className="text-muted-foreground mt-1">Detaylı analiz ve raporlama</p>
        </div>
        <PrintButton />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-report-type">
          <TabsTrigger value="financial" data-testid="tab-financial">
            <Receipt className="h-4 w-4 mr-2" />
            Mali Raporlar
          </TabsTrigger>
          <TabsTrigger value="operational" data-testid="tab-operational">
            <ClipboardList className="h-4 w-4 mr-2" />
            İşleyiş Raporları
          </TabsTrigger>
          <TabsTrigger value="project" data-testid="tab-project">
            <FolderKanban className="h-4 w-4 mr-2" />
            Proje Raporları
          </TabsTrigger>
          <TabsTrigger value="hakedis" data-testid="tab-hakedis">
            <DollarSign className="h-4 w-4 mr-2" />
            Hakediş Raporları
          </TabsTrigger>
        </TabsList>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="space-y-6">
          {/* Date Filter */}
          <Card className="no-print">
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

          {/* Advanced Multi-Level Filters */}
          <Card className="no-print">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Gelişmiş Filtreler
              </CardTitle>
              <CardDescription>
                Proje, iş grubu ve maliyet grubu bazlı detaylı raporlama
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Proje</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger data-testid="select-project-filter">
                      <SelectValue placeholder="Tüm Projeler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Projeler</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>İş Grubu</Label>
                  <Select value={selectedWorkGroup} onValueChange={setSelectedWorkGroup}>
                    <SelectTrigger data-testid="select-work-group-filter">
                      <SelectValue placeholder="Tüm İş Grupları" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm İş Grupları</SelectItem>
                      <SelectItem value="Kaba İmalat">Kaba İmalat</SelectItem>
                      <SelectItem value="İnce İmalat">İnce İmalat</SelectItem>
                      <SelectItem value="Mekanik Tesisat">Mekanik Tesisat</SelectItem>
                      <SelectItem value="Elektrik Tesisat">Elektrik Tesisat</SelectItem>
                      <SelectItem value="Çevre Düzenlemesi ve Altyapı">Çevre Düzenlemesi ve Altyapı</SelectItem>
                      <SelectItem value="Genel Giderler ve Endirekt Giderler">Genel Giderler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rayiç Grubu</Label>
                  <Select value={selectedCostGroup} onValueChange={setSelectedCostGroup}>
                    <SelectTrigger data-testid="select-cost-group-filter">
                      <SelectValue placeholder="Tüm Maliyet Grupları" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Maliyet Grupları</SelectItem>
                      <SelectItem value="Malzeme">Malzeme</SelectItem>
                      <SelectItem value="İşçilik">İşçilik</SelectItem>
                      <SelectItem value="Makine Ekipman">Makine Ekipman</SelectItem>
                      <SelectItem value="Paket">Paket</SelectItem>
                      <SelectItem value="Genel Giderler ve Endirekt Giderler">Genel Giderler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
        </TabsContent>

        {/* Operational Reports Tab */}
        <TabsContent value="operational" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <>
              {/* Task Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{taskStats.total}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tamamlandı</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      %{taskStats.completionRate.toFixed(1)} tamamlanma
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Devam Ediyor</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bekliyor</CardTitle>
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{taskStats.waiting}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Task Status Distribution */}
              {tasksByStatus.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Görev Durum Dağılımı</CardTitle>
                    <CardDescription>Görevlerin durumlarına göre dağılımı</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={tasksByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {tasksByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Project Task Completion */}
              {projectCompletion.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Proje Bazlı Görev Tamamlanma Oranları</CardTitle>
                    <CardDescription>Her projenin görev tamamlanma durumu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Proje Adı</TableHead>
                          <TableHead className="text-center">Toplam Görev</TableHead>
                          <TableHead className="text-center">Tamamlanan</TableHead>
                          <TableHead>İlerleme</TableHead>
                          <TableHead className="text-right">Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectCompletion.map((project) => (
                          <TableRow key={project.name}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell className="text-center">{project.total}</TableCell>
                            <TableCell className="text-center">{project.completed}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={project.completion} className="flex-1" />
                                <span className="text-sm font-medium min-w-[3rem] text-right">
                                  %{project.completion.toFixed(0)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{project.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {tasks.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Henüz görev bulunmuyor</p>
                      <p className="text-sm">Görev ekleyerek işleyiş raporlarınızı görüntüleyebilirsiniz</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Project Reports Tab */}
        <TabsContent value="project" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-64" />
            </div>
          ) : (
            <>
              {/* Project Status Overview */}
              {projectStatusData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Proje Durum Dağılımı</CardTitle>
                      <CardDescription>Projelerin durumlarına göre dağılımı</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RePieChart>
                          <Pie
                            data={projectStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {projectStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Proje Özet İstatistikleri</CardTitle>
                      <CardDescription>Genel proje bilgileri</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Toplam Proje Sayısı</p>
                        <p className="text-3xl font-bold">{projects.length}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Aktif Projeler</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {projects.filter(p => p.status === "Devam Ediyor").length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Tamamlanan</p>
                          <p className="text-2xl font-bold text-green-600">
                            {projects.filter(p => p.status === "Tamamlandı").length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detailed Project Table */}
              {projects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Proje Detayları</CardTitle>
                    <CardDescription>Tüm projelerin detaylı bilgileri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Proje Adı</TableHead>
                          <TableHead>Lokasyon</TableHead>
                          <TableHead className="text-right">Alan (m²)</TableHead>
                          <TableHead>Başlangıç</TableHead>
                          <TableHead>Bitiş</TableHead>
                          <TableHead className="text-right">Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>{project.location}</TableCell>
                            <TableCell className="text-right font-mono">
                              {project.area ? parseFloat(project.area).toLocaleString('tr-TR') : '-'}
                            </TableCell>
                            <TableCell>
                              {project.startDate 
                                ? new Date(project.startDate).toLocaleDateString('tr-TR')
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              {project.endDate 
                                ? new Date(project.endDate).toLocaleDateString('tr-TR')
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={
                                  project.status === "Tamamlandı" ? "default" :
                                  project.status === "Devam Ediyor" ? "secondary" :
                                  "outline"
                                }
                              >
                                {project.status}
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
              {projects.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderKanban className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Henüz proje bulunmuyor</p>
                      <p className="text-sm">Proje ekleyerek proje raporlarınızı görüntüleyebilirsiniz</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Hakediş Reports Tab */}
        <TabsContent value="hakedis" className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              {/* Filtered Payments */}
              {(() => {
                const filteredPayments = selectedProjectId !== "all" 
                  ? progressPayments.filter(p => p.projectId === selectedProjectId)
                  : progressPayments;
                
                const totalAmount = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);
                const totalGross = filteredPayments.reduce((sum, p) => {
                  const amount = parseFloat(p.amount as string);
                  const feeRate = parseFloat(p.contractorFeeRate as string) || 0;
                  const gross = parseFloat(p.grossAmount as string) || (amount + (amount * feeRate / 100));
                  return sum + gross;
                }, 0);
                const totalAdvanceDeduction = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.advanceDeduction as string) || 0), 0);
                const totalNetPayment = filteredPayments.reduce((sum, p) => {
                  const gross = parseFloat(p.grossAmount as string) || 0;
                  const deduction = parseFloat(p.advanceDeduction as string) || 0;
                  const net = parseFloat(p.netPayment as string) || (gross - deduction);
                  return sum + net;
                }, 0);
                const totalReceived = filteredPayments.reduce((sum, p) => sum + parseFloat(p.receivedAmount as string), 0);
                
                return (
                  <>
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <StatsCard
                        title="Toplam Hakediş"
                        value={`${totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                        icon={Receipt}
                        trend="neutral"
                        data-testid="card-total-hakedis"
                      />
                      <StatsCard
                        title="Brüt Tutar"
                        value={`${totalGross.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                        icon={TrendingUp}
                        trend="neutral"
                        description="Müteahhitlik ücreti dahil"
                        data-testid="card-gross-hakedis"
                      />
                      <StatsCard
                        title="Avans Kesintisi"
                        value={`${totalAdvanceDeduction.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                        icon={TrendingDown}
                        trend="negative"
                        data-testid="card-deduction-hakedis"
                      />
                      <StatsCard
                        title="Net Ödeme"
                        value={`${totalNetPayment.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                        icon={DollarSign}
                        trend="positive"
                        description="Ödenecek tutar"
                        data-testid="card-net-hakedis"
                      />
                      <StatsCard
                        title="Alınan Ödemeler"
                        value={`${totalReceived.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                        icon={CheckCircle2}
                        trend="positive"
                        data-testid="card-received-hakedis"
                      />
                    </div>
                  </>
                );
              })()}

              {/* Status Distribution Chart */}
              {progressPayments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Hakediş Durumu Dağılımı
                    </CardTitle>
                    <CardDescription>Ödeme durumlarına göre hakediş sayıları</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={[
                            { name: 'Bekliyor', value: progressPayments.filter(p => p.status === 'Bekliyor').length },
                            { name: 'Kısmi Ödendi', value: progressPayments.filter(p => p.status === 'Kısmi Ödendi').length },
                            { name: 'Ödendi', value: progressPayments.filter(p => p.status === 'Ödendi').length }
                          ].filter(item => item.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {[
                            { name: 'Bekliyor', color: 'hsl(var(--chart-3))' },
                            { name: 'Kısmi Ödendi', color: 'hsl(var(--chart-2))' },
                            { name: 'Ödendi', color: 'hsl(var(--chart-1))' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Payments by Project */}
              {progressPayments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5" />
                      Projelere Göre Hakediş Özeti
                    </CardTitle>
                    <CardDescription>Her projenin toplam hakediş tutarları ve ödeme durumu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Proje Adı</TableHead>
                          <TableHead className="text-right">Hakediş Sayısı</TableHead>
                          <TableHead className="text-right">Toplam Tutar</TableHead>
                          <TableHead className="text-right">Alınan</TableHead>
                          <TableHead className="text-right">Kalan</TableHead>
                          <TableHead className="text-right">Tamamlanma</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects
                          .filter(project => progressPayments.some(p => p.projectId === project.id))
                          .map(project => {
                            const projectPayments = progressPayments.filter(p => p.projectId === project.id);
                            const totalAmount = projectPayments.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);
                            const totalReceived = projectPayments.reduce((sum, p) => sum + parseFloat(p.receivedAmount as string), 0);
                            const remaining = totalAmount - totalReceived;
                            const completionRate = totalAmount > 0 ? (totalReceived / totalAmount) * 100 : 0;

                            return (
                              <TableRow key={project.id}>
                                <TableCell className="font-medium">{project.name}</TableCell>
                                <TableCell className="text-right">{projectPayments.length}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {totalReceived.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {remaining.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center gap-2">
                                    <Progress value={completionRate} className="h-2 flex-1" />
                                    <span className="text-sm text-muted-foreground w-12">
                                      {completionRate.toFixed(0)}%
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {progressPayments.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Henüz hakediş bulunmuyor</p>
                      <p className="text-sm">Hakediş ekleyerek ödeme raporlarınızı görüntüleyebilirsiniz</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
