import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PrintButton } from "@/components/print-button";
import { PrintHeader } from "@/components/print-header";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, Receipt, ClipboardList, FolderKanban, CheckCircle2, Clock, XCircle, AlertCircle, Filter, Users, HardHat, Cloud, Sun, CloudRain, Snowflake, CloudFog, Wallet, Target, Download } from "lucide-react";
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
import { type TransactionWithProject, type Project, type Invoice, type Task, type ProgressPayment, type Timesheet, type SiteDiary, type Subcontractor, type BudgetItem, type PaymentPlan } from "@shared/schema";
import { calculateTaxSummary } from "@shared/taxCalculations";
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExportToExcel } from "@/components/export-to-excel";

type DateFilter = "all" | "this-month" | "this-year" | "custom";

// Safe number parsing helper - returns 0 for invalid/missing values
const safeNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Normalize weather text for consistent grouping
const normalizeWeather = (weather: string | null | undefined): string => {
  if (!weather) return "Belirtilmedi";
  const normalized = weather.trim().toLowerCase();
  if (normalized.includes('güneş')) return "Güneşli";
  if (normalized.includes('bulut')) return "Bulutlu";
  if (normalized.includes('yağmur')) return "Yağmurlu";
  if (normalized.includes('kar')) return "Karlı";
  if (normalized.includes('parça')) return "Parçalı Bulutlu";
  if (normalized.includes('sisli') || normalized.includes('sis')) return "Sisli";
  return weather.trim();
};

