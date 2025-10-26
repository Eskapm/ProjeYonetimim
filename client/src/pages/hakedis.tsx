import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar as CalendarIcon, Loader2, Edit2, Trash2, FileText, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertProgressPaymentSchema, 
  progressPaymentStatusEnum,
  type InsertProgressPayment, 
  type ProgressPayment, 
  type Project,
  type Transaction
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PrintButton } from "@/components/print-button";

export default function Hakedis() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ProgressPayment | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [viewingPaymentDetail, setViewingPaymentDetail] = useState<ProgressPayment | null>(null);
  const { toast} = useToast();

  // Fetch progress payments
  const { data: payments = [], isLoading: isLoadingPayments, error: paymentsError } = useQuery<ProgressPayment[]>({
    queryKey: ["/api/progress-payments"],
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch transactions
  const { data: allTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Create form
  const form = useForm<InsertProgressPayment>({
    resolver: zodResolver(insertProgressPaymentSchema),
    defaultValues: {
      projectId: "",
      paymentNumber: 1,
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "0",
      receivedAmount: "0",
      status: "Bekliyor",
      transactionIds: [],
    },
  });

  // Filter expense transactions for selected project
  const projectExpenseTransactions = useMemo(() => {
    const projectId = form.watch("projectId");
    if (!projectId) return [];
    
    return allTransactions.filter(
      (t) => t.projectId === projectId && t.type === "Gider"
    );
  }, [allTransactions, form.watch("projectId")]);

  // Calculate remaining advance for selected project
  const remainingAdvance = useMemo(() => {
    const selectedProjectId = form.watch("projectId");
    if (!selectedProjectId) return { total: 0, used: 0, remaining: 0 };
    
    const project = projects.find(p => p.id === selectedProjectId);
    const totalAdvance = parseFloat(project?.advancePayment as string || "0");
    
    // Sum all advance deductions for this project (excluding current editing payment)
    const usedAdvance = payments
      .filter(p => p.projectId === selectedProjectId && p.id !== editingPayment?.id)
      .reduce((sum, p) => sum + parseFloat(p.advanceDeduction as string || "0"), 0);
    
    return {
      total: totalAdvance,
      used: usedAdvance,
      remaining: totalAdvance - usedAdvance
    };
  }, [form.watch("projectId"), projects, payments, editingPayment]);

  // Calculate total amount from selected transactions
  useEffect(() => {
    const total = selectedTransactionIds.reduce((sum, id) => {
      const transaction = allTransactions.find((t) => t.id === id);
      return sum + (transaction ? parseFloat(transaction.amount as string) : 0);
    }, 0);
    
    form.setValue("amount", total.toFixed(2));
  }, [selectedTransactionIds, allTransactions, form]);

  // Auto-set advance deduction rate to 0 if no remaining advance
  useEffect(() => {
    if (remainingAdvance.remaining <= 0) {
      form.setValue("advanceDeductionRate", "0");
    }
  }, [remainingAdvance.remaining, form]);

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: InsertProgressPayment) => {
      const response = await apiRequest("POST", "/api/progress-payments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress-payments"] });
      toast({
        title: "Başarılı",
        description: "Hakediş kaydı başarıyla oluşturuldu",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Hakediş oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProgressPayment> }) => {
      const response = await apiRequest("PATCH", `/api/progress-payments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress-payments"] });
      toast({
        title: "Başarılı",
        description: "Hakediş kaydı başarıyla güncellendi",
      });
      setIsDialogOpen(false);
      setEditingPayment(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Hakediş güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/progress-payments/${id}`);
      if (!response.ok) throw new Error("Hakediş silinemedi");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress-payments"] });
      toast({
        title: "Başarılı",
        description: "Hakediş kaydı başarıyla silindi",
      });
      setDeletePaymentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Hakediş silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const project = projects.find(p => p.id === payment.projectId);
      const projectName = project?.name || "";
      const matchesSearch =
        searchTerm === "" ||
        projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paymentNumber.toString().includes(searchTerm);

      const matchesProject = selectedProject === "all" || payment.projectId === selectedProject;
      const matchesStatus = selectedStatus === "all" || payment.status === selectedStatus;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [payments, projects, searchTerm, selectedProject, selectedStatus]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalAmount = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);
    const totalReceived = filteredPayments.reduce((sum, p) => sum + parseFloat(p.receivedAmount as string), 0);
    const pendingAmount = filteredPayments
      .filter(p => p.status === "Bekliyor")
      .reduce((sum, p) => sum + (parseFloat(p.amount as string) - parseFloat(p.receivedAmount as string)), 0);

    return { totalAmount, totalReceived, pendingAmount };
  }, [filteredPayments]);

  // Handlers
  const handleAddPayment = () => {
    form.reset({
      projectId: "",
      paymentNumber: 1,
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "0",
      receivedAmount: "0",
      status: "Bekliyor",
      transactionIds: [],
    });
    setSelectedTransactionIds([]);
    setEditingPayment(null);
    setIsDialogOpen(true);
  };

  const handleEditPayment = (payment: ProgressPayment) => {
    setEditingPayment(payment);
    const txIds = (payment.transactionIds as string[]) || [];
    setSelectedTransactionIds(txIds);
    form.reset({
      projectId: payment.projectId,
      paymentNumber: payment.paymentNumber,
      date: payment.date as string,
      description: payment.description,
      amount: payment.amount as string,
      receivedAmount: payment.receivedAmount as string,
      status: payment.status,
      transactionIds: txIds,
      contractorFeeRate: payment.contractorFeeRate as string,
      grossAmount: payment.grossAmount as string,
      advanceDeductionRate: payment.advanceDeductionRate as string,
      advanceDeduction: payment.advanceDeduction as string,
      netPayment: payment.netPayment as string,
    });
    setIsDialogOpen(true);
  };

  const handleDeletePayment = (id: string) => {
    setDeletePaymentId(id);
  };

  const confirmDelete = () => {
    if (deletePaymentId) {
      deletePaymentMutation.mutate(deletePaymentId);
    }
  };

  const onSubmit = (data: InsertProgressPayment) => {
    const submitData = {
      ...data,
      transactionIds: selectedTransactionIds,
    };
    
    if (editingPayment) {
      updatePaymentMutation.mutate({ id: editingPayment.id, data: submitData });
    } else {
      createPaymentMutation.mutate(submitData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hakediş</h1>
          <p className="text-muted-foreground mt-1">Proje bazlı hakediş ve ödeme yönetimi</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Button onClick={handleAddPayment} data-testid="button-add-payment">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Hakediş Ekle
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Proje, açıklama veya hakediş numarasında ara..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-payment"
            />
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-project-filter">
              <SelectValue placeholder="Proje" />
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
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              {progressPaymentStatusEnum.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Hakediş</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono" data-testid="text-total-amount">
                {summary.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredPayments.length} kayıt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tahsil Edilen</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-green-600" data-testid="text-total-received">
                {summary.totalReceived.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Toplam ödenen tutar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Ödeme</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-orange-600" data-testid="text-pending-amount">
                {summary.pendingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ödenmemiş tutar
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hakediş Listesi</CardTitle>
          <CardDescription>
            Tüm proje hakedişleri ve ödeme durumları
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPayments ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : paymentsError ? (
            <div className="py-12 text-center text-destructive">
              Veriler yüklenirken bir hata oluştu
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {payments.length === 0 ? "Henüz hakediş kaydı eklenmemiş" : "Hakediş kaydı bulunamadı"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hakediş No</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">Müt. %</TableHead>
                    <TableHead className="text-right">Brüt Tutar</TableHead>
                    <TableHead className="text-right">Avans Kesinti</TableHead>
                    <TableHead className="text-right">Net Ödeme</TableHead>
                    <TableHead className="text-right">Tahsil</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const project = projects.find(p => p.id === payment.projectId);
                    const amount = parseFloat(payment.amount as string);
                    const contractorFeeRate = parseFloat(payment.contractorFeeRate as string) || 0;
                    const grossAmount = parseFloat(payment.grossAmount as string) || (amount + (amount * contractorFeeRate / 100));
                    const advanceDeduction = parseFloat(payment.advanceDeduction as string) || 0;
                    const netPayment = parseFloat(payment.netPayment as string) || (grossAmount - advanceDeduction);
                    const receivedAmount = parseFloat(payment.receivedAmount as string);
                    
                    return (
                      <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                        <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {project?.name || "Bilinmiyor"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(payment.date as string), "dd MMM yyyy", { locale: tr })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {contractorFeeRate > 0 ? `%${contractorFeeRate.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {grossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                        </TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                          {advanceDeduction > 0 ? `-${advanceDeduction.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-primary">
                          {netPayment.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {receivedAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              payment.status === "Ödendi" ? "default" : 
                              payment.status === "Kısmi Ödendi" ? "secondary" : 
                              "outline"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingPaymentDetail(payment)}
                              data-testid={`button-view-${payment.id}`}
                              title="Detayları görüntüle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPayment(payment)}
                              data-testid={`button-edit-${payment.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePayment(payment.id)}
                              data-testid={`button-delete-${payment.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? "Hakediş Kaydını Düzenle" : "Yeni Hakediş Kaydı"}
            </DialogTitle>
            <DialogDescription>
              Hakediş bilgilerini girin. * işaretli alanlar zorunludur.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project */}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proje *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project">
                            <SelectValue placeholder="Proje seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Number */}
                <FormField
                  control={form.control}
                  name="paymentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hakediş No *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-payment-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tarih *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-date-picker"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(parseISO(field.value as string), "dd MMM yyyy", { locale: tr }) : "Tarih seçin"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? parseISO(field.value as string) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString().split("T")[0] || "")}
                            locale={tr}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durum *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {progressPaymentStatusEnum.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount - Auto-calculated from selected transactions */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hakediş Tutarı (TL) *</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          value={parseFloat(field.value || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          readOnly
                          className="bg-muted font-mono font-semibold"
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seçilen gider kalemlerinin toplamı
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contractor Fee Rate */}
                <FormField
                  control={form.control}
                  name="contractorFeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Müteahhitlik Oranı (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-contractor-fee-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gross Amount (calculated) */}
                <FormField
                  control={form.control}
                  name="grossAmount"
                  render={({ field }) => {
                    const amount = parseFloat(form.watch("amount") || "0");
                    const contractorFeeRate = parseFloat(form.watch("contractorFeeRate") || "0");
                    const grossAmount = amount + (amount * contractorFeeRate / 100);
                    
                    // Update form value
                    if (field.value !== grossAmount.toFixed(2)) {
                      form.setValue("grossAmount", grossAmount.toFixed(2));
                    }

                    return (
                      <FormItem>
                        <FormLabel>Brüt Tutar (TL)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={grossAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            readOnly
                            className="bg-muted"
                            data-testid="input-gross-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Advance Deduction Rate */}
                <FormField
                  control={form.control}
                  name="advanceDeductionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avans Kesinti Oranı (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          disabled={remainingAdvance.remaining <= 0}
                          data-testid="input-advance-deduction-rate"
                        />
                      </FormControl>
                      {remainingAdvance.remaining <= 0 && (
                        <p className="text-xs text-destructive">
                          Proje avansı tükenmiştir, kesinti yapılamaz
                        </p>
                      )}
                      {remainingAdvance.total > 0 && (
                        <div className="text-xs space-y-1 mt-2 p-3 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Toplam Avans:</span>
                            <span className="font-mono font-medium">
                              {remainingAdvance.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Kullanılan:</span>
                            <span className="font-mono text-destructive">
                              -{remainingAdvance.used.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span className="text-muted-foreground font-semibold">Kalan Avans:</span>
                            <span className="font-mono font-bold text-green-600">
                              {remainingAdvance.remaining.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                            </span>
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Advance Deduction (calculated) */}
                <FormField
                  control={form.control}
                  name="advanceDeduction"
                  render={({ field }) => {
                    const amount = parseFloat(form.watch("amount") || "0");
                    const contractorFeeRate = parseFloat(form.watch("contractorFeeRate") || "0");
                    const advanceDeductionRate = parseFloat(form.watch("advanceDeductionRate") || "0");
                    const grossAmount = amount + (amount * contractorFeeRate / 100);
                    const advanceDeduction = grossAmount * (advanceDeductionRate / 100);
                    
                    // Update form value
                    if (field.value !== advanceDeduction.toFixed(2)) {
                      form.setValue("advanceDeduction", advanceDeduction.toFixed(2));
                    }

                    return (
                      <FormItem>
                        <FormLabel>Avans Kesintisi (TL)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={advanceDeduction.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            readOnly
                            className="bg-muted"
                            data-testid="input-advance-deduction"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Net Payment (calculated) */}
                <FormField
                  control={form.control}
                  name="netPayment"
                  render={({ field }) => {
                    const amount = parseFloat(form.watch("amount") || "0");
                    const contractorFeeRate = parseFloat(form.watch("contractorFeeRate") || "0");
                    const advanceDeductionRate = parseFloat(form.watch("advanceDeductionRate") || "0");
                    const grossAmount = amount + (amount * contractorFeeRate / 100);
                    const advanceDeduction = grossAmount * (advanceDeductionRate / 100);
                    const netPayment = grossAmount - advanceDeduction;
                    
                    // Update form value
                    if (field.value !== netPayment.toFixed(2)) {
                      form.setValue("netPayment", netPayment.toFixed(2));
                    }

                    return (
                      <FormItem>
                        <FormLabel>Net Ödeme (TL)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={netPayment.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            readOnly
                            className="bg-muted font-semibold"
                            data-testid="input-net-payment"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Received Amount */}
                <FormField
                  control={form.control}
                  name="receivedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahsil Edilen Tutar (TL) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-received-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Transaction Selection */}
              {projectExpenseTransactions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Gider Kalemleri Seçimi</label>
                    <Badge variant="secondary">
                      {selectedTransactionIds.length} / {projectExpenseTransactions.length} seçildi
                    </Badge>
                  </div>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Açıklama</TableHead>
                          <TableHead>İş Grubu</TableHead>
                          <TableHead className="text-right">Tutar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectExpenseTransactions.map((transaction) => (
                          <TableRow key={transaction.id} className="hover-elevate">
                            <TableCell>
                              <Checkbox
                                checked={selectedTransactionIds.includes(transaction.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTransactionIds([...selectedTransactionIds, transaction.id]);
                                  } else {
                                    setSelectedTransactionIds(selectedTransactionIds.filter(id => id !== transaction.id));
                                  }
                                }}
                                data-testid={`checkbox-transaction-${transaction.id}`}
                              />
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(parseISO(transaction.date as string), "dd MMM yyyy", { locale: tr })}
                            </TableCell>
                            <TableCell className="text-sm">{transaction.description}</TableCell>
                            <TableCell className="text-sm">
                              <Badge variant="outline" className="text-xs">
                                {transaction.isGrubu || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {parseFloat(transaction.amount as string).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hakediş kapsamına dahil edilecek gider kalemlerini seçin. Tutar otomatik hesaplanacaktır.
                  </p>
                </div>
              )}

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Gerçekleştirilen işlerin detayları..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending}
                  data-testid="button-save"
                >
                  {(createPaymentMutation.isPending || updatePaymentMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPayment ? "Güncelle" : "Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletePaymentId !== null} onOpenChange={(open) => !open && setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hakediş kaydını silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Hakediş kaydı kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePaymentMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deletePaymentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Detail Dialog */}
      <Dialog open={viewingPaymentDetail !== null} onOpenChange={(open) => !open && setViewingPaymentDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Hakediş Detayları - #{viewingPaymentDetail?.paymentNumber}</DialogTitle>
                <DialogDescription>
                  {projects.find(p => p.id === viewingPaymentDetail?.projectId)?.name || "Proje"} - Hakediş kalem dökümü ve özeti
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="no-print"
                data-testid="button-print-hakedis"
              >
                <FileText className="h-4 w-4 mr-2" />
                Yazdır
              </Button>
            </div>
          </DialogHeader>

          {viewingPaymentDetail && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Toplam Tutar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold font-mono">
                      {parseFloat(viewingPaymentDetail.amount as string).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Müteahhitlik Karı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold font-mono text-blue-600">
                      +{((parseFloat(viewingPaymentDetail.grossAmount as string || "0") - parseFloat(viewingPaymentDetail.amount as string))).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                    </p>
                    <p className="text-xs text-muted-foreground">
                      %{parseFloat(viewingPaymentDetail.contractorFeeRate as string || "0").toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Brüt Tutar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold font-mono text-primary">
                      {parseFloat(viewingPaymentDetail.grossAmount as string || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Net Ödeme</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold font-mono text-green-600">
                      {parseFloat(viewingPaymentDetail.netPayment as string || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avans kesintisi: {parseFloat(viewingPaymentDetail.advanceDeduction as string || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction Items */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Hakediş Kapsamındaki Gider Kalemleri</h3>
                {(() => {
                  const txIds = (viewingPaymentDetail.transactionIds as string[]) || [];
                  const transactions = allTransactions.filter(t => txIds.includes(t.id));
                  
                  if (transactions.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        Bu hakediş için seçilmiş gider kalemi bulunmuyor
                      </p>
                    );
                  }

                  return (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead>İş Grubu</TableHead>
                            <TableHead>Rayiç Grubu</TableHead>
                            <TableHead className="text-right">Tutar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="text-sm">
                                {format(parseISO(transaction.date as string), "dd MMM yyyy", { locale: tr })}
                              </TableCell>
                              <TableCell className="text-sm">{transaction.description}</TableCell>
                              <TableCell className="text-sm">
                                <Badge variant="outline" className="text-xs">
                                  {transaction.isGrubu || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                <Badge variant="outline" className="text-xs">
                                  {transaction.rayicGrubu || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {parseFloat(transaction.amount as string).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-semibold bg-muted/50">
                            <TableCell colSpan={4} className="text-right">Toplam</TableCell>
                            <TableCell className="text-right font-mono">
                              {transactions.reduce((sum, t) => sum + parseFloat(t.amount as string), 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Açıklama</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                  {viewingPaymentDetail.description}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