export default function Reports() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("financial");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  // Advanced multi-level filters - default to "all" (Tüm Projeler)
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

  const { data: timesheets = [], isLoading: timesheetsLoading } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets"],
  });

  const { data: siteDiaryEntries = [], isLoading: siteDiaryLoading } = useQuery<SiteDiary[]>({
    queryKey: ["/api/site-diary"],
  });

  const { data: subcontractors = [], isLoading: subcontractorsLoading } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors"],
  });

  const { data: budgetItems = [], isLoading: budgetLoading } = useQuery<BudgetItem[]>({
    queryKey: ["/api/budget-items"],
  });

  const { data: paymentPlans = [], isLoading: paymentPlansLoading } = useQuery<PaymentPlan[]>({
    queryKey: ["/api/payment-plans"],
  });

  const isLoading = transactionsLoading || projectsLoading || invoicesLoading || tasksLoading || paymentsLoading || timesheetsLoading || siteDiaryLoading || subcontractorsLoading || budgetLoading || paymentPlansLoading;

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
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === "Gider")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

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
      .reduce((sum, inv) => sum + safeNumber(inv.taxAmount), 0);

    // Calculate tax summary - prepare transaction arrays with hasKDV flag
    const incomeArray = filteredTransactions
      .filter((t) => t.type === "Gelir")
      .map((t) => ({ amount: safeNumber(t.amount), hasKDV: true }));
    
    const expenseArray = filteredTransactions
      .filter((t) => t.type === "Gider")
      .map((t) => ({ amount: safeNumber(t.amount), hasKDV: true }));

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

  // Calculate cash flow projections
  const cashflowData = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const months: { month: string; planned: number; actual: number; net: number }[] = [];
    
    // Get next 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      const isPastMonth = monthEnd < currentMonthStart;
      const isCurrentMonth = monthStart <= now && monthEnd >= now;
      const isFutureMonth = monthStart > now;
      
      // For past and current months, use actual transactions
      let actualNet = 0;
      if (isPastMonth || isCurrentMonth) {
        const actualIncome = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'Gelir' && tDate >= monthStart && tDate <= monthEnd;
          })
          .reduce((sum, t) => sum + safeNumber(t.amount), 0);
        
        const actualExpense = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'Gider' && tDate >= monthStart && tDate <= monthEnd;
          })
          .reduce((sum, t) => sum + safeNumber(t.amount), 0);
        
        actualNet = actualIncome - actualExpense;
      }
      
      // For future months, use pending payment plans only
      let plannedNet = 0;
      if (isFutureMonth) {
        const plannedIncome = paymentPlans
          .filter(p => {
            const planDate = new Date(p.plannedDate);
            return p.type === 'Gelir' && p.status === 'Bekliyor' && planDate >= monthStart && planDate <= monthEnd;
          })
          .reduce((sum, p) => sum + safeNumber(p.plannedAmount), 0);
        
        const plannedExpense = paymentPlans
          .filter(p => {
            const planDate = new Date(p.plannedDate);
            return p.type === 'Gider' && p.status === 'Bekliyor' && planDate >= monthStart && planDate <= monthEnd;
          })
          .reduce((sum, p) => sum + safeNumber(p.plannedAmount), 0);
        
        plannedNet = plannedIncome - plannedExpense;
      }
      
      months.push({
        month: monthKey,
        planned: plannedNet,
        actual: actualNet,
        net: isFutureMonth ? plannedNet : actualNet,
      });
    }
    
    // Calculate cumulative balance starting from current balance
    let runningBalance = financialSummary.netProfit;
    const cumulativeMonths = months.map((m, idx) => {
      // For first month (current), don't add - it's already in the current balance
      if (idx > 0) {
        runningBalance += m.net;
      }
      return { ...m, cumulative: runningBalance };
    });
    
    // Payment plan summaries - only pending
    const pendingPayments = paymentPlans.filter(p => p.status === 'Bekliyor');
    const overduePayments = paymentPlans.filter(p => {
      const dueDate = new Date(p.plannedDate);
      return p.status === 'Bekliyor' && dueDate < now;
    });
    
    const totalPlannedIncome = paymentPlans
      .filter(p => p.type === 'Gelir' && p.status === 'Bekliyor')
      .reduce((sum, p) => sum + safeNumber(p.plannedAmount), 0);
    
    const totalPlannedExpense = paymentPlans
      .filter(p => p.type === 'Gider' && p.status === 'Bekliyor')
      .reduce((sum, p) => sum + safeNumber(p.plannedAmount), 0);
    
    return {
      months: cumulativeMonths,
      pendingPayments,
      overduePayments,
      totalPlannedIncome,
      totalPlannedExpense,
      currentBalance: financialSummary.netProfit,
      projectedBalance: runningBalance,
    };
  }, [transactions, paymentPlans, financialSummary.netProfit]);

  // Group by work category (İş Grubu)
  const workGroupData = useMemo(() => {
    const groups: Record<string, number> = {};
    
    filteredTransactions
      .filter((t) => t.type === "Gider" && t.isGrubu)
      .forEach((t) => {
        const key = t.isGrubu!;
        groups[key] = (groups[key] || 0) + safeNumber(t.amount);
      });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Group by cost category (Rayiç Grubu)
  const costGroupData = useMemo(() => {
    const groups: Record<string, number> = {};
    
    filteredTransactions
      .filter((t) => t.type === "Gider" && t.rayicGrubu)
      .forEach((t) => {
        const key = t.rayicGrubu!;
        groups[key] = (groups[key] || 0) + safeNumber(t.amount);
      });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Project financial analysis
  const projectFinancials = useMemo(() => {
    const projectMap: Record<string, {
      projectId: string;
      name: string;
      income: number;
      expense: number;
      profit: number;
    }> = {};

    filteredTransactions.forEach((t) => {
      if (!projectMap[t.projectId]) {
        projectMap[t.projectId] = {
          projectId: t.projectId,
          name: t.projectName,
          income: 0,
          expense: 0,
          profit: 0,
        };
      }

      if (t.type === "Gelir") {
        projectMap[t.projectId].income += safeNumber(t.amount);
      } else {
        projectMap[t.projectId].expense += safeNumber(t.amount);
      }
    });

    return Object.entries(projectMap).map(([id, p]) => ({
      ...p,
      projectId: id,
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
        months[monthKey].income += safeNumber(t.amount);
      } else {
        months[monthKey].expense += safeNumber(t.amount);
      }
    });

    // Sort by monthKey (YYYY-MM) for proper chronological order
    return Object.values(months).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredTransactions]);

  // Task statistics for operational reports - filtered by project
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === "all") return tasks;
    return tasks.filter(t => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const taskStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === "Tamamlandı").length;
    const inProgress = filteredTasks.filter(t => t.status === "Devam Ediyor").length;
    const waiting = filteredTasks.filter(t => t.status === "Bekliyor").length;
    const cancelled = filteredTasks.filter(t => t.status === "İptal").length;

    return {
      total,
      completed,
      inProgress,
      waiting,
      cancelled,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [filteredTasks]);

  // Task by status for chart
  const tasksByStatus = useMemo(() => {
    return [
      { name: "Tamamlandı", value: taskStats.completed, color: "#10b981" },
      { name: "Devam Ediyor", value: taskStats.inProgress, color: "#3b82f6" },
      { name: "Bekliyor", value: taskStats.waiting, color: "#f59e0b" },
      { name: "İptal", value: taskStats.cancelled, color: "#ef4444" },
    ].filter(item => item.value > 0);
  }, [taskStats]);

  // Project completion analysis - filtered by project
  const projectCompletion = useMemo(() => {
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const projectTasksMap: Record<string, { 
      projectId: string;
      name: string; 
      total: number; 
      completed: number; 
      completion: number;
      status: string;
    }> = {};

    filteredTasks.forEach(task => {
      if (!task.projectId) return;
      const project = projectMap.get(task.projectId);
      if (!project) return;

      if (!projectTasksMap[task.projectId]) {
        projectTasksMap[task.projectId] = {
          projectId: task.projectId,
          name: project.name,
          total: 0,
          completed: 0,
          completion: 0,
          status: project.status,
        };
      }

      projectTasksMap[task.projectId].total += 1;
      if (task.status === "Tamamlandı") {
        projectTasksMap[task.projectId].completed += 1;
      }
    });

    return Object.values(projectTasksMap).map(p => ({
      ...p,
      completion: p.total > 0 ? (p.completed / p.total) * 100 : 0,
    })).sort((a, b) => b.completion - a.completion);
  }, [projects, filteredTasks]);

  // Filtered projects for project reports tab
  const filteredProjects = useMemo(() => {
    if (selectedProjectId === "all") return projects;
    return projects.filter(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Project status distribution - filtered by project
  const projectStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredProjects]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Kurumsal renk paleti
  const CORPORATE_COLORS = {
    primary: '#2563eb',    // Mavi
    secondary: '#0891b2',  // Turkuaz
    success: '#16a34a',    // Yeşil
    warning: '#d97706',    // Turuncu
    danger: '#dc2626',     // Kırmızı
    purple: '#7c3aed',     // Mor
    pink: '#db2777',       // Pembe
    gray: '#6b7280',       // Gri
  };
  const COLORS = [
    CORPORATE_COLORS.primary, 
    CORPORATE_COLORS.success, 
    CORPORATE_COLORS.warning, 
    CORPORATE_COLORS.secondary, 
    CORPORATE_COLORS.purple, 
    CORPORATE_COLORS.pink
  ];

  // Puantaj (Timesheet) Statistics - filtered by date and project
  const filteredTimesheets = useMemo(() => {
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
    }

    return timesheets.filter((t) => {
      const timesheetDate = new Date(t.date);
      if (startDate && timesheetDate < startDate) return false;
      if (endDate && timesheetDate > endDate) return false;
      if (selectedProjectId !== "all" && t.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [timesheets, dateFilter, customStartDate, customEndDate, selectedProjectId]);

  const timesheetStats = useMemo(() => {
    const totalWorkers = filteredTimesheets.reduce((sum, t) => sum + safeNumber(t.workerCount), 0);
    const totalHours = filteredTimesheets.reduce((sum, t) => sum + safeNumber(t.hours), 0);
    const uniqueDays = new Set(filteredTimesheets.map(t => t.date)).size;
    const avgWorkersPerDay = uniqueDays > 0 ? totalWorkers / uniqueDays : 0;
    
    // Group by project
    const projectMap = new Map(projects.map(p => [p.id, p.name]));
    const byProject: Record<string, { projectId: string; name: string; workers: number; hours: number }> = {};
    
    filteredTimesheets.forEach(t => {
      if (!byProject[t.projectId]) {
        byProject[t.projectId] = {
          projectId: t.projectId,
          name: projectMap.get(t.projectId) || "Bilinmeyen Proje",
          workers: 0,
          hours: 0,
        };
      }
      byProject[t.projectId].workers += safeNumber(t.workerCount);
      byProject[t.projectId].hours += safeNumber(t.hours);
    });

    // Group by İş Grubu
    const byWorkGroup: Record<string, number> = {};
    filteredTimesheets.forEach(t => {
      byWorkGroup[t.isGrubu] = (byWorkGroup[t.isGrubu] || 0) + safeNumber(t.workerCount);
    });

    return {
      totalWorkers,
      totalHours,
      uniqueDays,
      avgWorkersPerDay,
      byProject: Object.values(byProject).sort((a, b) => b.workers - a.workers),
      byWorkGroup: Object.entries(byWorkGroup)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };
  }, [filteredTimesheets, projects]);

  // Şantiye Defteri Statistics - filtered by date and project
  const filteredSiteDiary = useMemo(() => {
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
    }

    return siteDiaryEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;
      if (selectedProjectId !== "all" && entry.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [siteDiaryEntries, dateFilter, customStartDate, customEndDate, selectedProjectId]);

  const siteDiaryStats = useMemo(() => {
    const totalEntries = filteredSiteDiary.length;
    const totalWorkers = filteredSiteDiary.reduce((sum, e) => sum + safeNumber(e.totalWorkers), 0);
    const entriesWithIssues = filteredSiteDiary.filter(e => e.issues && e.issues.trim().length > 0).length;
    const entriesWithPhotos = filteredSiteDiary.filter(e => e.photos && e.photos.length > 0).length;
    
    // Weather distribution - normalized for consistent grouping
    const weatherCounts: Record<string, number> = {};
    filteredSiteDiary.forEach(e => {
      const weather = normalizeWeather(e.weather);
      weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
    });
    
    // By project
    const projectMap = new Map(projects.map(p => [p.id, p.name]));
    const byProject: Record<string, { projectId: string; name: string; entries: number; workers: number }> = {};
    
    filteredSiteDiary.forEach(e => {
      if (!byProject[e.projectId]) {
        byProject[e.projectId] = {
          projectId: e.projectId,
          name: projectMap.get(e.projectId) || "Bilinmeyen Proje",
          entries: 0,
          workers: 0,
        };
      }
      byProject[e.projectId].entries += 1;
      byProject[e.projectId].workers += safeNumber(e.totalWorkers);
    });

    return {
      totalEntries,
      totalWorkers,
      entriesWithIssues,
      entriesWithPhotos,
      weatherData: Object.entries(weatherCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      byProject: Object.values(byProject).sort((a, b) => b.entries - a.entries),
    };
  }, [filteredSiteDiary, projects]);

  // Taşeron Performance Statistics - Puantaj verilerinden
  const subcontractorStats = useMemo(() => {
    const projectMap = new Map(projects.map(p => [p.id, p.name]));
    
    // Puantaj verileriyle taşeron performansı
    const subcontractorWork: Record<string, {
      subcontractorId: string;
      name: string;
      totalWorkers: number;
      totalHours: number;
      workDays: number;
      projects: Set<string>;
    }> = {};

    filteredTimesheets.forEach(timesheet => {
      // Taşeron ID'si olmayan kayıtları atla
      if (!timesheet.subcontractorId) return;
      
      const subcontractor = subcontractors.find(s => s.id === timesheet.subcontractorId);
      if (!subcontractor) return;

      if (!subcontractorWork[timesheet.subcontractorId]) {
        subcontractorWork[timesheet.subcontractorId] = {
          subcontractorId: timesheet.subcontractorId,
          name: subcontractor.name,
          totalWorkers: 0,
          totalHours: 0,
          workDays: 0,
          projects: new Set(),
        };
      }

      subcontractorWork[timesheet.subcontractorId].totalWorkers += safeNumber(timesheet.workerCount);
      subcontractorWork[timesheet.subcontractorId].totalHours += safeNumber(timesheet.hours);
      subcontractorWork[timesheet.subcontractorId].workDays += 1;
      subcontractorWork[timesheet.subcontractorId].projects.add(timesheet.projectId);
    });

    const performanceData = Object.values(subcontractorWork).map(s => ({
      ...s,
      projectCount: s.projects.size,
      avgWorkersPerDay: s.workDays > 0 ? s.totalWorkers / s.workDays : 0,
    })).sort((a, b) => b.totalWorkers - a.totalWorkers);

    // Taşeron türü dağılımı
    const typeCount: Record<string, number> = {};
    subcontractors.forEach(s => {
      const type = s.type || "Taşeron";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return {
      totalSubcontractors: subcontractors.length,
      totalSuppliers: subcontractors.filter(s => s.type === "Tedarikçi").length,
      totalTaseronlar: subcontractors.filter(s => s.type !== "Tedarikçi").length,
      performanceData,
      typeData: Object.entries(typeCount).map(([name, value]) => ({ name, value })),
    };
  }, [subcontractors, filteredTimesheets, projects]);

  // Bütçe vs Gerçekleşen Karşılaştırması
  const budgetAnalysis = useMemo(() => {
    const filteredBudget = selectedProjectId !== "all" 
      ? budgetItems.filter(b => b.projectId === selectedProjectId)
      : budgetItems;
    
    const projectMap = new Map(projects.map(p => [p.id, p.name]));
    
    // Proje bazlı bütçe analizi
    const byProject: Record<string, {
      projectId: string;
      name: string;
      plannedBudget: number;
      actualSpent: number;
      variance: number;
      variancePercent: number;
    }> = {};

    filteredBudget.forEach(item => {
      const plannedAmount = safeNumber(item.quantity) * safeNumber(item.unitPrice);
      const actualQty = safeNumber(item.actualQuantity);
      const actualPrice = safeNumber(item.actualUnitPrice) || safeNumber(item.unitPrice);
      const actualAmount = actualQty * actualPrice;

      if (!byProject[item.projectId]) {
        byProject[item.projectId] = {
          projectId: item.projectId,
          name: projectMap.get(item.projectId) || "Bilinmeyen Proje",
          plannedBudget: 0,
          actualSpent: 0,
          variance: 0,
          variancePercent: 0,
        };
      }

      byProject[item.projectId].plannedBudget += plannedAmount;
      byProject[item.projectId].actualSpent += actualAmount;
    });

    // Sapma hesaplama
    Object.values(byProject).forEach(p => {
      p.variance = p.plannedBudget - p.actualSpent;
      p.variancePercent = p.plannedBudget > 0 ? ((p.plannedBudget - p.actualSpent) / p.plannedBudget) * 100 : 0;
    });

    const totalPlanned = Object.values(byProject).reduce((sum, p) => sum + p.plannedBudget, 0);
    const totalActual = Object.values(byProject).reduce((sum, p) => sum + p.actualSpent, 0);
    const totalVariance = totalPlanned - totalActual;

    // İş grubu bazlı analiz
    const byWorkGroup: Record<string, { planned: number; actual: number }> = {};
    filteredBudget.forEach(item => {
      const planned = safeNumber(item.quantity) * safeNumber(item.unitPrice);
      const actualQty = safeNumber(item.actualQuantity);
      const actualPrice = safeNumber(item.actualUnitPrice) || safeNumber(item.unitPrice);
      const actual = actualQty * actualPrice;

      if (!byWorkGroup[item.isGrubu]) {
        byWorkGroup[item.isGrubu] = { planned: 0, actual: 0 };
      }
      byWorkGroup[item.isGrubu].planned += planned;
      byWorkGroup[item.isGrubu].actual += actual;
    });

    return {
      totalPlanned,
      totalActual,
      totalVariance,
      variancePercent: totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0,
      byProject: Object.values(byProject).sort((a, b) => b.plannedBudget - a.plannedBudget),
      byWorkGroup: Object.entries(byWorkGroup)
        .map(([name, data]) => ({ 
          name, 
          planned: data.planned, 
          actual: data.actual,
          variance: data.planned - data.actual,
        }))
        .sort((a, b) => b.planned - a.planned),
      itemCount: filteredBudget.length,
    };
  }, [budgetItems, projects, selectedProjectId]);

  // Get selected project name for display
  const selectedProjectName = selectedProjectId !== "all" 
    ? projects.find(p => p.id === selectedProjectId)?.name || "Seçili Proje"
    : "Tüm Projeler";

  // Excel Export Data Formatters
  const financialExportData = useMemo(() => {
    return projectFinancials.map(p => ({
      "Proje Adı": p.name,
      "Gelir (TL)": p.income.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
      "Gider (TL)": p.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
      "Kâr/Zarar (TL)": p.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
      "Durum": p.profit >= 0 ? "Karlı" : "Zararda",
    }));
  }, [projectFinancials]);

  const timesheetExportData = useMemo(() => {
    return timesheetStats.byProject.map(p => ({
      "Proje Adı": p.name,
      "Toplam İşçi-Gün": p.workers.toLocaleString('tr-TR'),
      "Toplam Çalışma Saati": p.hours.toLocaleString('tr-TR', { maximumFractionDigits: 1 }),
    }));
  }, [timesheetStats.byProject]);

  const siteDiaryExportData = useMemo(() => {
    return siteDiaryStats.byProject.map(p => ({
      "Proje Adı": p.name,
      "Kayıt Sayısı": p.entries,
      "Toplam İşçi": p.workers.toLocaleString('tr-TR'),
      "Ortalama İşçi/Gün": p.entries > 0 ? (p.workers / p.entries).toFixed(1) : '-',
    }));
  }, [siteDiaryStats.byProject]);

  const subcontractorExportData = useMemo(() => {
    return subcontractorStats.performanceData.map(s => ({
      "Taşeron Adı": s.name,
      "Proje Sayısı": s.projectCount,
      "Çalışma Günü": s.workDays,
      "Toplam İşçi-Gün": s.totalWorkers.toLocaleString('tr-TR'),
      "Ortalama İşçi/Gün": s.avgWorkersPerDay.toFixed(1),
    }));
  }, [subcontractorStats.performanceData]);

  const budgetExportData = useMemo(() => {
    return budgetAnalysis.byWorkGroup.map(g => ({
      "İş Grubu": g.name,
      "Planlanan (TL)": g.planned.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
      "Gerçekleşen (TL)": g.actual.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
      "Sapma (TL)": g.variance.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
      "Durum": g.variance >= 0 ? "Bütçe Altı" : "Bütçe Aşımı",
    }));
  }, [budgetAnalysis.byWorkGroup]);

  const projectExportData = useMemo(() => {
    return filteredProjects.map(p => ({
      "Proje Adı": p.name,
      "Lokasyon": p.location || '-',
      "Alan (m²)": p.area ? safeNumber(p.area).toLocaleString('tr-TR') : '-',
      "Başlangıç": p.startDate ? new Date(p.startDate).toLocaleDateString('tr-TR') : '-',
      "Bitiş": p.endDate ? new Date(p.endDate).toLocaleDateString('tr-TR') : '-',
      "Durum": p.status,
    }));
  }, [filteredProjects]);

  const taskExportData = useMemo(() => {
    return projectCompletion.map(p => ({
      "Proje Adı": p.name,
      "Toplam Görev": p.total,
      "Tamamlanan": p.completed,
      "Tamamlanma (%)": p.completion.toFixed(0) + '%',
      "Proje Durumu": p.status,
    }));
  }, [projectCompletion]);

  return (
    <div className="responsive-container responsive-spacing">
      <PrintHeader documentTitle="RAPORLAR" />
      
      <div className="responsive-header">
        <div>
          <h1 className="responsive-header-title">Raporlar</h1>
          <p className="text-muted-foreground text-sm mt-1">Detaylı analiz ve raporlama</p>
          {selectedProjectId !== "all" && (
            <p className="text-sm text-primary mt-1">Aktif Filtre: {selectedProjectName}</p>
          )}
        </div>
        <div className="responsive-actions">
          <PrintButton />
        </div>
      </div>

      {/* Global Filters - Applied to all report tabs */}
      <Card className="no-print">
        <CardHeader className="responsive-card-padding">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filtreler
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Tüm raporlar için geçerli filtreler
          </CardDescription>
        </CardHeader>
        <CardContent className="responsive-card-padding pt-0">
          <div className="responsive-filter-bar">
            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <Label className="text-xs sm:text-sm">Proje</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger data-testid="select-project-filter" className="w-full">
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
            <div className="w-full sm:w-auto sm:min-w-[120px]">
              <Label className="text-xs sm:text-sm">Dönem</Label>
              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                <SelectTrigger data-testid="select-date-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Zamanlar</SelectItem>
                  <SelectItem value="this-month">Bu Ay</SelectItem>
                  <SelectItem value="this-year">Bu Yıl</SelectItem>
                  <SelectItem value="custom">Özel Tarih</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[130px]">
              <Label className="text-xs sm:text-sm">İş Grubu</Label>
              <Select value={selectedWorkGroup} onValueChange={setSelectedWorkGroup}>
                <SelectTrigger data-testid="select-work-group-filter" className="w-full">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Gruplar</SelectItem>
                  <SelectItem value="Kaba İmalat">Kaba İmalat</SelectItem>
                  <SelectItem value="İnce İmalat">İnce İmalat</SelectItem>
                  <SelectItem value="Mekanik Tesisat">Mekanik</SelectItem>
                  <SelectItem value="Elektrik Tesisat">Elektrik</SelectItem>
                  <SelectItem value="Çevre Düzenlemesi ve Altyapı">Çevre</SelectItem>
                  <SelectItem value="Genel Giderler ve Endirekt Giderler">Genel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[130px]">
              <Label className="text-xs sm:text-sm">Rayiç Grubu</Label>
              <Select value={selectedCostGroup} onValueChange={setSelectedCostGroup}>
                <SelectTrigger data-testid="select-cost-group-filter" className="w-full">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Maliyetler</SelectItem>
                  <SelectItem value="Malzeme">Malzeme</SelectItem>
                  <SelectItem value="İşçilik">İşçilik</SelectItem>
                  <SelectItem value="Makine Ekipman">Makine</SelectItem>
                  <SelectItem value="Paket">Paket</SelectItem>
                  <SelectItem value="Genel Giderler ve Endirekt Giderler">Genel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {dateFilter === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="responsive-spacing">
        <div className="responsive-tabs overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5" data-testid="tabs-report-type">
            <TabsTrigger value="financial" data-testid="tab-financial" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Mali Raporlar</span>
              <span className="sm:hidden">Mali</span>
            </TabsTrigger>
            <TabsTrigger value="cashflow" data-testid="tab-cashflow" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Nakit Akış</span>
              <span className="sm:hidden">Nakit</span>
            </TabsTrigger>
            <TabsTrigger value="operational" data-testid="tab-operational" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">İşleyiş</span>
              <span className="sm:hidden">İşleyiş</span>
            </TabsTrigger>
            <TabsTrigger value="project" data-testid="tab-project" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              <FolderKanban className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Proje</span>
              <span className="sm:hidden">Proje</span>
            </TabsTrigger>
            <TabsTrigger value="hakedis" data-testid="tab-hakedis" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Hakediş</span>
              <span className="sm:hidden">Hakediş</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="responsive-spacing">
          {/* Financial Summary */}
          {isLoading ? (
            <div className="responsive-summary-grid">
              <Skeleton className="h-24 sm:h-32" />
              <Skeleton className="h-24 sm:h-32" />
              <Skeleton className="h-24 sm:h-32" />
            </div>
          ) : (
            <div className="responsive-summary-grid">
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
              <CardHeader className="responsive-card-padding">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                  Vergi Özeti
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Vergi yükümlülükleri
                </CardDescription>
              </CardHeader>
              <CardContent className="responsive-card-padding pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Toplam KDV</p>
                    <p className="responsive-card-value">{formatCurrency(financialSummary.totalKDV)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Kurumlar Vergisi</p>
                    <p className="responsive-card-value">{formatCurrency(financialSummary.taxSummary.corporateTax)}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">%25 oran</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Net Kar (Sonrası)</p>
                    <p className="responsive-card-value">{formatCurrency(financialSummary.taxSummary.netProfit)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Toplam Vergi</p>
                    <p className="responsive-card-value">{formatCurrency(financialSummary.taxSummary.totalTaxBurden)}</p>
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
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>
                    Proje Bazlı Finansal Analiz
                    {selectedProjectId !== "all" && (
                      <span className="text-primary ml-2">- {selectedProjectName}</span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {selectedProjectId !== "all" 
                      ? `${selectedProjectName} projesinin gelir, gider ve kâr durumu`
                      : "Her projenin gelir, gider ve kâr durumu"
                    }
                  </CardDescription>
                </div>
                <ExportToExcel 
                  data={financialExportData} 
                  filename="finansal_analiz" 
                  sheetName="Finansal Analiz"
                  documentTitle="PROJE BAZLI FİNANSAL ANALİZ"
                  testId="button-export-financial-excel"
                />
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
                      <TableRow 
                        key={project.projectId}
                        className="cursor-pointer"
                        onClick={() => setLocation(`/projeler/${project.projectId}`)}
                        data-testid={`row-project-financial-${project.projectId}`}
                      >
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
                <StatsCard
                  title="Toplam Görev"
                  value={taskStats.total}
                  icon={ClipboardList}
                />
                <StatsCard
                  title="Tamamlandı"
                  value={taskStats.completed}
                  icon={CheckCircle2}
                  description={`%${taskStats.completionRate.toFixed(1)} tamamlanma`}
                />
                <StatsCard
                  title="Devam Ediyor"
                  value={taskStats.inProgress}
                  icon={Clock}
                />
                <StatsCard
                  title="Bekliyor"
                  value={taskStats.waiting}
                  icon={AlertCircle}
                />
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
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Proje Bazlı Görev Tamamlanma Oranları</CardTitle>
                      <CardDescription>Her projenin görev tamamlanma durumu</CardDescription>
                    </div>
                    <ExportToExcel 
                      data={taskExportData} 
                      filename="gorev_tamamlanma" 
                      sheetName="Görev Analizi"
                      documentTitle="PROJE BAZLI GÖREV TAMAMLANMA ORANLARI"
                      testId="button-export-tasks-excel"
                    />
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
                          <TableRow 
                            key={project.projectId}
                            className="cursor-pointer"
                            onClick={() => setLocation(`/is-programi?projectId=${project.projectId}`)}
                            data-testid={`row-project-completion-${project.projectId}`}
                          >
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

              {/* Puantaj (Timesheet) Statistics Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard
                  title="Toplam İşçi-Gün"
                  value={timesheetStats.totalWorkers.toLocaleString('tr-TR')}
                  icon={Users}
                  description="Toplam işçi sayısı"
                />
                <StatsCard
                  title="Toplam Çalışma Saati"
                  value={timesheetStats.totalHours.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
                  icon={Clock}
                  description="Saat"
                />
                <StatsCard
                  title="Çalışılan Gün"
                  value={timesheetStats.uniqueDays}
                  icon={Calendar}
                />
                <StatsCard
                  title="Günlük Ort. İşçi"
                  value={timesheetStats.avgWorkersPerDay.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
                  icon={HardHat}
                />
              </div>

              {/* Timesheet by Project */}
              {timesheetStats.byProject.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Proje Bazlı İşçilik Dağılımı</CardTitle>
                      <CardDescription>Projelere göre işçi ve çalışma saati dağılımı</CardDescription>
                    </div>
                    <ExportToExcel 
                      data={timesheetExportData} 
                      filename="iscilik_dagilimi" 
                      sheetName="İşçilik"
                      documentTitle="PROJE BAZLI İŞÇİLİK DAĞILIMI"
                      testId="button-export-timesheet-excel"
                    />
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timesheetStats.byProject.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            value.toLocaleString('tr-TR'),
                            name === 'workers' ? 'İşçi-Gün' : 'Çalışma Saati'
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="workers" name="İşçi-Gün" fill={CORPORATE_COLORS.primary} />
                        <Bar dataKey="hours" name="Çalışma Saati" fill={CORPORATE_COLORS.secondary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Timesheet by Work Group */}
              {timesheetStats.byWorkGroup.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>İş Grubu Bazlı İşçilik</CardTitle>
                    <CardDescription>İş gruplarına göre işçi dağılımı</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={timesheetStats.byWorkGroup}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {timesheetStats.byWorkGroup.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => value.toLocaleString('tr-TR')} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Şantiye Defteri Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard
                  title="Şantiye Girişi"
                  value={siteDiaryStats.totalEntries}
                  icon={FileText}
                  description="Toplam kayıt"
                />
                <StatsCard
                  title="Toplam İşçi"
                  value={siteDiaryStats.totalWorkers.toLocaleString('tr-TR')}
                  icon={Users}
                  description="Defterden"
                />
                <StatsCard
                  title="Sorun Bildirimi"
                  value={siteDiaryStats.entriesWithIssues}
                  icon={AlertCircle}
                  description="Sorun içeren kayıt"
                />
                <StatsCard
                  title="Fotoğraflı Kayıt"
                  value={siteDiaryStats.entriesWithPhotos}
                  icon={Calendar}
                  description="Fotoğraf içeren"
                />
              </div>

              {/* Weather Distribution */}
              {siteDiaryStats.weatherData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Hava Durumu Dağılımı</CardTitle>
                    <CardDescription>Şantiye günlerinin hava durumuna göre dağılımı</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={siteDiaryStats.weatherData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {siteDiaryStats.weatherData.map((entry, index) => {
                            let color = COLORS[index % COLORS.length];
                            if (entry.name.toLowerCase().includes('güneşli')) color = CORPORATE_COLORS.warning;
                            if (entry.name.toLowerCase().includes('yağmur')) color = CORPORATE_COLORS.primary;
                            if (entry.name.toLowerCase().includes('kar')) color = '#94a3b8';
                            if (entry.name.toLowerCase().includes('bulut')) color = CORPORATE_COLORS.gray;
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Site Diary by Project */}
              {siteDiaryStats.byProject.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Proje Bazlı Şantiye Defteri</CardTitle>
                      <CardDescription>Projelere göre şantiye defteri kayıtları</CardDescription>
                    </div>
                    <ExportToExcel 
                      data={siteDiaryExportData} 
                      filename="santiye_defteri" 
                      sheetName="Şantiye Defteri"
                      documentTitle="PROJE BAZLI ŞANTİYE DEFTERİ ANALİZİ"
                      testId="button-export-sitediary-excel"
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Proje Adı</TableHead>
                          <TableHead className="text-center">Kayıt Sayısı</TableHead>
                          <TableHead className="text-center">Toplam İşçi</TableHead>
                          <TableHead className="text-right">Ort. İşçi/Gün</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {siteDiaryStats.byProject.map((project) => (
                          <TableRow 
                            key={project.projectId}
                            className="cursor-pointer"
                            onClick={() => setLocation(`/santiye-defteri?projectId=${project.projectId}`)}
                            data-testid={`row-sitediary-project-${project.projectId}`}
                          >
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell className="text-center">{project.entries}</TableCell>
                            <TableCell className="text-center">{project.workers.toLocaleString('tr-TR')}</TableCell>
                            <TableCell className="text-right font-mono">
                              {project.entries > 0 ? (project.workers / project.entries).toFixed(1) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Taşeron/Tedarikçi Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="Toplam Taşeron/Tedarikçi"
                  value={subcontractorStats.totalSubcontractors}
                  icon={HardHat}
                />
                <StatsCard
                  title="Taşeronlar"
                  value={subcontractorStats.totalTaseronlar}
                  icon={Users}
                />
                <StatsCard
                  title="Tedarikçiler"
                  value={subcontractorStats.totalSuppliers}
                  icon={Wallet}
                />
              </div>

              {/* Subcontractor Type Distribution */}
              {subcontractorStats.typeData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Taşeron/Tedarikçi Dağılımı</CardTitle>
                    <CardDescription>Türe göre taşeron ve tedarikçi sayıları</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie
                          data={subcontractorStats.typeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {subcontractorStats.typeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Subcontractor Performance Table */}
              {subcontractorStats.performanceData.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Taşeron Performansı (Puantaj Verilerine Göre)</CardTitle>
                      <CardDescription>Taşeronların çalışma istatistikleri</CardDescription>
                    </div>
                    <ExportToExcel 
                      data={subcontractorExportData} 
                      filename="taseron_performans" 
                      sheetName="Taşeron Performansı"
                      documentTitle="TAŞERON PERFORMANS ANALİZİ"
                      testId="button-export-subcontractor-excel"
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Taşeron Adı</TableHead>
                          <TableHead className="text-center">Proje Sayısı</TableHead>
                          <TableHead className="text-center">Çalışma Günü</TableHead>
                          <TableHead className="text-center">Toplam İşçi-Gün</TableHead>
                          <TableHead className="text-right">Ort. İşçi/Gün</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subcontractorStats.performanceData.map((sub) => (
                          <TableRow 
                            key={sub.subcontractorId}
                            className="cursor-pointer"
                            onClick={() => setLocation(`/taseronlar?id=${sub.subcontractorId}`)}
                            data-testid={`row-subcontractor-${sub.subcontractorId}`}
                          >
                            <TableCell className="font-medium">{sub.name}</TableCell>
                            <TableCell className="text-center">{sub.projectCount}</TableCell>
                            <TableCell className="text-center">{sub.workDays}</TableCell>
                            <TableCell className="text-center">{sub.totalWorkers.toLocaleString('tr-TR')}</TableCell>
                            <TableCell className="text-right font-mono">
                              {sub.avgWorkersPerDay.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Budget Analysis Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard
                  title="Planlanan Bütçe"
                  value={formatCurrency(budgetAnalysis.totalPlanned)}
                  icon={Target}
                />
                <StatsCard
                  title="Gerçekleşen"
                  value={formatCurrency(budgetAnalysis.totalActual)}
                  icon={Wallet}
                />
                <StatsCard
                  title="Bütçe Sapması"
                  value={formatCurrency(budgetAnalysis.totalVariance)}
                  icon={budgetAnalysis.totalVariance >= 0 ? TrendingUp : TrendingDown}
                  description={`%${budgetAnalysis.variancePercent.toFixed(1)} ${budgetAnalysis.totalVariance >= 0 ? 'tasarruf' : 'aşım'}`}
                />
                <StatsCard
                  title="Bütçe Kalemi"
                  value={budgetAnalysis.itemCount}
                  icon={ClipboardList}
                />
              </div>

              {/* Budget by Project */}
              {budgetAnalysis.byProject.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Proje Bazlı Bütçe Karşılaştırması</CardTitle>
                    <CardDescription>Planlanan vs Gerçekleşen bütçe analizi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={budgetAnalysis.byProject.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar dataKey="plannedBudget" name="Planlanan" fill={CORPORATE_COLORS.primary} />
                        <Bar dataKey="actualSpent" name="Gerçekleşen" fill={CORPORATE_COLORS.success} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Budget by Work Group */}
              {budgetAnalysis.byWorkGroup.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>İş Grubu Bazlı Bütçe Analizi</CardTitle>
                      <CardDescription>İş gruplarına göre planlanan vs gerçekleşen</CardDescription>
                    </div>
                    <ExportToExcel 
                      data={budgetExportData} 
                      filename="butce_analizi" 
                      sheetName="Bütçe Analizi"
                      documentTitle="İŞ GRUBU BAZLI BÜTÇE ANALİZİ"
                      testId="button-export-budget-excel"
                    />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>İş Grubu</TableHead>
                          <TableHead className="text-right">Planlanan</TableHead>
                          <TableHead className="text-right">Gerçekleşen</TableHead>
                          <TableHead className="text-right">Sapma</TableHead>
                          <TableHead className="text-right">Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {budgetAnalysis.byWorkGroup.map((group) => (
                          <TableRow key={group.name}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(group.planned)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(group.actual)}</TableCell>
                            <TableCell className={`text-right font-mono ${group.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(group.variance)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={group.variance >= 0 ? "default" : "destructive"}>
                                {group.variance >= 0 ? 'Bütçe Altı' : 'Bütçe Aşımı'}
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
              {tasks.length === 0 && timesheets.length === 0 && siteDiaryEntries.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Henüz operasyonel veri bulunmuyor</p>
                      <p className="text-sm">Görev, puantaj veya şantiye defteri ekleyerek raporlarınızı görüntüleyebilirsiniz</p>
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
                      <CardTitle>
                        Proje Özet İstatistikleri
                        {selectedProjectId !== "all" && (
                          <span className="text-primary ml-2">- {selectedProjectName}</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {selectedProjectId !== "all" 
                          ? `${selectedProjectName} proje bilgileri`
                          : "Genel proje bilgileri"
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Toplam Proje Sayısı</p>
                        <p className="text-3xl font-bold">{filteredProjects.length}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Aktif Projeler</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {filteredProjects.filter(p => p.status === "Devam Ediyor").length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Tamamlanan</p>
                          <p className="text-2xl font-bold text-green-600">
                            {filteredProjects.filter(p => p.status === "Tamamlandı").length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detailed Project Table */}
              {filteredProjects.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>
                        Proje Detayları
                        {selectedProjectId !== "all" && (
                          <span className="text-primary ml-2">- {selectedProjectName}</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {selectedProjectId !== "all" 
                          ? `${selectedProjectName} projesinin detaylı bilgileri`
                          : "Tüm projelerin detaylı bilgileri"
                        }
                      </CardDescription>
                    </div>
                    <ExportToExcel 
                      data={projectExportData} 
                      filename="proje_detaylari" 
                      sheetName="Proje Detayları"
                      documentTitle="PROJE DETAYLARI"
                      testId="button-export-projects-excel"
                    />
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
                        {filteredProjects.map((project) => (
                          <TableRow 
                            key={project.id}
                            className="cursor-pointer"
                            onClick={() => setLocation(`/projeler/${project.id}`)}
                            data-testid={`row-project-detail-${project.id}`}
                          >
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>{project.location}</TableCell>
                            <TableCell className="text-right font-mono">
                              {project.area ? safeNumber(project.area).toLocaleString('tr-TR') : '-'}
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
              {filteredProjects.length === 0 && (
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

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <>
              {/* Cash Flow Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard
                  title="Mevcut Bakiye"
                  value={formatCurrency(cashflowData.currentBalance)}
                  icon={Wallet}
                  description={cashflowData.currentBalance >= 0 ? "Pozitif" : "Negatif"}
                />
                <StatsCard
                  title="Tahmini Bakiye"
                  value={formatCurrency(cashflowData.projectedBalance)}
                  icon={Target}
                  description="6 Aylık projeksiyon"
                />
                <StatsCard
                  title="Beklenen Gelir"
                  value={formatCurrency(cashflowData.totalPlannedIncome)}
                  icon={TrendingUp}
                  description={`${cashflowData.pendingPayments.filter(p => p.type === 'Gelir').length} bekleyen ödeme`}
                />
                <StatsCard
                  title="Beklenen Gider"
                  value={formatCurrency(cashflowData.totalPlannedExpense)}
                  icon={TrendingDown}
                  description={`${cashflowData.pendingPayments.filter(p => p.type === 'Gider').length} bekleyen ödeme`}
                />
              </div>

              {/* Overdue Payments Warning */}
              {cashflowData.overduePayments.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      Gecikmiş Ödemeler ({cashflowData.overduePayments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cashflowData.overduePayments.slice(0, 5).map((payment) => {
                        const project = projects.find(p => p.id === payment.projectId);
                        return (
                          <div key={payment.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded-md">
                            <div>
                              <span className="font-medium">{payment.description}</span>
                              <span className="text-sm text-muted-foreground ml-2">({project?.name || '-'})</span>
                            </div>
                            <div className="text-right">
                              <Badge variant={payment.type === 'Gelir' ? 'default' : 'secondary'}>
                                {payment.type}
                              </Badge>
                              <span className="ml-2 font-mono">
                                {safeNumber(payment.plannedAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cash Flow Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Nakit Akış Projeksiyonu (6 Ay)
                  </CardTitle>
                  <CardDescription>
                    Planlanan ödemeler ve kümülatif bakiye tahmini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cashflowData.months}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                        <Tooltip
                          formatter={(value: number) =>
                            `${value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`
                          }
                          labelFormatter={(label) => `Dönem: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="planned" name="Planlanan Net" fill="hsl(var(--primary))" />
                        <Bar dataKey="actual" name="Gerçekleşen Net" fill="hsl(var(--accent))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cumulative Balance Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Kümülatif Bakiye Tahmini
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashflowData.months}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                        <Tooltip
                          formatter={(value: number) =>
                            `${value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`
                          }
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="cumulative"
                          name="Kümülatif Bakiye"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Breakdown Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Aylık Detay</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dönem</TableHead>
                        <TableHead className="text-right">Planlanan Net</TableHead>
                        <TableHead className="text-right">Gerçekleşen Net</TableHead>
                        <TableHead className="text-right">Kümülatif Bakiye</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashflowData.months.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium">{month.month}</TableCell>
                          <TableCell className={`text-right font-mono ${month.planned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {month.planned.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </TableCell>
                          <TableCell className={`text-right font-mono ${month.actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {month.actual.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </TableCell>
                          <TableCell className={`text-right font-mono font-bold ${month.cumulative >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {month.cumulative.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Empty State */}
              {paymentPlans.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Henüz ödeme planı bulunmuyor</p>
                      <p className="text-sm">Ödeme planları ekleyerek nakit akış projeksiyonlarınızı görüntüleyebilirsiniz</p>
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
                
                const totalAmount = filteredPayments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
                const totalGross = filteredPayments.reduce((sum, p) => {
                  const amount = safeNumber(p.amount);
                  const feeRate = safeNumber(p.contractorFeeRate);
                  const gross = safeNumber(p.grossAmount) || (amount + (amount * feeRate / 100));
                  return sum + gross;
                }, 0);
                const totalAdvanceDeduction = filteredPayments.reduce((sum, p) => sum + safeNumber(p.advanceDeduction), 0);
                const totalNetPayment = filteredPayments.reduce((sum, p) => {
                  const gross = safeNumber(p.grossAmount);
                  const deduction = safeNumber(p.advanceDeduction);
                  const net = safeNumber(p.netPayment) || (gross - deduction);
                  return sum + net;
                }, 0);
                const totalReceived = filteredPayments.reduce((sum, p) => sum + safeNumber(p.receivedAmount), 0);
                
                return (
                  <>
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <StatsCard
                        title="Toplam Hakediş"
                        value={`${totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                        icon={Receipt}
                      />
                      <StatsCard
                        title="Brüt Tutar"
                        value={`${totalGross.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                        icon={TrendingUp}
                        description="Müteahhitlik ücreti dahil"
                      />
                      <StatsCard
                        title="Avans Kesintisi"
                        value={`${totalAdvanceDeduction.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                        icon={TrendingDown}
                      />
                      <StatsCard
                        title="Net Ödeme"
                        value={`${totalNetPayment.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                        icon={DollarSign}
                        description="Ödenecek tutar"
                      />
                      <StatsCard
                        title="Alınan Ödemeler"
                        value={`${totalReceived.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                        icon={CheckCircle2}
                      />
                    </div>
                  </>
                );
              })()}

              {/* Status Distribution Chart - Filtered by selected project */}
              {(() => {
                const chartPayments = selectedProjectId !== "all" 
                  ? progressPayments.filter(p => p.projectId === selectedProjectId)
                  : progressPayments;
                
                if (chartPayments.length === 0) return null;
                
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Hakediş Durumu Dağılımı
                        {selectedProjectId !== "all" && (
                          <span className="text-primary text-base font-normal">- {selectedProjectName}</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {selectedProjectId !== "all" 
                          ? `${selectedProjectName} projesinin ödeme durumlarına göre hakediş sayıları`
                          : "Ödeme durumlarına göre hakediş sayıları"
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RePieChart>
                          <Pie
                            data={[
                              { name: 'Bekliyor', value: chartPayments.filter(p => p.status === 'Bekliyor').length },
                              { name: 'Kısmi Ödendi', value: chartPayments.filter(p => p.status === 'Kısmi Ödendi').length },
                              { name: 'Ödendi', value: chartPayments.filter(p => p.status === 'Ödendi').length }
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
                );
              })()}

              {/* Payments by Project - Filtered by selected project */}
              {(() => {
                const tablePayments = selectedProjectId !== "all" 
                  ? progressPayments.filter(p => p.projectId === selectedProjectId)
                  : progressPayments;
                
                const relevantProjects = selectedProjectId !== "all"
                  ? projects.filter(p => p.id === selectedProjectId)
                  : projects.filter(project => progressPayments.some(p => p.projectId === project.id));
                
                if (relevantProjects.length === 0) return null;
                
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FolderKanban className="h-5 w-5" />
                        Projelere Göre Hakediş Özeti
                        {selectedProjectId !== "all" && (
                          <span className="text-primary text-base font-normal">- {selectedProjectName}</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {selectedProjectId !== "all" 
                          ? `${selectedProjectName} projesinin toplam hakediş tutarları ve ödeme durumu`
                          : "Her projenin toplam hakediş tutarları ve ödeme durumu"
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Proje Adı</TableHead>
                            <TableHead className="text-right">Hakediş Sayısı</TableHead>
                            <TableHead className="text-right w-[200px] min-w-[200px]">Toplam Tutar</TableHead>
                            <TableHead className="text-right w-[200px] min-w-[200px]">Alınan</TableHead>
                            <TableHead className="text-right w-[200px] min-w-[200px]">Kalan</TableHead>
                            <TableHead className="text-right">Tamamlanma</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {relevantProjects.map(project => {
                            const projectPayments = tablePayments.filter(p => p.projectId === project.id);
                            const totalAmount = projectPayments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
                            const totalReceived = projectPayments.reduce((sum, p) => sum + safeNumber(p.receivedAmount), 0);
                            const remaining = totalAmount - totalReceived;
                            const completionRate = totalAmount > 0 ? (totalReceived / totalAmount) * 100 : 0;

                            return (
                              <TableRow 
                                key={project.id}
                                className="cursor-pointer"
                                onClick={() => setLocation("/hakedis")}
                                data-testid={`row-hakedis-project-${project.id}`}
                              >
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
                );
              })()}

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
